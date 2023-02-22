export class ViewportState {
  private _width = 0;
  private _height = 0;
  private _zoom = 1.0;
  private _centerX = 0.0;
  private _centerY = 0.0;

  get zoom() {
    return this._zoom;
  }

  get centerX() {
    return this._centerX;
  }

  get centerY() {
    return this._centerY;
  }

  get viewportX() {
    return this._centerX - this._width / 2 / this._zoom;
  }

  get viewportY() {
    return this._centerY - this._height / 2 / this._zoom;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  toModelCoord(viewX: number, viewY: number): [number, number] {
    return [
      this.viewportX + viewX / this._zoom,
      this.viewportY + viewY / this._zoom,
    ];
  }

  toViewCoord(modelX: number, modelY: number): [number, number] {
    return [
      (modelX - this.viewportX) * this._zoom,
      (modelY - this.viewportY) * this._zoom,
    ];
  }

  setSize(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  setZoom(val: number) {
    this._zoom = val;
  }

  applyDeltaZoom(delta: number) {
    const val = (this.zoom * (100 + delta)) / 100;
    const newZoom = Math.max(val, 0.3);
    this.setZoom(newZoom);
  }

  applyDeltaCenter(deltaX: number, deltaY: number) {
    this._centerX += deltaX;
    this._centerY += deltaY;
  }

  setCenter(centerX: number, centerY: number) {
    this._centerX = centerX;
    this._centerY = centerY;
  }
}
