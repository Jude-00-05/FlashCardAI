import { Router } from 'express';
import { getReviewHistory } from '../controllers/reviewController';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authMiddleware);
router.get('/', asyncHandler(getReviewHistory));

export default router;
