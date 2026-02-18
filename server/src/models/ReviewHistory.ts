import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const reviewHistorySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    cardId: { type: Types.ObjectId, ref: 'Card', required: true, index: true },
    deckId: { type: Types.ObjectId, ref: 'Deck', required: true, index: true },
    quality: { type: Number, required: true, min: 1, max: 5 },
    reviewedAt: { type: Number, required: true, default: () => Date.now() }
  },
  { timestamps: true }
);

reviewHistorySchema.index({ userId: 1, reviewedAt: -1 });

export type ReviewHistoryDocument = InferSchemaType<typeof reviewHistorySchema>;
export const ReviewHistoryModel = model('ReviewHistory', reviewHistorySchema);

