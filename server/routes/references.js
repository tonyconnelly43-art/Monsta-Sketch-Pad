import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data/references.json');
const UPLOAD_DIR = path.join(__dirname, '../uploads/references');
const router = express.Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

async function readRefs() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeRefs(refs) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(refs, null, 2));
}

router.get('/', async (req, res) => {
  const refs = await readRefs();
  const { category } = req.query;
  res.json(category ? refs.filter(r => r.category === category) : refs);
});

router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const refs = await readRefs();
  const ref = {
    id: uuidv4(),
    filename: req.file.filename,
    url: `/uploads/references/${req.file.filename}`,
    category: req.body.category || 'wordmark',
    name: req.body.name || req.file.originalname,
    tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
  };
  refs.push(ref);
  await writeRefs(refs);
  res.status(201).json(ref);
});

router.put('/:id', async (req, res) => {
  const refs = await readRefs();
  const idx = refs.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Reference not found' });
  refs[idx] = { ...refs[idx], ...req.body };
  await writeRefs(refs);
  res.json(refs[idx]);
});

router.delete('/:id', async (req, res) => {
  const refs = await readRefs();
  const ref = refs.find(r => r.id === req.params.id);
  if (ref) {
    const filePath = path.join(UPLOAD_DIR, ref.filename);
    await fs.unlink(filePath).catch(() => {});
  }
  const filtered = refs.filter(r => r.id !== req.params.id);
  await writeRefs(filtered);
  res.json({ success: true });
});

export default router;
