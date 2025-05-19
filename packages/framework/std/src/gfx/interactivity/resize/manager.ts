import {
  Bound,
  getCommonBoundWithRotation,
  type IVec,
} from '@blocksuite/global/gfx';

import type { GfxController } from '../..';
import type { GfxModel } from '../../model/model';

export type ResizeHandle =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left';

export const DEFAULT_HANDLES: ResizeHandle[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'left',
  'right',
  'top',
  'bottom',
];

interface ElementInitialSnapshot {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
}

export interface OptionResize {
  elements: GfxModel[];
  handle: ResizeHandle;
  lockRatio: boolean;
  event: PointerEvent;
  onResizeUpdate: (payload: {
    lockRatio: boolean;
    scaleX: number;
    scaleY: number;
    data: {
      model: GfxModel;
      originalBound: Bound;
      newBound: Bound;
      lockRatio: boolean;
      matrix: DOMMatrix;
    }[];
  }) => void;
  onResizeStart?: (payload: { data: { model: GfxModel }[] }) => void;
  onResizeEnd?: (payload: { data: { model: GfxModel }[] }) => void;
}

export type RotateOption = {
  elements: GfxModel[];
  event: PointerEvent;

  onRotateUpdate: (payload: {
    delta: number;
    data: {
      model: GfxModel;
      newBound: Bound;
      originalBound: Bound;
      originalRotate: number;
      newRotate: number;
      matrix: DOMMatrix;
    }[];
  }) => void;

  onRotateStart?: (payload: { data: { model: GfxModel }[] }) => void;

  onRotateEnd?: (payload: { data: { model: GfxModel }[] }) => void;
};

export class ResizeController {
  private readonly gfx: GfxController;

  get host() {
    return this.gfx.std.host;
  }

  constructor(option: { gfx: GfxController }) {
    this.gfx = option.gfx;
  }

  startResize(options: OptionResize) {
    const {
      elements,
      handle,
      lockRatio,
      onResizeStart,
      onResizeUpdate,
      onResizeEnd,
      event,
    } = options;

    const originals: ElementInitialSnapshot[] = elements.map(el => ({
      x: el.x,
      y: el.y,
      w: el.w,
      h: el.h,
      rotate: el.rotate,
    }));
    const startPt = this.gfx.viewport.toModelCoordFromClientCoord([
      event.clientX,
      event.clientY,
    ]);

    const onPointerMove = (e: PointerEvent) => {
      const currPt = this.gfx.viewport.toModelCoordFromClientCoord([
        e.clientX,
        e.clientY,
      ]);
      const shouldLockRatio = lockRatio || e.shiftKey;

      if (elements.length === 1) {
        this.resizeSingle(
          originals[0],
          elements[0],
          shouldLockRatio,
          startPt,
          currPt,
          handle,
          onResizeUpdate
        );
      } else {
        this.resizeMulti(
          originals,
          elements,
          handle,
          currPt,
          startPt,
          onResizeUpdate
        );
      }
    };

    onResizeStart?.({ data: elements.map(model => ({ model })) });

    const onPointerUp = () => {
      this.host.removeEventListener('pointermove', onPointerMove);
      this.host.removeEventListener('pointerup', onPointerUp);

      onResizeEnd?.({ data: elements.map(model => ({ model })) });
    };

    this.host.addEventListener('pointermove', onPointerMove);
    this.host.addEventListener('pointerup', onPointerUp);
  }

