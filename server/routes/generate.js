import express from 'express';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.join(__dirname, '../uploads/generated');
const router = express.Router();

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function downloadImage(url, filename) {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const filePath = path.join(GENERATED_DIR, filename);
  return new Promise((resolve, reject) => {
    const file = fs.open(filePath, 'w').then(async (fh) => {
      const stream = await fh.createWriteStream();
      https.get(url, (response) => {
        response.pipe(stream);
        stream.on('finish', () => { stream.close(); resolve(filePath); });
        stream.on('error', reject);
      }).on('error', reject);
    });
  });
}

async function saveGeneratedImage(imageUrl) {
  const filename = `${uuidv4()}.png`;
  const localPath = path.join(GENERATED_DIR, filename);
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  // Download and save the image locally
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(localPath, buffer);

  return `/uploads/generated/${filename}`;
}

function buildWordmarkPrompt(project, references, sketchRules) {
  const refNote = references.length > 0 ? `Style references provided — maintain similar aesthetic to those reference images. ` : '';
  const rulesNote = sketchRules ? `\nSTYLE RULES: ${sketchRules}` : '';
  return `${refNote}Create a professional wordmark logo for "${project.businessName}", a ${project.industry} company${project.location ? ` in ${project.location}` : ''}.
Brand personality: ${project.personality || 'professional and trustworthy'}.
Color palette: ${project.colors || 'bold and strong'}.
Style: ${project.styleNotes || 'clean, modern, trades-industry'}.
${project.mustHave ? `Must include: ${project.mustHave}.` : ''}
${project.mustAvoid ? `Avoid: ${project.mustAvoid}.` : ''}
${project.promptDescription ? `Additional notes: ${project.promptDescription}.` : ''}${rulesNote}
The wordmark should be text-based, on a transparent or white background, suitable for a home service brand. High quality, vector-style illustration. No taglines or extra elements — just the company name styled as a wordmark.`;
}

function buildMascotPrompt(project, references, sketchRules) {
  const refNote = references.length > 0 ? `Style references provided — maintain similar aesthetic. ` : '';
  const rulesNote = sketchRules ? `\nSTYLE RULES: ${sketchRules}` : '';
  return `${refNote}Create a mascot character for "${project.businessName}", a ${project.industry} company${project.location ? ` in ${project.location}` : ''}.
Brand personality: ${project.personality || 'friendly and professional'}.
Color palette: ${project.colors || 'bold and strong'}.
Style: ${project.styleNotes || 'cartoon mascot, bold outlines, home service industry'}.
${project.mustHave ? `Must include: ${project.mustHave}.` : ''}
${project.mustAvoid ? `Avoid: ${project.mustAvoid}.` : ''}
${project.promptDescription ? `Additional notes: ${project.promptDescription}.` : ''}${rulesNote}
The mascot should be a fun, memorable character related to the ${project.industry} trade industry. Full body illustration, white or transparent background. Bold cartoon style with strong lines. No text in the image.`;
}

function buildBackgroundPrompt(project, references, sketchRules) {
  const refNote = references.length > 0 ? `Style references provided — maintain similar aesthetic. ` : '';
  const rulesNote = sketchRules ? `\nSTYLE RULES: ${sketchRules}` : '';
  return `${refNote}Create a brand background pattern or scene for "${project.businessName}", a ${project.industry} company${project.location ? ` in ${project.location}` : ''}.
Brand personality: ${project.personality || 'professional'}.
Color palette: ${project.colors || 'bold and strong'}.
Style: ${project.styleNotes || 'bold, graphic, home service industry'}.
${project.mustHave ? `Must include: ${project.mustHave}.` : ''}
${project.mustAvoid ? `Avoid: ${project.mustAvoid}.` : ''}
${project.promptDescription ? `Additional notes: ${project.promptDescription}.` : ''}${rulesNote}
The background should work as a brand backdrop, truck wrap background, or website hero. Bold graphic design style, no text, full bleed composition suitable for branding use.`;
}

function buildFullBrandPrompt(project, wordmarkDesc, mascotDesc, backgroundDesc) {
  return `Create a full brand composition for "${project.businessName}", a ${project.industry} company${project.location ? ` in ${project.location}` : ''}.
Combine these elements into a cohesive brand layout:
- Wordmark: professional text logo for the company name
- Mascot: a brand character related to ${project.industry}
- Background: a bold graphic backdrop

Brand personality: ${project.personality || 'professional and trustworthy'}.
Color palette: ${project.colors || 'bold and strong'}.
Style: ${project.styleNotes || 'home service industry, bold, modern'}.
${project.mustHave ? `Must include: ${project.mustHave}.` : ''}
${project.mustAvoid ? `Avoid: ${project.mustAvoid}.` : ''}
${project.promptDescription ? `Additional notes: ${project.promptDescription}.` : ''}
Create a polished brand presentation layout showing the wordmark, mascot, and background working together. High-quality, professional brand design suitable for a home service company.`;
}

