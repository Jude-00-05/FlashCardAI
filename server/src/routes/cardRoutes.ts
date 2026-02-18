import { Router } from 'express';
import {
  createCard,
  deleteCard,
  getCardsByDeck,
  getDueCards,
  updateCard
} from '../controllers/cardController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.get('/due', asyncHandler(getDueCards));
router.get('/:deckId', validateObjectId('deckId'), asyncHandler(getCardsByDeck));
router.post('/', asyncHandler(createCard));
router.put('/:id', validateObjectId('id'), asyncHandler(updateCard));
router.delete('/:id', validateObjectId('id'), asyncHandler(deleteCard));

export default router;