  private resizeSingle(
    orig: ElementInitialSnapshot,
    model: GfxModel,
    lockRatio: boolean,
    startPt: IVec,
    currPt: IVec,
    handle: ResizeHandle,
    updateCallback: OptionResize['onResizeUpdate']
  ) {
    const { xSign, ySign } = this.getHandleSign(handle);

    const pivot = new DOMPoint(
      orig.x + (-xSign === 1 ? orig.w : 0),
      orig.y + (-ySign === 1 ? orig.h : 0)
    );
    const toLocalRotatedM = new DOMMatrix()
      .translate(-pivot.x, -pivot.y)
      .translate(orig.w / 2 + orig.x, orig.h / 2 + orig.y)
      .rotate(-orig.rotate)
      .translate(-(orig.w / 2 + orig.x), -(orig.h / 2 + orig.y));
    const toLocalM = new DOMMatrix().translate(-pivot.x, -pivot.y);

    const toLocal = (p: DOMPoint, withRotation: boolean) =>
      p.matrixTransform(withRotation ? toLocalRotatedM : toLocalM);
    const toModel = (p: DOMPoint) =>
      p.matrixTransform(toLocalRotatedM.inverse());

    const currPtLocal = toLocal(new DOMPoint(currPt[0], currPt[1]), true);
    const handleLocal = toLocal(new DOMPoint(startPt[0], startPt[1]), true);

    let scaleX = xSign
      ? (xSign * (currPtLocal.x - handleLocal.x) + orig.w) / orig.w
      : 1;
    let scaleY = ySign
      ? (ySign * (currPtLocal.y - handleLocal.y) + orig.h) / orig.h
      : 1;

    if (lockRatio) {
      const min = Math.min(Math.abs(scaleX), Math.abs(scaleY));
      scaleX = Math.sign(scaleX) * min;
      scaleY = Math.sign(scaleY) * min;
    }

    const scaleM = new DOMMatrix().scale(scaleX, scaleY);

    const [visualTopLeft, visualBottomRight] = [
      new DOMPoint(orig.x, orig.y),
      new DOMPoint(orig.x + orig.w, orig.y + orig.h),
    ].map(p => {
      const localP = toLocal(p, false);
      const scaledP = localP.matrixTransform(scaleM);

      return toModel(scaledP);
    });

    const center = {
      x:
        Math.min(visualTopLeft.x, visualBottomRight.x) +
        Math.abs(visualBottomRight.x - visualTopLeft.x) / 2,
      y:
        Math.min(visualTopLeft.y, visualBottomRight.y) +
        Math.abs(visualBottomRight.y - visualTopLeft.y) / 2,
    };

    const restoreM = new DOMMatrix()
      .translate(center.x, center.y)
      .rotate(-orig.rotate)
      .translate(-center.x, -center.y);

    // only used to provide the matrix information
    const finalM = restoreM
      .multiply(toLocalRotatedM.inverse())
      .multiply(scaleM)
      .multiply(toLocalM);

    const [topLeft, bottomRight] = [visualTopLeft, visualBottomRight].map(p => {
      return p.matrixTransform(restoreM);
    });

    updateCallback({
      lockRatio,
      scaleX,
      scaleY,
      data: [
        {
          model: model,
          originalBound: new Bound(orig.x, orig.y, orig.w, orig.h),
          newBound: new Bound(
            Math.min(topLeft.x, bottomRight.x),
            Math.min(bottomRight.y, topLeft.y),
            Math.abs(bottomRight.x - topLeft.x),
            Math.abs(bottomRight.y - topLeft.y)
          ),
          lockRatio: lockRatio,
          matrix: finalM,
        },
      ],
    });
  }

  private resizeMulti(
    originals: ElementInitialSnapshot[],
    elements: GfxModel[],
    handle: ResizeHandle,
    currPt: IVec,
    startPt: IVec,
    updateCallback: OptionResize['onResizeUpdate']
  ) {
    const commonBound = getCommonBoundWithRotation(originals);
    const { xSign, ySign } = this.getHandleSign(handle);

    const pivot = new DOMPoint(
      commonBound.x + ((-xSign + 1) / 2) * commonBound.w,
      commonBound.y + ((-ySign + 1) / 2) * commonBound.h
    );
    const toLocalM = new DOMMatrix().translate(-pivot.x, -pivot.y);

    const toLocal = (p: DOMPoint) => p.matrixTransform(toLocalM);

    const currPtLocal = toLocal(new DOMPoint(currPt[0], currPt[1]));
    const handleLocal = toLocal(new DOMPoint(startPt[0], startPt[1]));

    let scaleX = xSign
      ? (xSign * (currPtLocal.x - handleLocal.x) + commonBound.w) /
        commonBound.w
      : 1;
    let scaleY = ySign
      ? (ySign * (currPtLocal.y - handleLocal.y) + commonBound.h) /
        commonBound.h
      : 1;

    const min = Math.max(Math.abs(scaleX), Math.abs(scaleY));
    scaleX = Math.sign(scaleX) * min;
    scaleY = Math.sign(scaleY) * min;

    const scaleM = new DOMMatrix().scale(scaleX, scaleY);

    const data = elements.map((model, i) => {
      const orig = originals[i];
      const finalM = new DOMMatrix()
        .multiply(toLocalM.inverse())
        .multiply(scaleM)
        .multiply(toLocalM);
      const [topLeft, bottomRight] = [
        new DOMPoint(orig.x, orig.y),
        new DOMPoint(orig.x + orig.w, orig.y + orig.h),
      ].map(p => {
        return p.matrixTransform(finalM);
      });

      const newBound = new Bound(
        Math.min(topLeft.x, bottomRight.x),
        Math.min(bottomRight.y, topLeft.y),
        Math.abs(bottomRight.x - topLeft.x),
        Math.abs(bottomRight.y - topLeft.y)
      );

      return {
        model,
        originalBound: new Bound(orig.x, orig.y, orig.w, orig.h),
        newBound,
        lockRatio: true,
        matrix: finalM,
      };
    });

    updateCallback({ lockRatio: true, scaleX, scaleY, data });
  }

