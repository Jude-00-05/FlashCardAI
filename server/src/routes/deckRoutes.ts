import { Router } from 'express';
import {
  createDeck,
  deleteDeck,
  getDecksBySubject,
  updateDeck
} from '../controllers/deckController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.get('/:subjectId', validateObjectId('subjectId'), asyncHandler(getDecksBySubject));
router.post('/', asyncHandler(createDeck));
router.put('/:id', validateObjectId('id'), asyncHandler(updateDeck));
router.delete('/:id', validateObjectId('id'), asyncHandler(deleteDeck));

export default router;
