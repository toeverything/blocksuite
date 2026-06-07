import {
  CanvasElementType,
  DefaultTool,
  OverlayIdentifier,
} from '@blocksuite/affine-block-surface';
import {
  type Connection,
  type ConnectorElementModel,
  ConnectorMode,
  DEFAULT_POLYGON_VERTICES,
  GroupElementModel,
  ShapeElementModel,
  ShapeType,
} from '@blocksuite/affine-model';
import {
  EditPropsStore,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import type { IBound, IVec } from '@blocksuite/global/gfx';
import { Bound, polygonCentroid } from '@blocksuite/global/gfx';
import type { PointerEventState } from '@blocksuite/std';
import { BaseTool, type GfxModel } from '@blocksuite/std/gfx';

import {
  calculateNearestLocation,
  type ConnectionOverlay,
  ConnectorEndpointLocations,
  ConnectorEndpointLocationsOnTriangle,
  ConnectorEndpointLocationsWithCenter,
  isCenterAnchorEligible,
} from './connector-manager';

enum ConnectorToolMode {
  // Dragging connect
  Dragging,
  // Quick connect
  Quick,
}

export type ConnectorToolOptions = {
  mode: ConnectorMode;
};

export class ConnectorTool extends BaseTool<ConnectorToolOptions> {
  static override toolName: string = 'connector';

  // Likes pressing `ESC`
  private _allowCancel = false;

  private _connector: ConnectorElementModel | null = null;

  private _mode: ConnectorToolMode = ConnectorToolMode.Dragging;

  private _source: Connection | null = null;

  private _sourceBounds: IBound | null = null;

  private _sourceLocations: IVec[] = ConnectorEndpointLocations;

  private _startPoint: IVec | null = null;

  private get _overlay() {
    return this.std.get(OverlayIdentifier('connection')) as ConnectionOverlay;
  }

  private _createConnector() {
    if (!(this._source && this._startPoint) || !this.gfx.surface) {
      this._source = null;
      this._startPoint = null;
      return;
    }

    this.doc.captureSync();
    const id = this.gfx.surface.addElement({
      type: CanvasElementType.CONNECTOR,
      mode: this.activatedOption.mode,
      controllers: [],
      source: this._source,
      target: { position: this._startPoint },
    });

    this.gfx.std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
      control: 'canvas:draw',
      page: 'whiteboard editor',
      module: 'toolbar',
      segment: 'toolbar',
      type: CanvasElementType.CONNECTOR,
    });

    const connector = this.gfx.getElementById(id);
    if (!connector) {
      this._source = null;
      this._startPoint = null;
      return;
    }

    this._connector = connector as ConnectorElementModel;
  }

  override click() {
    if (this._mode === ConnectorToolMode.Dragging) return;
    if (!this._connector) return;

    const { id, source, target } = this._connector;
    let focusedId = id;

    if (source?.id && !target?.id) {
      focusedId = source.id;
      this._allowCancel = true;
    }

    this.gfx.tool.setTool(DefaultTool);
    this.gfx.selection.set({ elements: [focusedId] });
  }

  override deactivate() {
    const id = this._connector?.id;

    if (this._allowCancel && id) {
      this.gfx.surface?.deleteElement(id);
    }

    this._overlay?.clear();
    this._mode = ConnectorToolMode.Dragging;
    this._connector = null;
    this._source = null;
    this._sourceBounds = null;
    this._startPoint = null;
    this._allowCancel = false;
  }

  override dragEnd() {
    if (this._mode === ConnectorToolMode.Quick) return;
    if (!this._connector) return;

    const connector = this._connector;

    this.doc.captureSync();

    this.gfx.tool.setTool(DefaultTool);
    this.gfx.selection.set({ elements: [connector.id] });
  }

  override dragMove(e: PointerEventState) {
    this.findTargetByPoint([e.x, e.y]);
  }

  override dragStart() {
    if (this._mode === ConnectorToolMode.Quick) return;

    this._createConnector();
  }

  findTargetByPoint(point: IVec) {
    if (!this._connector || !this.gfx.surface) return;

    const { _connector } = this;

    point = this.gfx.viewport.toModelCoord(point[0], point[1]);

    const excludedIds = [];
    if (_connector.source?.id) {
      excludedIds.push(_connector.source.id);
    }

    const target = this._overlay?.renderConnector(point, excludedIds);
    this.gfx.updateElement(_connector, { target });
  }

  override pointerDown(e: PointerEventState) {
    this._startPoint = this.gfx.viewport.toModelCoord(e.x, e.y);
    this._source = this._overlay?.renderConnector(this._startPoint) ?? null;
  }

  override pointerMove(e: PointerEventState) {
    if (this._mode === ConnectorToolMode.Dragging) return;
    if (!this._sourceBounds) return;
    if (!this._connector) return;
    const sourceId = this._connector.source?.id;
    if (!sourceId) return;

    const point = this.gfx.viewport.toModelCoord(e.x, e.y);
    const target = this._overlay!.renderConnector(point, [sourceId]);

    this._allowCancel = !target.id;
    this._connector.source.position = calculateNearestLocation(
      point,
      this._sourceBounds,
      this._sourceLocations
    );
    this.gfx.updateElement(this._connector, {
      target,
      source: this._connector.source,
    });
  }

  override pointerUp(_: PointerEventState): void {
    this._overlay?.clear();
  }

  quickConnect(point: IVec, element: GfxModel) {
    this._startPoint = this.gfx.viewport.toModelCoord(point[0], point[1]);
    this._mode = ConnectorToolMode.Quick;
    this._sourceBounds = Bound.deserialize(element.xywh);
    this._sourceBounds.rotate = element.rotate;
    if (
      element instanceof ShapeElementModel &&
      element.shapeType === ShapeType.Polygon
    ) {
      // Use polygon vertices and edge midpoints as endpoint locations
      const verts: number[][] = element.vertices ?? DEFAULT_POLYGON_VERTICES;
      const locations: IVec[] = [];
      for (let i = 0; i < verts.length; i++) {
        locations.push([verts[i][0], verts[i][1]]);
        const next = verts[(i + 1) % verts.length];
        locations.push([
          (verts[i][0] + next[0]) / 2,
          (verts[i][1] + next[1]) / 2,
        ]);
      }
      // Geometric centroid as a center anchor (gated on the global toggle),
      // mirroring the center anchor offered for other shape types.
      const centerAnchorEnabled =
        this.std.getOptional(EditPropsStore)?.getStorage(
          'connectorCenterAnchor'
        ) ?? true;
      if (centerAnchorEnabled) {
        locations.push(polygonCentroid(verts));
      }
      this._sourceLocations = locations;
    } else {
      const centerAnchorEnabled =
        this.std.getOptional(EditPropsStore)?.getStorage(
          'connectorCenterAnchor'
        ) ?? true;
      this._sourceLocations =
        element instanceof ShapeElementModel &&
        element.shapeType === ShapeType.Triangle
          ? ConnectorEndpointLocationsOnTriangle
          : centerAnchorEnabled && isCenterAnchorEligible(element)
            ? ConnectorEndpointLocationsWithCenter
            : ConnectorEndpointLocations;
    }

    this._source = {
      id: element.id,
      position: calculateNearestLocation(
        this._startPoint,
        this._sourceBounds,
        this._sourceLocations
      ),
    };
    this._allowCancel = true;

    this._createConnector();

    if (element instanceof GroupElementModel && this._overlay) {
      this._overlay.sourceBounds = this._sourceBounds;
    }

    this.findTargetByPoint(point);
  }

  getNextMode() {
    // reorder the enum values
    const modes = [
      ConnectorMode.Curve,
      ConnectorMode.Orthogonal,
      ConnectorMode.Straight,
    ];

    const currentIndex = modes.indexOf(this.activatedOption.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    return modes[nextIndex];
  }
}
