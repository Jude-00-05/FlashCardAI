import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const subjectSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

subjectSchema.index({ userId: 1, name: 1 }, { unique: true });

export type SubjectDocument = InferSchemaType<typeof subjectSchema>;
export const SubjectModel = model('Subject', subjectSchema);

