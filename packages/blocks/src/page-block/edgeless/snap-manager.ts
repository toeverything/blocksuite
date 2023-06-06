import { Bound } from '@blocksuite/phasor/index.js';
import type { SurfaceManager } from '@blocksuite/phasor/surface.js';

import type { onEdgelessElement } from '../../__internal__/utils/types.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';

export class EdgelessSnapManager {
  constructor(
    public container: EdgelessPageBlockComponent,
    public surface: SurfaceManager
  ) {}

  public prepareAlign(elements: onEdgelessElement[]): Bound {
    return new Bound();
  }

  public align(bound: Bound): { dx: number; dy: number } {
    return { dx: 0, dy: 0 };
  }

  public reset(): void {
    1;
  }

  // private alignBoxes: IRectangle[] = [];
  // private alignBoxesDistribute: IRectangle[] = [];
  // private alignBoxesLength: IRectangle[] = [];
  // private alignPoints: [IPoint, IPoint][] = [];
  // private alignDistrubitePoints: [IPoint, IPoint][] = [];
  // private alignLengthPoints: [IPoint, IPoint][] = [];
  // private threshold = 5;
  // private lastAlignLengthCell: IAlignCell | null = null;
  // private graphicGroup = new G();

  // constructor(
  //   @injectAll(IAlignExcludedSymbol)
  //   private _excludedProcess: IAlignExcluded[]
  // ) {
  //   super();
  // }

  // init(editor: IAlignEditor): void {
  //   this.editor = editor;

  //   editor.renderer.frontGroup.addChild(this.graphicGroup);
  // }

  // public prepareAlign(cells: IAlignCell[]) {
  //   const toAlignCells: ICell[] = [];
  //   cells.forEach((cell) => {
  //     this._excludedProcess.forEach((process) => {
  //       const rst = process.alignExcluded(cell, this.editor);
  //       if (rst.length > 0) toAlignCells.push(...rst);
  //     });
  //   });
  //   const { renderer } = this.editor;
  //   const viewport = this.editor.require("viewport");
  //   this.alignBoxes = [];
  //   this.alignBoxesDistribute = [];
  //   renderer.getCells().forEach((cell) => {
  //     if (isAlignedCell(cell) && !toAlignCells.includes(cell)) {
  //       const bbox = cell.getAlignBBox();
  //       if (viewport.isRectInViewport(bbox)) {
  //         this.alignBoxes.push(bbox);
  //         this.alignBoxesDistribute.push(bbox);
  //       }
  //     }
  //   });
  //   return cells.reduce((prev, cell) => {
  //     return prev.unite(cell.getAlignBBox());
  //   }, cells[0].getAlignBBox());
  // }

  // // private prepareAlignDistribute(cells: IAlignCell[]) {
  // //   const { renderer } = this.editor;
  // //   this.alignBoxesDistribute = [];
  // //   const viewport = this.editor.require("viewport");
  // //   renderer.getCells().forEach((cell) => {
  // //     if (isAlignCell(cell) && !cells.includes(cell)) {
  // //       const bbox = cell.getAlignBBox();
  // //       if (viewport.isRectInViewport(bbox)) {
  // //         this.alignBoxesDistribute.push(bbox);
  // //       }
  // //     }
  // //   });
  // // }

  // private prepareLengthAlign(toAlignCell: IAlignCell) {
  //   const { renderer } = this.editor;
  //   const viewport = this.editor.require("viewport");
  //   renderer.getCells().forEach((cell) => {
  //     if (isAlignCell(cell) && toAlignCell !== cell) {
  //       const bbox = cell.getAlignBBox();
  //       if (viewport.isRectInViewport(bbox)) {
  //         this.alignBoxesLength.push(bbox);
  //       }
  //     }
  //   });
  // }

  // align(
  //   rect: IRectangle,
  //   options: AlignOptions = { point: true, distribute: true }
  // ): {
  //   dx: number;
  //   dy: number;
  // } {
  //   const rst = { dx: 0, dy: 0 };
  //   const { threshold } = this;
  //   const viewport = this.editor.require("viewport");

  //   if (options.point) {
  //     this.alignPoints = [];
  //     for (const other of this.alignBoxes) {
  //       // Calculate center-to-center and center-to-side distances
  //       const centerXDistance = other.center.x - rect.center.x;
  //       const centerYDistance = other.center.y - rect.center.y;

  //       const leftDistance = other.minX - rect.center.x;
  //       const rightDistance = other.maxX - rect.center.x;
  //       const topDistance = other.minY - rect.center.y;
  //       const bottomDistance = other.maxY - rect.center.y;

