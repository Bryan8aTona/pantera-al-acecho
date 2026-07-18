import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import setsRoutes from '../modules/sets/sets.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/sets', setsRoutes);

export default router;
