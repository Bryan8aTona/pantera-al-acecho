import { Router } from 'express';
import autenticar from '../../middleware/auth.middleware.js';
import {
  listar,
  crear,
  obtenerFrases,
  actualizar,
  eliminar,
} from './sets.controller.js';

const router = Router();

// Todo el módulo de sets es privado (back-office post-login).
router.use(autenticar);

router.get('/', listar);
router.post('/', crear);
router.get('/:id/frases', obtenerFrases);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

export default router;
