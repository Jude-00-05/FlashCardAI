import { Router } from 'express';
import { login, me, register } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', authMiddleware, asyncHandler(me));

export default router;
