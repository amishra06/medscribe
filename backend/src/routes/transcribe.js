const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { transcribeAudio } = require('../services/deepgram');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.mp4', '.flac', '.aac'];
    
    if (allowedExts.includes(ext)) {
      return cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedExts.join(', ')}`));
    }
  }
});

// POST /api/transcribe
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    console.log('File received:', req.file.filename, 'Size:', req.file.size, 'bytes');

    // Transcribe the audio
    const result = await transcribeAudio(req.file.path);

    // Clean up: delete uploaded file after transcription
    fs.unlinkSync(req.file.path);

    if (result.success) {
      res.json({
        success: true,
        transcript: result.transcript,
        confidence: result.confidence,
        duration: result.duration,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Transcription route error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
