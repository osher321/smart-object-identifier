const axios = require('axios');
const { huggingFaceApiKey, huggingFaceModel } = require('../config');

// Hugging Face retired api-inference.huggingface.co in favor of this
// router, which dispatches to the free "hf-inference" provider.
const INFERENCE_URL = `https://router.huggingface.co/hf-inference/models/${huggingFaceModel}`;

// Free-tier HF models "cold start" and briefly return 503 with an
// estimated_time while they load. We wait that long (capped) and
// retry once instead of failing the user's request outright.
const MAX_WARMUP_WAIT_MS = 15000;

/**
 * Sends an image buffer to the Hugging Face object detection model
 * and returns the raw array of { label, score, box } predictions.
 */
async function detectObjects(imageBuffer, mimeType, { retryOnWarmup = true } = {}) {
  if (!huggingFaceApiKey) {
    const err = new Error(
      'Server is missing HUGGINGFACE_API_KEY. Add it to your .env file (see .env.example).'
    );
    err.status = 500;
    throw err;
  }

  try {
    const response = await axios.post(INFERENCE_URL, imageBuffer, {
      headers: {
        Authorization: `Bearer ${huggingFaceApiKey}`,
        // The router validates this against the image's real format —
        // a generic application/octet-stream is rejected.
        'Content-Type': mimeType,
      },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    const data = error.response?.data;
    const isWarmingUp =
      error.response?.status === 503 && data && /loading/i.test(data.error || '');

    if (isWarmingUp && retryOnWarmup) {
      const waitMs = Math.min((data.estimated_time || 5) * 1000, MAX_WARMUP_WAIT_MS);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return detectObjects(imageBuffer, mimeType, { retryOnWarmup: false });
    }

    const err = new Error(
      data?.error || 'Failed to reach the Hugging Face image recognition API.'
    );
    err.status = error.response?.status || 502;
    throw err;
  }
}

module.exports = { detectObjects };