// POST /api/generate/wordmarks
router.post('/wordmarks', async (req, res) => {
  try {
    const openai = getOpenAI();
    const { project, references = [], sketchRules = '' } = req.body;
    const prompt = buildWordmarkPrompt(project, references, sketchRules);

    const results = await Promise.all(
      Array(4).fill(null).map(() =>
        openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        })
      )
    );

    const images = await Promise.all(
      results.map(async (r) => {
        const url = await saveGeneratedImage(r.data[0].url);
        return { id: uuidv4(), url, type: 'wordmark', createdAt: new Date().toISOString() };
      })
    );

    res.json({ images });
  } catch (err) {
    console.error('Generate wordmarks error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/generate/mascots
router.post('/mascots', async (req, res) => {
  try {
    const openai = getOpenAI();
    const { project, references = [], sketchRules = '' } = req.body;
    const prompt = buildMascotPrompt(project, references, sketchRules);

    const results = await Promise.all(
      Array(4).fill(null).map(() =>
        openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        })
      )
    );

    const images = await Promise.all(
      results.map(async (r) => {
        const url = await saveGeneratedImage(r.data[0].url);
        return { id: uuidv4(), url, type: 'mascot', createdAt: new Date().toISOString() };
      })
    );

    res.json({ images });
  } catch (err) {
    console.error('Generate mascots error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/generate/backgrounds
router.post('/backgrounds', async (req, res) => {
  try {
    const openai = getOpenAI();
    const { project, references = [], sketchRules = '' } = req.body;
    const prompt = buildBackgroundPrompt(project, references, sketchRules);

    const results = await Promise.all(
      Array(4).fill(null).map(() =>
        openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        })
      )
    );

    const images = await Promise.all(
      results.map(async (r) => {
        const url = await saveGeneratedImage(r.data[0].url);
        return { id: uuidv4(), url, type: 'background', createdAt: new Date().toISOString() };
      })
    );

    res.json({ images });
  } catch (err) {
    console.error('Generate backgrounds error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/generate/full-brand
router.post('/full-brand', async (req, res) => {
  try {
    const openai = getOpenAI();
    const { project, wordmarkUrl, mascotUrl, backgroundUrl } = req.body;
    const prompt = buildFullBrandPrompt(project, wordmarkUrl, mascotUrl, backgroundUrl);

    const results = await Promise.all(
      Array(4).fill(null).map(() =>
        openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1792x1024',
          quality: 'hd',
        })
      )
    );

    const images = await Promise.all(
      results.map(async (r) => {
        const url = await saveGeneratedImage(r.data[0].url);
        return { id: uuidv4(), url, type: 'full-brand', createdAt: new Date().toISOString() };
      })
    );

    res.json({ images });
  } catch (err) {
    console.error('Generate full brand error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/generate/badges
router.post('/badges', async (req, res) => {
  try {
    const openai = getOpenAI();
    const { project, references = [] } = req.body;
    const refNote = references.length > 0 ? `Style references provided — maintain similar aesthetic. ` : '';
    const prompt = `${refNote}Create a badge or emblem logo for "${project.businessName}", a ${project.industry} company${project.location ? ` in ${project.location}` : ''}.
Brand personality: ${project.personality || 'professional and trustworthy'}.
Color palette: ${project.colors || 'bold and strong'}.
Style: ${project.styleNotes || 'bold emblem, shield or circular badge shape, home service industry'}.
${project.mustHave ? `Must include: ${project.mustHave}.` : ''}
${project.mustAvoid ? `Avoid: ${project.mustAvoid}.` : ''}
${project.promptDescription ? `Additional notes: ${project.promptDescription}.` : ''}
Design a bold, professional badge or emblem that incorporates the company name and industry imagery. Classic badge or shield shape. White or transparent background. Vector-style illustration, strong outlines, suitable for uniforms, trucks, and marketing materials.`;

    const results = await Promise.all(
      Array(4).fill(null).map(() =>
        openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        })
      )
    );

    const images = await Promise.all(
      results.map(async (r) => {
        const url = await saveGeneratedImage(r.data[0].url);
        return { id: uuidv4(), url, type: 'badge', createdAt: new Date().toISOString() };
      })
    );

    res.json({ images });
  } catch (err) {
    console.error('Generate badges error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
