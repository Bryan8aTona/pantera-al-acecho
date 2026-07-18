import express from 'express';
import cors from 'cors';
import rutas from './routes/index.js';
import manejarErrores from './middleware/error.middleware.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', rutas);

// Debe ir al final: captura errores de todas las rutas anteriores.
app.use(manejarErrores);

export default app;
