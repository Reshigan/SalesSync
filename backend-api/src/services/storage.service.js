const AWS = require('aws-sdk');
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');

// Configure S3 or S3-compatible storage (MinIO)
const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT || 'https://s3.amazonaws.com',
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  s3ForcePathStyle: true, // Required for MinIO
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.S3_BUCKET || 'salessync-media';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

class StorageService {
  /**
   * Upload image with compression and thumbnail generation
   */
  async uploadImage(buffer, originalName, options = {}) {
    const {
      tenantId,
      folder = 'uploads',
      generateThumbnail = true,
      maxWidth = 1920,
      quality = 85
    } = options;

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Generate unique filename
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${tenantId}/${folder}/${Date.now()}-${hash}${ext}`;

    // Compress image
    const compressed = await sharp(buffer)
      .resize(maxWidth, null, { withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    // Upload original (compressed)
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: compressed,
      ContentType: 'image/jpeg',
      ACL: 'private'
    };

    await s3.upload(uploadParams).promise();

    const result = {
      url: filename,
      size: compressed.length,
      originalSize: buffer.length,
      compressionRatio: ((1 - compressed.length / buffer.length) * 100).toFixed(1) + '%'
    };

    // Generate thumbnail if requested
    if (generateThumbnail) {
      const thumbnail = await sharp(buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailFilename = filename.replace(ext, `-thumb${ext}`);
      await s3.upload({
        ...uploadParams,
        Key: thumbnailFilename,
        Body: thumbnail
      }).promise();

      result.thumbnailUrl = thumbnailFilename;
    }

    return result;
  }

  /**
   * Generate signed URL for secure access
   */
  async getSignedUrl(key, expiresIn = 3600) {
    return s3.getSignedUrlPromise('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    });
  }

  /**
   * Delete file from storage
   */
  async deleteFile(key) {
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key
    }).promise();
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(keys) {
    if (keys.length === 0) return;

    await s3.deleteObjects({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: keys.map(key => ({ Key: key }))
      }
    }).promise();
  }

  /**
   * Check if bucket exists and create if not
   */
  async ensureBucket() {
    try {
      await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    } catch (err) {
      if (err.code === 'NotFound') {
        await s3.createBucket({ Bucket: BUCKET_NAME }).promise();
        console.log(`Created bucket: ${BUCKET_NAME}`);
      } else {
        throw err;
      }
    }
  }
}

module.exports = new StorageService();
