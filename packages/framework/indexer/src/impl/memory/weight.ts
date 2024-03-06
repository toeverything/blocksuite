export class Weight {
  scores = new Map<number, number>();

  constructor() {}

  addScore(id: number, score: number) {
    const currentScore = this.scores.get(id) || 0;
    this.scores.set(id, currentScore + score);
  }

  and(other: Weight) {
    const newWeight = new Weight();
    for (const [id, score] of this.scores) {
      if (other.scores.has(id)) {
        newWeight.addScore(id, score + other.scores.get(id)!);
      }
    }
    return newWeight;
  }

  or(other: Weight) {
    const newWeight = new Weight();
    for (const [id, score] of this.scores) {
      newWeight.addScore(id, score);
    }
    for (const [id, score] of other.scores) {
      newWeight.addScore(id, score);
    }
    return newWeight;
  }

  exclude(other: Weight) {
    const newWeight = new Weight();
    for (const [id, score] of this.scores) {
      if (!other.scores.has(id)) {
        newWeight.addScore(id, score);
      }
    }
    return newWeight;
  }

  toArray() {
    return Array.from(this.scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(e => e[0]);
  }

  filter(predicate: (id: number) => boolean) {
    const newWeight = new Weight();
    for (const [id, score] of this.scores) {
      if (predicate(id)) {
        newWeight.addScore(id, score);
      }
    }
    return newWeight;
  }
}
