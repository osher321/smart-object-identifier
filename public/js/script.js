// Smart Object Identifier — frontend logic.
// Handles drag & drop / file selection, uploads the image to the
// backend, and renders the detected objects with confidence bars.

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const resultSection = document.getElementById('result-section');
const previewImage = document.getElementById('preview-image');
const resetBtn = document.getElementById('reset-btn');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('error-box');
const objectsList = document.getElementById('objects-list');

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

// --- Upload zone interactions ---------------------------------------

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') fileInput.click();
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });
});

dropZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

resetBtn.addEventListener('click', resetUI);

// --- Core flow --------------------------------------------------------

function handleFile(file) {
  const validationError = validateFile(file);
  if (validationError) {
    showError(validationError);
    return;
  }

  showPreview(file);
  uploadAndDetect(file);
}

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload a JPEG, PNG, or WebP image.';
  }
  if (file.size > MAX_BYTES) {
    return 'Image is too large. Maximum size is 5MB.';
  }
  return null;
}

function showPreview(file) {
  resultSection.classList.remove('hidden');
  previewImage.src = URL.createObjectURL(file);
  objectsList.innerHTML = '';
  hideError();
  showLoading();
}

async function uploadAndDetect(file) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('/api/detect', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong while analyzing the image.');
    }

    renderObjects(data.objects);
  } catch (err) {
    showError(err.message || 'Network error — please check your connection and try again.');
  } finally {
    hideLoading();
  }
}

function renderObjects(objects) {
  objectsList.innerHTML = '';

  if (!objects || objects.length === 0) {
    objectsList.innerHTML = '<p class="empty-state">No objects were confidently detected in this image.</p>';
    return;
  }

  objects.forEach(({ label, confidence }) => {
    const row = document.createElement('div');
    row.className = 'object-row';
    row.innerHTML = `
      <span class="object-name">${escapeHtml(label)}</span>
      <span class="object-confidence">${confidence}%</span>
      <div class="confidence-track">
        <div class="confidence-fill" style="width: ${confidence}%"></div>
      </div>
    `;
    objectsList.appendChild(row);
  });
}

// --- UI state helpers ---------------------------------------------------

function showLoading() {
  loading.classList.remove('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
  hideLoading();
}

function hideError() {
  errorBox.classList.add('hidden');
  errorBox.textContent = '';
}

function resetUI() {
  fileInput.value = '';
  resultSection.classList.add('hidden');
  previewImage.src = '';
  objectsList.innerHTML = '';
  hideError();
  hideLoading();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
