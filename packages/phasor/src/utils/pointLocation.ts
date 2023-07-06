import { type IVec } from './vec.js';
export class PointLocation extends Array<number> implements IVec {
  // the tangent belongs to  the point on the element outline
  _tangent: IVec = [0, 0];

  constructor(point: IVec = [0, 0], tangent: IVec = [0, 0]) {
    super(2);
    this[0] = point[0];
    this[1] = point[1];
    this._tangent = tangent;
  }

  copyVec(vec: IVec) {
    this[0] = vec[0];
    this[1] = vec[1];
  }

  get tangent() {
    return this._tangent;
  }

  set tangent(value: IVec) {
    this._tangent = value;
  }
}