  //       // Calculate side-to-side distances
  //       const leftToLeft = other.minX - rect.minX;
  //       const leftToRight = other.maxX - rect.minX;
  //       const rightToLeft = other.minX - rect.maxX;
  //       const rightToRight = other.maxX - rect.maxX;

  //       const topToTop = other.minY - rect.minY;
  //       const topToBottom = other.maxY - rect.minY;
  //       const bottomToTop = other.minY - rect.maxY;
  //       const bottomToBottom = other.maxY - rect.maxY;

  //       const xDistances = [
  //         centerXDistance,
  //         leftDistance,
  //         rightDistance,
  //         leftToLeft,
  //         leftToRight,
  //         rightToLeft,
  //         rightToRight,
  //       ];

  //       const yDistances = [
  //         centerYDistance,
  //         topDistance,
  //         bottomDistance,
  //         topToTop,
  //         topToBottom,
  //         bottomToTop,
  //         bottomToBottom,
  //       ];
  //       let closestX = Number.MAX_VALUE;
  //       let closestY = Number.MAX_VALUE;
  //       const xDistancesAbs = xDistances.map(Math.abs);
  //       const yDistancesAbs = yDistances.map(Math.abs);
  //       closestX = Math.min(...xDistancesAbs);
  //       closestY = Math.min(...yDistancesAbs);

  //       if (closestX < threshold) {
  //         const index = xDistancesAbs.indexOf(closestX);
  //         rst.dx = xDistances[index];
  //         const alignPointX = [
  //           other.center.x,
  //           other.minX,
  //           other.maxX,
  //           rect.minX + rst.dx,
  //           rect.minX + rst.dx,
  //           rect.maxX + rst.dx,
  //           rect.maxX + rst.dx,
  //         ][index];
  //         this.alignPoints[0] = [
  //           new Point(alignPointX, rect.center.y),
  //           new Point(alignPointX, other.center.y),
  //         ];
  //       }

  //       if (closestY < threshold) {
  //         const index = yDistancesAbs.indexOf(closestY);
  //         rst.dy = yDistances[index];
  //         const alignPointY = [
  //           other.center.y,
  //           other.minY,
  //           other.maxY,
  //           rect.minY + rst.dy,
  //           rect.minY + rst.dy,
  //           rect.maxY + rst.dy,
  //           rect.maxY + rst.dy,
  //         ][index];
  //         this.alignPoints[1] = [
  //           new Point(rect.center.x, alignPointY),
  //           new Point(other.center.x, alignPointY),
  //         ];
  //       }
  //     }
  //   }