  startRotate(option: RotateOption) {
    const { event, elements, onRotateUpdate } = option;

    const originals: ElementInitialSnapshot[] = elements.map(el => ({
      x: el.x,
      y: el.y,
      w: el.w,
      h: el.h,
      rotate: el.rotate,
    }));

    const startPt = this.gfx.viewport.toModelCoordFromClientCoord([
      event.clientX,
      event.clientY,
    ]);
    const onPointerMove = (e: PointerEvent) => {
      const currentPt = this.gfx.viewport.toModelCoordFromClientCoord([
        e.clientX,
        e.clientY,
      ]);
      const snap = e.shiftKey;

      if (elements.length > 1) {
        this.rotateMulti({
          origs: originals,
          models: elements,
          startPt,
          currentPt,
          snap,
          onRotateUpdate,
        });
      } else {
        this.rotateSingle({
          orig: originals[0],
          model: elements[0],
          startPt,
          currentPt,
          snap,
          onRotateUpdate,
        });
      }
    };
    const onPointerUp = () => {
      this.host.removeEventListener('pointermove', onPointerMove);
      this.host.removeEventListener('pointerup', onPointerUp);
      this.host.removeEventListener('pointercancel', onPointerUp);

      option.onRotateEnd?.({ data: elements.map(model => ({ model })) });
    };

    option.onRotateStart?.({ data: elements.map(model => ({ model })) });

    this.host.addEventListener('pointermove', onPointerMove, false);
    this.host.addEventListener('pointerup', onPointerUp, false);
    this.host.addEventListener('pointercancel', onPointerUp, false);
  }

  private getNormalizedAngle(y: number, x: number) {
    let angle = Math.atan2(y, x);
    if (angle < 0) {
      angle += 2 * Math.PI;
    }

    return (angle * 180) / Math.PI;
  }

  private toNormalizedAngle(angle: number) {
    if (angle < 0) {
      angle += 360;
    }

    return Math.round(angle) % 360;
  }

  private rotateSingle(option: {
    orig: ElementInitialSnapshot;
    model: GfxModel;
    startPt: IVec;
    currentPt: IVec;
    snap: boolean;
    onRotateUpdate?: RotateOption['onRotateUpdate'];
  }) {
    const { orig, model, startPt, currentPt, snap, onRotateUpdate } = option;

    const center = {
      x: orig.x + orig.w / 2,
      y: orig.y + orig.h / 2,
    };
    const toLocalM = new DOMMatrix().translate(-center.x, -center.y);
    const toLocal = (p: DOMPoint) => p.matrixTransform(toLocalM);

    const v0 = toLocal(new DOMPoint(startPt[0], startPt[1])),
      v1 = toLocal(new DOMPoint(currentPt[0], currentPt[1]));

    const startAngle = this.getNormalizedAngle(v0.y, v0.x),
      endAngle = this.getNormalizedAngle(v1.y, v1.x);
    const deltaDeg = endAngle - startAngle;
    const rotatedAngle = orig.rotate + deltaDeg;
    const targetRotate = this.toNormalizedAngle(
      snap
        ? Math.round((rotatedAngle % 15) / 15) * 15 +
            Math.floor(rotatedAngle / 15) * 15
        : rotatedAngle
    );

    // only used to provide the matrix information
    const rotateM = new DOMMatrix()
      .translate(center.x, center.y)
      .rotate(targetRotate - orig.rotate)
      .translate(-center.x, -center.y);

    onRotateUpdate?.({
      delta: deltaDeg,
      data: [
        {
          model,
          originalBound: new Bound(orig.x, orig.y, orig.w, orig.h),
          newBound: new Bound(orig.x, orig.y, orig.w, orig.h),
          originalRotate: orig.rotate,
          newRotate: targetRotate,
          matrix: rotateM,
        },
      ],
    });
  }

