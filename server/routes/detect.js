const express = require('express');
const multer = require('multer');
const { detectObjects } = require('../utils/huggingface');
const { maxUploadBytes, allowedMimeTypes } = require('../config');

const router = express.Router();

// Keep uploads in memory only — we forward the buffer straight to the
// Hugging Face API and never need to persist the file on disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type. Please upload a JPEG, PNG, or WebP image.'));
    }
    cb(null, true);
  },
});

const MIN_CONFIDENCE = 0.5;

router.post('/', (req, res) => {
  upload.single('image')(req, res, async (uploadError) => {
    if (uploadError) {
      const message =
        uploadError.code === 'LIMIT_FILE_SIZE'
          ? 'Image is too large. Maximum size is 5MB.'
          : uploadError.message;
      return res.status(400).json({ error: message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image was uploaded.' });
    }

    try {
      const predictions = await detectObjects(req.file.buffer, req.file.mimetype);

      const objects = (Array.isArray(predictions) ? predictions : [])
        .filter((p) => p.score >= MIN_CONFIDENCE)
        .map((p) => ({
          label: p.label,
          confidence: Math.round(p.score * 1000) / 10, // one decimal place, in %
        }))
        .sort((a, b) => b.confidence - a.confidence);

      res.json({ objects });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });
});

module.exports = router;
