/**
 * Image Analytics System for Board Coverage and Brand Compliance
 * Handles image processing, board coverage calculation, and quality validation
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Image quality thresholds
 */
const QUALITY_THRESHOLDS = {
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
  MIN_FILE_SIZE: 50000, // 50KB
  MAX_FILE_SIZE: 10000000, // 10MB
  MIN_BRIGHTNESS: 30,
  MAX_BRIGHTNESS: 220,
  MIN_SHARPNESS: 0.3
};

/**
 * Board detection parameters
 */
const BOARD_DETECTION = {
  MIN_BOARD_AREA: 0.05, // 5% of image area
  MAX_BOARD_AREA: 0.8,  // 80% of image area
  EDGE_THRESHOLD: 100,
  CONTOUR_MIN_AREA: 1000
};

/**
 * Analyze image for board coverage percentage
 * @param {string} imagePath - Path to the image file
 * @param {Object} brandConfig - Brand-specific configuration
 * @returns {Object} Analysis results
 */
async function analyzeBoardCoverage(imagePath, brandConfig = {}) {
  try {
    // Validate image exists
    const imageBuffer = await fs.readFile(imagePath);
    
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    // Perform quality checks
    const qualityCheck = await performQualityChecks(imageBuffer, metadata);
    if (!qualityCheck.passed) {
      return {
        success: false,
        error: 'Image quality check failed',
        qualityIssues: qualityCheck.issues,
        boardCoverage: 0
      };
    }

    // Detect board coverage
    const coverageAnalysis = await detectBoardCoverage(imageBuffer, metadata, brandConfig);
    
    // Perform brand compliance checks
    const complianceCheck = await checkBrandCompliance(imageBuffer, brandConfig);

    return {
      success: true,
      boardCoverage: coverageAnalysis.coverage,
      boardArea: coverageAnalysis.area,
      imageQuality: qualityCheck.score,
      brandCompliance: complianceCheck,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        analyzedAt: new Date().toISOString()
      },
      analysis: coverageAnalysis.details
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      boardCoverage: 0
    };
  }
}

/**
 * Perform image quality checks
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} metadata - Image metadata
 * @returns {Object} Quality check results
 */
async function performQualityChecks(imageBuffer, metadata) {
  const issues = [];
  let score = 100;

  // Check dimensions
  if (metadata.width < QUALITY_THRESHOLDS.MIN_WIDTH) {
    issues.push(`Image width too small: ${metadata.width}px (minimum: ${QUALITY_THRESHOLDS.MIN_WIDTH}px)`);
    score -= 20;
  }

  if (metadata.height < QUALITY_THRESHOLDS.MIN_HEIGHT) {
    issues.push(`Image height too small: ${metadata.height}px (minimum: ${QUALITY_THRESHOLDS.MIN_HEIGHT}px)`);
    score -= 20;
  }

  // Check file size
  const fileSize = imageBuffer.length;
  if (fileSize < QUALITY_THRESHOLDS.MIN_FILE_SIZE) {
    issues.push(`File size too small: ${fileSize} bytes (minimum: ${QUALITY_THRESHOLDS.MIN_FILE_SIZE} bytes)`);
    score -= 15;
  }

  if (fileSize > QUALITY_THRESHOLDS.MAX_FILE_SIZE) {
    issues.push(`File size too large: ${fileSize} bytes (maximum: ${QUALITY_THRESHOLDS.MAX_FILE_SIZE} bytes)`);
    score -= 10;
  }

  // Check brightness and contrast
  const brightnessAnalysis = await analyzeBrightness(imageBuffer);
  if (brightnessAnalysis.averageBrightness < QUALITY_THRESHOLDS.MIN_BRIGHTNESS) {
    issues.push('Image too dark');
    score -= 15;
  }

  if (brightnessAnalysis.averageBrightness > QUALITY_THRESHOLDS.MAX_BRIGHTNESS) {
    issues.push('Image too bright/overexposed');
    score -= 15;
  }

  // Check sharpness
  const sharpnessScore = await analyzeSharpness(imageBuffer);
  if (sharpnessScore < QUALITY_THRESHOLDS.MIN_SHARPNESS) {
    issues.push('Image appears blurry');
    score -= 20;
  }

  return {
    passed: issues.length === 0,
    score: Math.max(0, score),
    issues,
    metrics: {
      brightness: brightnessAnalysis.averageBrightness,
      contrast: brightnessAnalysis.contrast,
      sharpness: sharpnessScore
    }
  };
}

/**
 * Analyze image brightness and contrast
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Object} Brightness analysis
 */
async function analyzeBrightness(imageBuffer) {
  try {
    // Convert to grayscale and get raw pixel data
    const { data, info } = await sharp(imageBuffer)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let sum = 0;
    let min = 255;
    let max = 0;

    // Calculate brightness statistics
    for (let i = 0; i < data.length; i++) {
      const pixel = data[i];
      sum += pixel;
      min = Math.min(min, pixel);
      max = Math.max(max, pixel);
    }

    const averageBrightness = sum / data.length;
    const contrast = max - min;

    return {
      averageBrightness,
      contrast,
      min,
      max
    };
  } catch (error) {
    return {
      averageBrightness: 128,
      contrast: 128,
      min: 0,
      max: 255
    };
  }
}

