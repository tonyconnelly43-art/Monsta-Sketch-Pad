import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data/projects.json');
const router = express.Router();

async function readProjects() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeProjects(projects) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2));
}

// GET all projects
router.get('/', async (req, res) => {
  const projects = await readProjects();
  res.json(projects);
});

// GET single project
router.get('/:id', async (req, res) => {
  const projects = await readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// POST create project
router.post('/', async (req, res) => {
  const projects = await readProjects();
  const project = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'in-progress',
    wordmarks: [],
    mascots: [],
    backgrounds: [],
    fullBrands: [],
    favoriteWordmark: null,
    favoriteMascot: null,
    favoriteBackground: null,
    ...req.body,
  };
  projects.push(project);
  await writeProjects(projects);
  res.status(201).json(project);
});

// PUT update project
router.put('/:id', async (req, res) => {
  const projects = await readProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  projects[idx] = { ...projects[idx], ...req.body, updatedAt: new Date().toISOString() };
  await writeProjects(projects);
  res.json(projects[idx]);
});

// DELETE project
router.delete('/:id', async (req, res) => {
  const projects = await readProjects();
  const filtered = projects.filter(p => p.id !== req.params.id);
  await writeProjects(filtered);
  res.json({ success: true });
});

export default router;
