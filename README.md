# Smart Object Identifier

A full-stack web app that identifies objects in a photo. Upload or drag & drop
an image, and the app returns the detected objects with confidence
percentages, powered by the free [Hugging Face Inference API](https://huggingface.co/inference-api)
running the `facebook/detr-resnet-50` object detection model.

## Features

- Drag & drop or click-to-browse image upload
- Live image preview
- Object detection with confidence percentages
- Loading animation while the image is analyzed
- Client- and server-side error handling (bad file type, oversized file, API errors, model cold-start retries)
- Modern, responsive, dark-themed UI
- Clean, modular Express backend

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js, Express, Multer (file uploads), Axios (HTTP client)
- **AI:** Hugging Face Inference API (`facebook/detr-resnet-50`)

## Project Structure

```
Smart-Object-Identifier/
├── public/                 # Frontend static assets
│   ├── index.html
│   ├── css/style.css
│   └── js/script.js
├── server/                 # Backend
│   ├── server.js           # Express app entry point
│   ├── config.js           # Environment/config loader
│   ├── routes/detect.js    # POST /api/detect route
│   └── utils/huggingface.js# Hugging Face API client
├── .env.example
├── .gitignore
├── package.json
├── render.yaml             # Render Blueprint (deploy config)
└── README.md
```

## Setup Instructions

### 1. Get a free Hugging Face API token

1. Create a free account at [huggingface.co](https://huggingface.co/join).
2. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
3. Click **Create new token** and select the **Fine-grained** tab (not "Read" — the Inference Providers router requires a fine-grained token).
4. Give it a name, scroll to the **Inference** section, and check **"Make calls to Inference Providers"**.
5. Create the token and copy it (starts with `hf_...`).

### 2. Configure environment variables

Copy the example file and paste your token into it:

```bash
cp .env.example .env
```

Edit `.env`:

```
HUGGINGFACE_API_KEY=hf_your_token_here
PORT=3000
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the app

```bash
npm start
```

For development with auto-restart on file changes:

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

## How It Works

1. The user drags/drops or selects an image in the browser.
2. The frontend validates file type (JPEG/PNG/WebP) and size (max 5MB), then
   sends it via `FormData` to `POST /api/detect`.
3. The Express route (`server/routes/detect.js`) accepts the file in memory
   via Multer, then forwards the raw image bytes to the Hugging Face
   Inference API.
4. If the model is "cold" (free tier models unload when idle), the API
   returns a 503 with an estimated warm-up time — the backend automatically
   waits and retries once.
5. Results are filtered to detections above 50% confidence, sorted by
   confidence, and returned as JSON.
6. The frontend renders each detected object with a name and an animated
   confidence bar.

## Deployment

The app is a single Node/Express service that also serves the static
frontend, so there's only one service to deploy — no separate frontend
hosting needed. It reads `PORT` from the environment (both platforms below
set this automatically) and exposes `GET /health` for health checks.

**Before deploying:** push the project to GitHub (see below). Never commit
your `.env` file — it's already git-ignored. You'll set `HUGGINGFACE_API_KEY`
directly in the platform's dashboard instead.

### Deploy to Render

**Option A — Blueprint (recommended, uses the included `render.yaml`):**

1. Push this repo to GitHub.
2. In the [Render dashboard](https://dashboard.render.com/), click **New +** → **Blueprint**.
3. Connect your GitHub repo. Render will detect `render.yaml` and pre-fill the service config.
4. When prompted, paste your Hugging Face token into the `HUGGINGFACE_API_KEY` field (marked `sync: false`, so it's not stored in the repo).
5. Click **Apply**. Render will run `npm install` then `npm start` and give you a public URL.

**Option B — Manual web service:**

1. In the Render dashboard, click **New +** → **Web Service** and connect your repo.
2. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
3. Under **Environment**, add:
   - `HUGGINGFACE_API_KEY` = your token
   - `HUGGINGFACE_MODEL` = `facebook/detr-resnet-50` (optional, this is the default)
4. Set **Health Check Path** to `/health`.
5. Click **Create Web Service**.

### Deploy to Railway

1. Push this repo to GitHub.
2. In the [Railway dashboard](https://railway.app/dashboard), click **New Project** → **Deploy from GitHub repo**, and select this repo.
3. Railway auto-detects the Node app (via `package.json`) and runs `npm install` + `npm start` — no config file needed.
4. Open the service's **Variables** tab and add:
   - `HUGGINGFACE_API_KEY` = your token
   - `HUGGINGFACE_MODEL` = `facebook/detr-resnet-50` (optional)
5. Under **Settings → Networking**, click **Generate Domain** to get a public URL.

Railway sets `PORT` automatically, and the app already reads it via
`server/config.js`, so no further changes are needed.

## Publishing to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Notes on the Free Tier

- The Hugging Face free Inference API has rate limits and may take a few
  extra seconds on the first request while the model loads — this is
  expected and handled automatically with a retry.
- Maximum upload size is capped at 5MB to keep requests fast and within
  free-tier limits.

## License

MIT