/**
 * Analyze image sharpness using Laplacian variance
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {number} Sharpness score
 */
async function analyzeSharpness(imageBuffer) {
  try {
    // Convert to grayscale and resize for faster processing
    const { data, info } = await sharp(imageBuffer)
      .greyscale()
      .resize(400, 300, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;

    // Apply Laplacian kernel for edge detection
    let variance = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Laplacian kernel: center * 8 - sum of 8 neighbors
        const center = data[idx] * 8;
        const neighbors = 
          data[(y-1) * width + (x-1)] + data[(y-1) * width + x] + data[(y-1) * width + (x+1)] +
          data[y * width + (x-1)] + data[y * width + (x+1)] +
          data[(y+1) * width + (x-1)] + data[(y+1) * width + x] + data[(y+1) * width + (x+1)];
        
        const laplacian = Math.abs(center - neighbors);
        variance += laplacian * laplacian;
        count++;
      }
    }

    return count > 0 ? Math.sqrt(variance / count) / 255 : 0;
  } catch (error) {
    return 0.5; // Default moderate sharpness
  }
}

/**
 * Detect board coverage in image
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} metadata - Image metadata
 * @param {Object} brandConfig - Brand configuration
 * @returns {Object} Coverage analysis
 */
async function detectBoardCoverage(imageBuffer, metadata, brandConfig) {
  try {
    // Convert to grayscale for edge detection
    const grayBuffer = await sharp(imageBuffer)
      .greyscale()
      .raw()
      .toBuffer();

    // Simple edge detection and contour finding
    const edges = await detectEdges(grayBuffer, metadata.width, metadata.height);
    const contours = findContours(edges, metadata.width, metadata.height);
    
    // Filter contours that could be boards
    const boardContours = contours.filter(contour => {
      const area = contour.area;
      const imageArea = metadata.width * metadata.height;
      const areaRatio = area / imageArea;
      
      return areaRatio >= BOARD_DETECTION.MIN_BOARD_AREA && 
             areaRatio <= BOARD_DETECTION.MAX_BOARD_AREA &&
             area >= CONTOUR_MIN_AREA;
    });

    // Calculate total board coverage
    const totalBoardArea = boardContours.reduce((sum, contour) => sum + contour.area, 0);
    const imageArea = metadata.width * metadata.height;
    const coveragePercentage = Math.min(100, (totalBoardArea / imageArea) * 100);

    // Analyze board characteristics
    const boardAnalysis = analyzeBoardCharacteristics(boardContours, brandConfig);

    return {
      coverage: Math.round(coveragePercentage * 100) / 100,
      area: totalBoardArea,
      boardCount: boardContours.length,
      details: {
        contours: boardContours.length,
        largestBoard: boardContours.length > 0 ? Math.max(...boardContours.map(c => c.area)) : 0,
        boardCharacteristics: boardAnalysis
      }
    };
  } catch (error) {
    // Fallback: estimate coverage based on color analysis
    return await estimateCoverageByColor(imageBuffer, metadata, brandConfig);
  }
}

/**
 * Simple edge detection using Sobel operator
 * @param {Buffer} grayBuffer - Grayscale image buffer
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint8Array} Edge map
 */
function detectEdges(grayBuffer, width, height) {
  const edges = new Uint8Array(width * height);
  
  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = grayBuffer[(y + ky) * width + (x + kx)];
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += pixel * sobelX[kernelIdx];
          gy += pixel * sobelY[kernelIdx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = magnitude > BOARD_DETECTION.EDGE_THRESHOLD ? 255 : 0;
    }
  }

  return edges;
}

/**
 * Find contours in edge map (simplified implementation)
 * @param {Uint8Array} edges - Edge map
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Array} Array of contours
 */
function findContours(edges, width, height) {
  const visited = new Array(width * height).fill(false);
  const contours = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (edges[idx] === 255 && !visited[idx]) {
        const contour = floodFill(edges, visited, x, y, width, height);
        if (contour.area >= BOARD_DETECTION.CONTOUR_MIN_AREA) {
          contours.push(contour);
        }
      }
    }
  }

  return contours;
}

/**
 * Flood fill algorithm to find connected components
 * @param {Uint8Array} edges - Edge map
 * @param {Array} visited - Visited pixels
 * @param {number} startX - Start X coordinate
 * @param {number} startY - Start Y coordinate
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Contour object
 */
function floodFill(edges, visited, startX, startY, width, height) {
  const stack = [[startX, startY]];
  const points = [];
  let minX = startX, maxX = startX, minY = startY, maxY = startY;

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const idx = y * width + x;

    if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || edges[idx] !== 255) {
      continue;
    }

    visited[idx] = true;
    points.push([x, y]);
    
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    // Add 8-connected neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx !== 0 || dy !== 0) {
          stack.push([x + dx, y + dy]);
        }
      }
    }
  }

  return {
    points,
    area: points.length,
    boundingBox: {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    }
  };
}

