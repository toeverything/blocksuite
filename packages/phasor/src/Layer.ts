export class Layer<T extends { index: string }> {
  private elements = new Set<T>();
  private _min = 'a0';
  private _max = 'a0';

  constructor(public name: string) {}

  get max() {
    return this._max;
  }

  set max(max: string) {
    this._max = max;
  }

  get min() {
    return this._min;
  }

  set min(min: string) {
    this._min = min;
  }

  addElement(ele: T) {
    const index = ele.index;
    if (index > this.max) {
      this.max = index;
    } else if (index < this.min) {
      this.min = index;
    }
    this.elements.add(ele);
  }

  deleteElement(ele: T) {
    this.elements.delete(ele);
  }
}
