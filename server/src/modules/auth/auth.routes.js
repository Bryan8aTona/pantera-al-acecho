import { Router } from 'express';
import { register, login, me } from './auth.controller.js';
import autenticar from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', autenticar, me);

export default router;
