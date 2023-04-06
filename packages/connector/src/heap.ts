type ScoreFunction<T> = (element: T) => number;

export class BinaryHeap<T> {
  private _content: T[] = [];
  private _scoreFunction: ScoreFunction<T>;

  constructor(scoreFunction: ScoreFunction<T>) {
    this._scoreFunction = scoreFunction;
  }

  push(element: T) {
    // Add the new element to the end of the array.
    this._content.push(element);

    // Allow it to sink down.
    this.sinkDown(this._content.length - 1);
  }

  pop() {
    const { _content } = this;
    // Store the first element so we can return it later.
    const result = _content[0];
    // Get the element at the end of the array.
    const end = _content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it bubble up.
    if (_content.length > 0) {
      _content[0] = end as T;
      this.bubbleUp(0);
    }
    return result;
  }

  remove(element: T) {
    const { _content, _scoreFunction } = this;
    const i = _content.indexOf(element);

    // When it is found, the process seen in 'pop' is repeated
    // to fill up the hole.
    const end = _content.pop();

    if (i !== _content.length - 1) {
      _content[i] = end as T;

      if (_scoreFunction(end as T) < _scoreFunction(element)) {
        this.sinkDown(i);
      } else {
        this.bubbleUp(i);
      }
    }
  }

  size() {
    return this._content.length;
  }

  rescoreElement(element: T) {
    this.sinkDown(this._content.indexOf(element));
  }

  sinkDown(n: number) {
    const { _content, _scoreFunction } = this;
    // Fetch the element that has to be sunk.
    const element = this._content[n];

    // When at 0, an element can not sink any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      const parentN = ((n + 1) >> 1) - 1;
      const parent = _content[parentN];
      // Swap the elements if the parent is greater.
      if (_scoreFunction(element) < _scoreFunction(parent)) {
        _content[parentN] = element;
        _content[n] = parent;
        // Update 'n' to continue at the new position.
        n = parentN;
      }
      // Found a parent that is less, no need to sink any further.
      else {
        break;
      }
    }
  }

  bubbleUp(n: number) {
    const { _content, _scoreFunction } = this;
    // Look up the target element and its score.
    const length = _content.length;
    const element = _content[n];
    const elemScore = _scoreFunction(element);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Compute the indices of the child elements.
      const child2N = (n + 1) << 1;
      const child1N = child2N - 1;
      // This is used to store the new position of the element, if any.
      let swap: number | null = null;
      let child1Score: number | null = null;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        const child1 = _content[child1N];
        child1Score = _scoreFunction(child1);

        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore) {
          swap = child1N;
        }
      }

      // Do the same checks for the other child.
      if (child2N < length) {
        const child2 = _content[child2N];
        const child2Score = _scoreFunction(child2);
        if (
          child2Score < (swap === null ? elemScore : (child1Score as number))
        ) {
          swap = child2N;
        }
      }

      // If the element needs to be moved, swap it, and continue.
      if (swap !== null) {
        _content[n] = _content[swap];
        _content[swap] = element;
        n = swap;
      }
      // Otherwise, we are done.
      else {
        break;
      }
    }
  }
}
