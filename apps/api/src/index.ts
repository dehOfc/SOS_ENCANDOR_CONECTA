import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes.js';

const app = express();
const port = Number(process.env.PORT || 5174);

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

app.get('/', (_req, res) => {
  res.send({ message: 'SOS Encanador Conecta API está ativa.' });
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
