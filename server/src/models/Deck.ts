import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const deckSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true, index: true },
    name: { type: String, required: true, trim: true },
    createdAt: { type: Number, required: true, default: () => Date.now() }
  },
  { timestamps: true }
);

deckSchema.index({ userId: 1, subjectId: 1, name: 1 }, { unique: true });

export type DeckDocument = InferSchemaType<typeof deckSchema>;
export const DeckModel = model('Deck', deckSchema);