  //   if (options.distribute) {
  //     this.alignDistrubitePoints = [];
  //     if (rst.dx === 0) {
  //       const wBoxes: IRectangle[] = [];
  //       this.alignBoxesDistribute.forEach((box) => {
  //         if (box.isSameHorizontal(rect)) {
  //           wBoxes.push(box);
  //         }
  //       });
  //       let dif = Infinity;
  //       let min = Infinity;
  //       for (let i = 0; i < wBoxes.length; i++) {
  //         for (let j = i + 1; j < wBoxes.length; j++) {
  //           let lb = wBoxes[i],
  //             rb = wBoxes[j];
  //           if (!lb.isSameHorizontal(rb)) continue;
  //           if (lb.isRectIntersect(rb)) continue;
  //           if (rb.maxX < lb.minX) {
  //             const temp = rb;
  //             rb = lb;
  //             lb = temp;
  //           }
  //           /** 中间对齐 */
  //           let _centerX = 0;
  //           const updateDif = () => {
  //             dif = Math.abs(rect.center.x - _centerX);
  //             if (dif <= threshold && dif < min) {
  //               min = dif;
  //               rst.dx = _centerX - rect.center.x;
  //               /**
  //                * 计算待绘制点
  //                */
  //               const ys = [lb.minY, lb.maxY, rb.minY, rb.maxY].sort(
  //                 (a, b) => a - b
  //               );
  //               const y = (ys[1] + ys[2]) / 2;
  //               const offset = 2 / viewport.zoom;
  //               const xs = [
  //                 _centerX - rect.width / 2 - offset,
  //                 _centerX + rect.width / 2 + offset,
  //                 rb.minX,
  //                 rb.maxX,
  //                 lb.minX,
  //                 lb.maxX,
  //               ].sort((a, b) => a - b);
  //               this.alignDistrubitePoints[0] = [
  //                 new Point(xs[1], y),
  //                 new Point(xs[2], y),
  //               ];
  //               this.alignDistrubitePoints[1] = [
  //                 new Point(xs[3], y),
  //                 new Point(xs[4], y),
  //               ];
  //             }
  //           };
  //           if (lb.horizontalDistance(rb) > rect.width) {
  //             _centerX = (lb.maxX + rb.minX) / 2;
  //             updateDif();
  //           }
  //           /** 左边对齐 */
  //           _centerX = lb.minX - (rb.minX - lb.maxX) - rect.width / 2;
  //           updateDif();
  //           /** 右边对齐 */
  //           _centerX = rb.minX - lb.maxX + rb.maxX + rect.width / 2;
  //           updateDif();
  //         }
  //       }
  //     }
  //     if (rst.dy === 0) {
  //       const hBoxes: IRectangle[] = [];
  //       this.alignBoxesDistribute.forEach((box) => {
  //         if (box.isSameVertical(rect)) {
  //           hBoxes.push(box);
  //         }
  //       });
  //       let dif = Infinity;
  //       let min = Infinity;
  //       for (let i = 0; i < hBoxes.length; i++) {
  //         for (let j = i + 1; j < hBoxes.length; j++) {
  //           let ub = hBoxes[i],
  //             db = hBoxes[j];
  //           if (!ub.isSameVertical(db)) continue;
  //           if (ub.isRectIntersect(db)) continue;
  //           if (db.maxY < ub.minX) {
  //             const temp = ub;
  //             ub = db;
  //             db = temp;
  //           }
  //           /** 中间对齐 */
  //           let _centerY = 0;
  //           const updateDif = () => {
  //             dif = Math.abs(rect.center.y - _centerY);
  //             if (dif <= threshold && dif < min) {
  //               min = dif;
  //               rst.dy = _centerY - rect.center.y;
  //               /**
  //                * 计算待绘制点
  //                */
  //               const xs = [ub.minX, ub.maxX, db.minX, db.maxX].sort(
  //                 (a, b) => a - b
  //               );
  //               const x = (xs[1] + xs[2]) / 2;
  //               const offset = 2 / viewport.zoom;
  //               const ys = [
  //                 _centerY - rect.height / 2 - offset,
  //                 _centerY + rect.height / 2 + offset,
  //                 db.minY,
  //                 db.maxY,
  //                 ub.minY,
  //                 ub.maxY,
  //               ].sort((a, b) => a - b);
  //               this.alignDistrubitePoints[3] = [
  //                 new Point(x, ys[1]),
  //                 new Point(x, ys[2]),
  //               ];
  //               this.alignDistrubitePoints[4] = [
  //                 new Point(x, ys[3]),
  //                 new Point(x, ys[4]),
  //               ];
  //             }
  //           };
  //           if (ub.verticalDistance(db) > rect.height) {
  //             _centerY = (ub.maxY + db.minY) / 2;
  //             updateDif();
  //           }
  //           /** 上边对齐 */
  //           _centerY = ub.minY - (db.minY - ub.maxY) - rect.height / 2;
  //           updateDif();
  //           /** 下边对齐 */
  //           _centerY = db.minY - ub.maxY + db.maxY + rect.height / 2;
  //           updateDif();
  //         }
  //       }
  //     }
  //   }
  //   this.draw();
  //   return rst;
  // }

  // private draw() {
  //   this.graphicGroup.getChildren().forEach((child) => child.destroy());
  //   if (
  //     this.alignPoints.length === 0 &&
  //     this.alignDistrubitePoints.length === 0
  //   )
  //     return;
  //   const viewport = this.editor.require("viewport");
  //   const strokeWidth = 1 / viewport.zoom;
  //   const offset = 5 / viewport.zoom;
  //   this.alignPoints.forEach((points) => {
  //     const p = new Path();
  //     p.interactive = false;
  //     p.stroke = REF_LINE_STROKE;
  //     p.strokeWidth = strokeWidth;
  //     if (points[0].x === points[1].x) {
  //       const x = points[0].x;
  //       const minY = Math.min(points[0].y, points[1].y);
  //       const maxY = Math.max(points[0].y, points[1].y);
  //       p.d = `M${x},${minY - offset}L${x},${maxY + offset}`;
  //     } else {
  //       const y = points[0].y;
  //       const minX = Math.min(points[0].x, points[1].x);
  //       const maxX = Math.max(points[0].x, points[1].x);
  //       p.d = `M${minX - offset},${y}L${maxX + offset},${y}`;
  //     }
  //     this.graphicGroup.addChild(p);
  //   });
  //   this.alignDistrubitePoints.forEach((points) => {
  //     const p = new Path();
  //     p.interactive = false;
  //     const bar = 5 / viewport.zoom;
  //     p.stroke = REF_LINE_STROKE;
  //     p.strokeWidth = strokeWidth;
  //     if (points[0].x === points[1].x) {
  //       const x = points[0].x;
  //       const minY = Math.min(points[0].y, points[1].y);
  //       const maxY = Math.max(points[0].y, points[1].y);
  //       p.d = `M${x},${minY}L${x},${maxY}
  //       M${x - bar},${minY}L${x + bar},${minY}
  //       M${x - bar},${maxY}L${x + bar},${maxY} `;
  //     } else {
  //       const y = points[0].y;
  //       const minX = Math.min(points[0].x, points[1].x);
  //       const maxX = Math.max(points[0].x, points[1].x);
  //       p.d = `M${minX},${y}L${maxX},${y}
  //       M${minX},${y - bar}L${minX},${y + bar}
  //       M${maxX},${y - bar}L${maxX},${y + bar}`;
  //     }
  //     this.graphicGroup.addChild(p);
  //   });
  // }

