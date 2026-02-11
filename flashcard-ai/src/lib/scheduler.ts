export type ReviewState = {
  interval: number;      // days
  repetition: number;   // count
  easeFactor: number;   // EF
  due: number;          // timestamp
};

export function updateSM2(
  state: ReviewState,
  quality: number
): ReviewState {
  let { interval, repetition, easeFactor } = state;

  if (quality < 3) {
    repetition = 0;
    interval = 1;
  } else {
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    repetition += 1;
  }

  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (easeFactor < 1.3) easeFactor = 1.3;

  return {
    interval,
    repetition,
    easeFactor,
    due: Date.now() + interval * 24 * 60 * 60 * 1000
  };
}