  private rotateMulti(option: {
    origs: ElementInitialSnapshot[];
    models: GfxModel[];
    startPt: IVec;
    currentPt: IVec;
    snap: boolean;
    onRotateUpdate?: RotateOption['onRotateUpdate'];
  }) {
    const { models, startPt, currentPt, onRotateUpdate } = option;
    const commonBound = getCommonBoundWithRotation(option.origs);

    const center = {
      x: commonBound.x + commonBound.w / 2,
      y: commonBound.y + commonBound.h / 2,
    };
    const toLocalM = new DOMMatrix().translate(-center.x, -center.y);
    const toLocal = (p: DOMPoint) => p.matrixTransform(toLocalM);

    const v0 = toLocal(new DOMPoint(startPt[0], startPt[1])),
      v1 = toLocal(new DOMPoint(currentPt[0], currentPt[1]));
    const a0 = this.getNormalizedAngle(v0.y, v0.x),
      a1 = this.getNormalizedAngle(v1.y, v1.x);
    const deltaDeg = a1 - a0;
    const rotateM = new DOMMatrix()
      .translate(center.x, center.y)
      .rotate(deltaDeg)
      .translate(-center.x, -center.y);
    const toRotatedPoint = (p: DOMPoint) => p.matrixTransform(rotateM);

    onRotateUpdate?.({
      delta: deltaDeg,
      data: models.map((model, index) => {
        const orig = option.origs[index];
        const center = {
          x: orig.x + orig.w / 2,
          y: orig.y + orig.h / 2,
        };

        const visualM = new DOMMatrix()
          .translate(center.x, center.y)
          .rotate(orig.rotate)
          .translate(-center.x, -center.y);
        const toVisual = (p: DOMPoint) => p.matrixTransform(visualM);

        const [rotatedVisualLeftTop, rotatedVisualBottomRight] = [
          new DOMPoint(orig.x, orig.y),
          new DOMPoint(orig.x + orig.w, orig.y + orig.h),
        ].map(p => toRotatedPoint(toVisual(p)));

        const newCenter = {
          x:
            Math.min(rotatedVisualLeftTop.x, rotatedVisualBottomRight.x) +
            Math.abs(rotatedVisualBottomRight.x - rotatedVisualLeftTop.x) / 2,
          y:
            Math.min(rotatedVisualLeftTop.y, rotatedVisualBottomRight.y) +
            Math.abs(rotatedVisualBottomRight.y - rotatedVisualLeftTop.y) / 2,
        };
        const newRotated = this.toNormalizedAngle(orig.rotate + deltaDeg);
        const finalM = new DOMMatrix()
          .translate(newCenter.x, newCenter.y)
          .rotate(-newRotated)
          .translate(-newCenter.x, -newCenter.y)
          .multiply(rotateM)
          .multiply(visualM);

        const topLeft = rotatedVisualLeftTop.matrixTransform(
          new DOMMatrix()
            .translate(newCenter.x, newCenter.y)
            .rotate(-newRotated)
            .translate(-newCenter.x, -newCenter.y)
        );

        return {
          model,
          originalBound: new Bound(orig.x, orig.y, orig.w, orig.h),
          newBound: new Bound(topLeft.x, topLeft.y, orig.w, orig.h),
          originalRotate: orig.rotate,
          newRotate: newRotated,
          matrix: finalM,
        };
      }),
    });
  }

  private getHandleSign(handle: ResizeHandle) {
    switch (handle) {
      case 'top-left':
        return { xSign: -1, ySign: -1 };
      case 'top':
        return { xSign: 0, ySign: -1 };
      case 'top-right':
        return { xSign: 1, ySign: -1 };
      case 'right':
        return { xSign: 1, ySign: 0 };
      case 'bottom-right':
        return { xSign: 1, ySign: 1 };
      case 'bottom':
        return { xSign: 0, ySign: 1 };
      case 'bottom-left':
        return { xSign: -1, ySign: 1 };
      case 'left':
        return { xSign: -1, ySign: 0 };
      default:
        return { xSign: 0, ySign: 0 };
    }
  }
}