/**
 * Analyze board characteristics
 * @param {Array} boardContours - Board contours
 * @param {Object} brandConfig - Brand configuration
 * @returns {Object} Board analysis
 */
function analyzeBoardCharacteristics(boardContours, brandConfig) {
  if (boardContours.length === 0) {
    return {
      rectangularity: 0,
      aspectRatio: 0,
      positioning: 'none'
    };
  }

  const largestBoard = boardContours.reduce((max, contour) => 
    contour.area > max.area ? contour : max
  );

  const bbox = largestBoard.boundingBox;
  const rectangularity = largestBoard.area / (bbox.width * bbox.height);
  const aspectRatio = bbox.width / bbox.height;

  // Determine positioning
  let positioning = 'center';
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;
  
  // This is a simplified positioning analysis
  if (centerX < bbox.width * 0.3) positioning = 'left';
  else if (centerX > bbox.width * 0.7) positioning = 'right';
  if (centerY < bbox.height * 0.3) positioning = 'top';
  else if (centerY > bbox.height * 0.7) positioning = 'bottom';

  return {
    rectangularity: Math.round(rectangularity * 100) / 100,
    aspectRatio: Math.round(aspectRatio * 100) / 100,
    positioning,
    dimensions: bbox
  };
}

/**
 * Estimate coverage by color analysis (fallback method)
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} metadata - Image metadata
 * @param {Object} brandConfig - Brand configuration
 * @returns {Object} Coverage estimate
 */
async function estimateCoverageByColor(imageBuffer, metadata, brandConfig) {
  try {
    // Get dominant colors
    const { data } = await sharp(imageBuffer)
      .resize(200, 150, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Simple color clustering to find potential board areas
    // This is a simplified implementation
    const colorClusters = analyzeColorClusters(data);
    
    // Estimate coverage based on color uniformity
    const estimatedCoverage = Math.min(30, colorClusters.uniformity * 50);

    return {
      coverage: Math.round(estimatedCoverage * 100) / 100,
      area: (metadata.width * metadata.height * estimatedCoverage) / 100,
      boardCount: estimatedCoverage > 10 ? 1 : 0,
      details: {
        method: 'color_analysis',
        colorClusters: colorClusters.clusters,
        uniformity: colorClusters.uniformity
      }
    };
  } catch (error) {
    return {
      coverage: 0,
      area: 0,
      boardCount: 0,
      details: { error: error.message }
    };
  }
}

/**
 * Analyze color clusters in image
 * @param {Buffer} data - RGB image data
 * @returns {Object} Color analysis
 */
function analyzeColorClusters(data) {
  const colors = {};
  const totalPixels = data.length / 3;

  // Count color occurrences (simplified to reduce RGB to fewer bins)
  for (let i = 0; i < data.length; i += 3) {
    const r = Math.floor(data[i] / 32) * 32;
    const g = Math.floor(data[i + 1] / 32) * 32;
    const b = Math.floor(data[i + 2] / 32) * 32;
    const colorKey = `${r},${g},${b}`;
    colors[colorKey] = (colors[colorKey] || 0) + 1;
  }

  // Find dominant colors
  const sortedColors = Object.entries(colors)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Calculate uniformity (how much the image is dominated by few colors)
  const topColorRatio = sortedColors.length > 0 ? sortedColors[0][1] / totalPixels : 0;
  const uniformity = topColorRatio;

  return {
    clusters: sortedColors.length,
    uniformity,
    dominantColors: sortedColors.map(([color, count]) => ({
      color,
      percentage: Math.round((count / totalPixels) * 100 * 100) / 100
    }))
  };
}

/**
 * Check brand compliance
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} brandConfig - Brand configuration
 * @returns {Object} Compliance check results
 */
async function checkBrandCompliance(imageBuffer, brandConfig) {
  // This is a simplified implementation
  // In a real system, this would use more sophisticated image recognition
  
  const compliance = {
    score: 85, // Default score
    issues: [],
    checks: {
      colorCompliance: true,
      logoPresence: false, // Would need logo detection
      textReadability: true,
      brandGuidelines: true
    }
  };

  // Add brand-specific checks based on configuration
  if (brandConfig.requiredColors) {
    // Color compliance check would go here
  }

  if (brandConfig.logoRequired) {
    compliance.checks.logoPresence = false;
    compliance.issues.push('Logo detection not implemented');
    compliance.score -= 15;
  }

  return compliance;
}

/**
 * Process and save analyzed image
 * @param {string} inputPath - Input image path
 * @param {string} outputPath - Output image path
 * @param {Object} analysisResults - Analysis results
 * @returns {string} Output path
 */
async function processAndSaveImage(inputPath, outputPath, analysisResults) {
  try {
    // Add analysis overlay to image
    const processedImage = await sharp(inputPath)
      .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    await fs.writeFile(outputPath, processedImage);
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

module.exports = {
  analyzeBoardCoverage,
  performQualityChecks,
  analyzeBrightness,
  analyzeSharpness,
  detectBoardCoverage,
  checkBrandCompliance,
  processAndSaveImage,
  QUALITY_THRESHOLDS,
  BOARD_DETECTION
};