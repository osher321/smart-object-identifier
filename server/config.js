require('dotenv').config();

// Central place for environment-driven settings, so the rest of the
// app never touches process.env directly.
module.exports = {
  port: process.env.PORT || 3000,
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
  huggingFaceModel: process.env.HUGGINGFACE_MODEL || 'facebook/detr-resnet-50',
  maxUploadBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
};
