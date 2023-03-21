export abstract class ICompareable {
  abstract compare(other: ICompareable): number;
}

export class Heap<D extends ICompareable> {
  private heap: [null, ...D[]];

  constructor() {
    this.heap = [null];
  }

  peek() {
    return this.heap[1];
  }

  remove() {
    this.swap(1, this.heap.length - 1);
    this.heap.pop();
    this.sink(1);
  }

  add(item: D) {
    this.heap.push(item);
    this.swim();
  }

  clear() {
    this.heap = [null];
  }

  private sink(index: number) {
    const len = this.heap.length - 1;
    let j = 0;

    while (index * 2 <= len) {
      j = index * 2;

      if (j + 1 <= len && this.heap[j]!.compare(this.heap[j + 1]!) > 0) {
        j++;
      }

      if (this.heap[index]!.compare(this.heap[j]!) > 0) {
        this.swap(index, j);
        index = j;
      } else {
        break;
      }
    }
  }

  private swim() {
    let index = this.heap.length - 1;
    let mid = 0;

    while (index > 1) {
      mid = index >> 1;

      if (this.heap[index]!.compare(this.heap[mid]!) < 0) {
        this.swap(index, mid);
        index = mid;
      } else {
        break;
      }
    }
  }

  private swap(i: number, j: number) {
    const t = this.heap[i];

    this.heap[i] = this.heap[j];
    this.heap[j] = t;
  }
}
