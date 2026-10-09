export type ClassShare = {
  label: string;
  /** Share of the image where this class is the most likely one, 0..1. */
  share: number;
};

export type LogitsSummary = {
  /** Probability of the target class at each position, scaled to 0..255. */
  probability: Uint8ClampedArray;
  /** Classes that win at least one position, largest share first. */
  classes: ClassShare[];
};

/**
 * Reduces raw class scores to what the app needs: a soft mask for one class,
 * and which classes the model saw.
 *
 * `logits` is laid out class by class: the score for class `c` at position `p`
 * is at `c * positions + p`.
 */
export function summariseLogits(
  logits: ArrayLike<number>,
  classCount: number,
  targetClass: number,
  labelOf: (classIndex: number) => string,
): LogitsSummary {
  const positions = classCount > 0 ? logits.length / classCount : 0;
  const probability = new Uint8ClampedArray(positions);
  const wins = new Array<number>(classCount).fill(0);

  for (let position = 0; position < positions; position++) {
    let best = 0;
    let bestScore = -Infinity;
    for (let c = 0; c < classCount; c++) {
      const score = logits[c * positions + position] ?? -Infinity;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    wins[best] = (wins[best] ?? 0) + 1;

    // Softmax for the target class only, shifted by the top score so exp() cannot overflow.
    let total = 0;
    for (let c = 0; c < classCount; c++) {
      total += Math.exp((logits[c * positions + position] ?? -Infinity) - bestScore);
    }
    const target = Math.exp((logits[targetClass * positions + position] ?? -Infinity) - bestScore);
    probability[position] = Math.round((target / total) * 255);
  }

  const classes = wins
    .map((count, classIndex) => ({ label: labelOf(classIndex), share: count / positions }))
    .filter((entry) => entry.share > 0)
    .sort((a, b) => b.share - a.share);

  return { probability, classes };
}
