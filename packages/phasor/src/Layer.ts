export class Layer<T extends { index: string }> {
  indexes = { min: 'a0', max: 'a0' };
  private elements = new Set<T>();

  constructor(public name: string) {}

  addElement(ele: T) {
    const index = ele.index;
    if (index > this.indexes.max) {
      this.indexes.max = index;
    } else if (index < this.indexes.min) {
      this.indexes.min = index;
    }
    this.elements.add(ele);
  }

  deleteElement(ele: T) {
    this.elements.delete(ele);
  }
}
