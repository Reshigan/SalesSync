const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * Version endpoint
 * Returns build version, git commit, and deployment info
 */

function getVersionInfo() {
  const version = process.env.APP_VERSION || '1.0.0';
  const gitCommit = process.env.GIT_COMMIT || 'unknown';
  const buildDate = process.env.BUILD_DATE || new Date().toISOString();
  const environment = process.env.NODE_ENV || 'development';

  try {
    const versionFilePath = path.join(__dirname, '../../VERSION');
    if (fs.existsSync(versionFilePath)) {
      const versionFileContent = fs.readFileSync(versionFilePath, 'utf8').trim();
      const [fileVersion, fileCommit, fileBuildDate] = versionFileContent.split('|');
      return {
        version: fileVersion || version,
        gitCommit: fileCommit || gitCommit,
        buildDate: fileBuildDate || buildDate,
        environment,
        uptime: process.uptime(),
        nodeVersion: process.version
      };
    }
  } catch (error) {
  }

  return {
    version,
    gitCommit,
    buildDate,
    environment,
    uptime: process.uptime(),
    nodeVersion: process.version
  };
}

router.get('/', (req, res) => {
  try {
    const versionInfo = getVersionInfo();
    res.json({
      success: true,
      data: versionInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve version information'
    });
  }
});

module.exports = router;