  // private drawLength() {
  //   if (this.alignLengthPoints.length === 0) return;
  //   const viewport = this.editor.require("viewport");
  //   const strokeWidth = 1 / viewport.zoom;
  //   const bar = 5 / viewport.zoom;
  //   this.alignLengthPoints.forEach((points) => {
  //     const p = new Path();
  //     p.interactive = false;
  //     p.stroke = REF_LINE_STROKE;
  //     p.strokeWidth = strokeWidth;
  //     if (points[0].x === points[1].x) {
  //       const x = points[0].x;
  //       const minY = Math.min(points[0].y, points[1].y);
  //       const maxY = Math.max(points[0].y, points[1].y);
  //       p.d = `M${x},${minY}L${x},${maxY}
  //       M${x - bar},${minY}L${x + bar},${minY}
  //       M${x - bar},${maxY}L${x + bar},${maxY}`;
  //       p.x = -10;
  //     } else {
  //       const y = points[0].y;
  //       const minX = Math.min(points[0].x, points[1].x);
  //       const maxX = Math.max(points[0].x, points[1].x);
  //       p.d = `M${minX},${y}L${maxX},${y}
  //       M${minX},${y - bar}L${minX},${y + bar}
  //       M${maxX},${y - bar}L${maxX},${y + bar}`;
  //       p.y = 10;
  //     }
  //     this.graphicGroup.addChild(p);
  //   });
  // }

  // alignLength(cell: IAlignCell) {
  //   const rst = { dx: 0, dy: 0 };
  //   if (cell !== this.lastAlignLengthCell) {
  //     this.lastAlignLengthCell = cell;
  //     this.prepareLengthAlign(cell);
  //   }
  //   if (this.alignBoxesLength.length === 0) return rst;
  //   const rect = cell.getAlignBBox();
  //   const { threshold } = this;
  //   let minW = Infinity;
  //   let minH = Infinity;
  //   let sameWs: IRectangle[] = [];
  //   let sameHs: IRectangle[] = [];
  //   this.alignBoxesLength.forEach((box) => {
  //     const difW = Math.abs(box.width - rect.width);
  //     if (difW < minW) {
  //       minW = difW;
  //       sameWs = [box];
  //     } else if (difW === minW) {
  //       sameWs.push(box);
  //     }
  //     const difH = Math.abs(box.height - rect.height);
  //     if (difH < minH) {
  //       minH = difH;
  //       sameHs = [box];
  //     } else if (difH === minH) {
  //       sameHs.push(box);
  //     }
  //   });
  //   rst.dx = minW < threshold ? minW : 0;
  //   rst.dy = minH < threshold ? minH : 0;
  //   sameWs.forEach((box) => {
  //     this.alignLengthPoints.push([
  //       new Point(box.minX, box.maxY),
  //       new Point(box.maxX, box.maxY),
  //     ]);
  //   });
  //   sameHs.forEach((box) => {
  //     this.alignLengthPoints.push([
  //       new Point(box.minX, box.minY),
  //       new Point(box.minX, box.maxY),
  //     ]);
  //   });

  //   this.drawLength();
  //   return rst;
  // }

  // reset(): void {
  //   this.graphicGroup.removeChildren();
  //   this.alignBoxes = [];
  //   this.alignPoints = [];
  //   this.alignDistrubitePoints = [];
  //   this.alignLengthPoints = [];
  //   this.lastAlignLengthCell = null;
  // }
}
