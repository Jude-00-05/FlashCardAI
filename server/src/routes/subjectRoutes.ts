import { Router } from 'express';
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject
} from '../controllers/subjectController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getSubjects));
router.post('/', asyncHandler(createSubject));
router.put('/:id', validateObjectId('id'), asyncHandler(updateSubject));
router.delete('/:id', validateObjectId('id'), asyncHandler(deleteSubject));

export default router;
