import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const reviewStateSchema = new Schema(
  {
    interval: { type: Number, required: true },
    repetition: { type: Number, required: true },
    easeFactor: { type: Number, required: true },
    due: { type: Number, required: true }
  },
  { _id: false }
);

const cardSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true, index: true },
    deckId: { type: Types.ObjectId, ref: 'Deck', required: true, index: true },
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },
    reviewState: { type: reviewStateSchema, required: true },
    createdAt: { type: Number, required: true, default: () => Date.now() }
  },
  { timestamps: true }
);

cardSchema.index({ userId: 1, deckId: 1, 'reviewState.due': 1 });

export type CardDocument = InferSchemaType<typeof cardSchema>;
export const CardModel = model('Card', cardSchema);

