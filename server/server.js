import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import projectsRouter from './routes/projects.js';
import referencesRouter from './routes/references.js';
import generateRouter from './routes/generate.js';

dotenv.config({ path: '../.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/projects', projectsRouter);
app.use('/api/references', referencesRouter);
app.use('/api/generate', generateRouter);

app.listen(PORT, () => {
  console.log(`Monsta Sketch Pad server running on http://localhost:${PORT}`);
});
