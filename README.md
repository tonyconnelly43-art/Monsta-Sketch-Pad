# Monsta Sketch Pad

A creative studio web app for generating home service brand concepts — wordmarks, mascots, backgrounds, and full brand compositions — powered by the OpenAI DALL-E API.

Designed for HVAC, plumbing, electrical, garage door, pressure washing, pest control, landscaping, and similar trades.

---

## Requirements

- Node.js 18+
- npm 8+
- An OpenAI API key with DALL-E access

---

## Installation

```bash
# 1. Clone the repo
git clone <repo-url>
cd monsta-sketch-pad

# 2. Install all dependencies
npm run install:all

# 3. Set up your environment file
cp .env.example .env
```

---

## Adding Your OpenAI API Key

Open `.env` and add your key:

```
OPENAI_API_KEY=sk-your-real-key-here
```

Get a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

---

## Running Locally

```bash
npm run dev
```

This starts both:
- **Backend** at `http://localhost:3001`
- **Frontend** at `http://localhost:5173`

Open your browser to `http://localhost:5173`.

---

## Project Workflow

1. **Create a Brand Project** — Enter the business name, industry, location, colors, personality, and style notes.

2. **Upload Reference Images** — Go to the Reference Library and upload example images that represent the style you want. Tag them and categorize them (Wordmark, Mascot, Background, Full Brand).

3. **Generate Wordmarks** — Select up to 3 reference images to guide the style, then generate 4 wordmark options. Save your favorite.

4. **Generate Mascots** — Same workflow — 4 options, pick a favorite.

5. **Generate Backgrounds** — 4 options, pick a favorite.

6. **Generate Full Brand** — Once you have a favorite wordmark, mascot, and background selected, use the Full Brand Generator to create 4 complete brand compositions combining all elements.

7. **Download & Save** — Download any generated image. View all favorites in the Favorites section.

---

## Project Structure

```
monsta-sketch-pad/
├── client/                   # React + Vite frontend
│   └── src/
│       ├── components/       # Shared components (Layout, GeneratePage)
│       ├── pages/            # Dashboard, ProjectPage, ReferenceLibrary, Favorites
│       ├── context/          # ToastContext
│       └── utils/            # API helper
├── server/                   # Express backend
│   ├── routes/
│   │   ├── projects.js       # CRUD for brand projects
│   │   ├── references.js     # Upload and manage reference images
│   │   └── generate.js       # OpenAI DALL-E generation calls
│   ├── data/                 # JSON flat-file storage (auto-created)
│   └── uploads/              # Stored images (auto-created)
├── .env.example
├── .gitignore
└── package.json
```

---

## Where the OpenAI Calls Are Made

All generation calls are in `server/routes/generate.js`. Each route (`/wordmarks`, `/mascots`, `/backgrounds`, `/full-brand`) builds a detailed prompt using the project's brand details and calls `openai.images.generate()` with DALL-E 3.

Generated images are downloaded and stored locally in `server/uploads/generated/`.

---

## Storage

Project data and reference metadata are stored as JSON files in `server/data/`. Images are stored in `server/uploads/`. This is intentionally simple for MVP — upgrade to a real database and cloud storage (S3, Cloudflare R2) when ready to scale.

---

## What Still Needs Improvement

- [ ] User authentication (multi-user support)
- [ ] Cloud storage for images (S3/R2 instead of local disk)
- [ ] Real database (PostgreSQL, SQLite, etc.)
- [ ] Image editing tools (crop, resize, adjust)
- [ ] Export to PDF / brand kit package
- [ ] Prompt history and versioning
- [ ] Image-to-image generation (using reference images directly in DALL-E)
- [ ] Team collaboration features
- [ ] Mobile layout improvements
- [ ] Stripe integration for usage billing
