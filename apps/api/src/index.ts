import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes.js';

const app = express();
const port = Number(process.env.PORT || 5174);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);
app.use(express.static(publicPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
