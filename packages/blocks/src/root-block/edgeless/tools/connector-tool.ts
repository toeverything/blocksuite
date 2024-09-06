import type {
  Connection,
  ConnectorElementModel,
  ConnectorMode,
} from '@blocksuite/affine-model';
import type { PointerEventState } from '@blocksuite/block-std';
import type { IBound, IVec } from '@blocksuite/global/utils';

import {
  calculateNearestLocation,
  CanvasElementType,
  ConnectorEndpointLocations,
  ConnectorEndpointLocationsOnTriangle,
} from '@blocksuite/affine-block-surface';
import {
  GroupElementModel,
  ShapeElementModel,
  ShapeType,
} from '@blocksuite/affine-model';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import { Bound, noop } from '@blocksuite/global/utils';

import type { EdgelessTool } from '../types.js';

import { EdgelessToolController } from './edgeless-tool.js';

enum ConnectorToolMode {
  // Dragging connect
  Dragging,
  // Quick connect
  Quick,
}

export type ConnectorTool = {
  type: 'connector';
  mode: ConnectorMode;
};

export class ConnectorToolController extends EdgelessToolController<ConnectorTool> {
  // Likes pressing `ESC`
  private _allowCancel = false;

  private _connector: ConnectorElementModel | null = null;

  private _mode: ConnectorToolMode = ConnectorToolMode.Dragging;

  private _source: Connection | null = null;

  private _sourceBounds: IBound | null = null;

  private _sourceLocations: IVec[] = ConnectorEndpointLocations;

  private _startPoint: IVec | null = null;

  readonly tool = {
    type: 'connector',
  } as ConnectorTool;

  get connector() {
    return this._edgeless.service.connectorOverlay;
  }

  private _createConnector() {
    if (!(this._source && this._startPoint)) {
      this._source = null;
      this._startPoint = null;
      return;
    }

    this._doc.captureSync();
    const id = this._edgeless.service.addElement(CanvasElementType.CONNECTOR, {
      mode: this.tool.mode,
      controllers: [],
      source: this._source,
      target: { position: this._startPoint },
    });

    this._edgeless.std
      .getOptional(TelemetryProvider)
      ?.track('CanvasElementAdded', {
        control: 'canvas:draw',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: CanvasElementType.CONNECTOR,
      });

    const connector = this._edgeless.service.getElementById(id);
    if (!connector) {
      this._source = null;
      this._startPoint = null;
      return;
    }

    this._connector = connector as ConnectorElementModel;
  }

  afterModeSwitch() {
    noop();
  }

  beforeModeSwitch(edgelessTool: EdgelessTool) {
    if (edgelessTool.type === 'connector') return;

    const id = this._connector?.id;
    if (this._allowCancel && id) {
      this._edgeless.service.removeElement(id);
    }

    this._edgeless.service.overlays.connector.clear();
    this._mode = ConnectorToolMode.Dragging;
    this._connector = null;
    this._source = null;
    this._sourceBounds = null;
    this._startPoint = null;
    this._allowCancel = false;
  }

  findTargetByPoint(point: IVec) {
    if (!this._connector) return;
    const {
      _connector,
      _edgeless,
      _service: { viewport },
    } = this;

    point = viewport.toModelCoord(point[0], point[1]);

    const excludedIds = [];
    if (_connector.source?.id) {
      excludedIds.push(_connector.source.id);
    }

    const target = this.connector.renderConnector(point, excludedIds);
    _edgeless.service.updateElement(_connector.id, { target });
  }

  onContainerClick() {
    if (this._mode === ConnectorToolMode.Dragging) return;
    if (!this._connector) return;

    const { id, source, target } = this._connector;
    let focusedId = id;

    if (source?.id && !target?.id) {
      focusedId = source.id;
      this._allowCancel = true;
    }

    this._edgeless.tools.switchToDefaultMode({
      elements: [focusedId],
      editing: false,
    });
  }

  onContainerContextMenu(): void {
    noop();
  }

  onContainerDblClick(): void {
    noop();
  }

  onContainerDragEnd() {
    if (this._mode === ConnectorToolMode.Quick) return;
    if (!this._connector) return;

    this._doc.captureSync();
    this._edgeless.tools.switchToDefaultMode({
      elements: [this._connector.id],
      editing: false,
    });
  }

  onContainerDragMove(e: PointerEventState) {
    this.findTargetByPoint([e.x, e.y]);
  }

  onContainerDragStart() {
    if (this._mode === ConnectorToolMode.Quick) return;

    this._createConnector();
  }

  onContainerMouseMove(e: PointerEventState) {
    if (this._mode === ConnectorToolMode.Dragging) return;
    if (!this._sourceBounds) return;
    if (!this._connector) return;
    const sourceId = this._connector.source?.id;
    if (!sourceId) return;

    const point = this._service.viewport.toModelCoord(e.x, e.y);
    const target = this.connector.renderConnector(point, [sourceId]);

    this._allowCancel = !target.id;
    this._connector.source.position = calculateNearestLocation(
      point,
      this._sourceBounds,
      this._sourceLocations
    );
    this._edgeless.service.updateElement(this._connector.id, {
      target,
      source: this._connector.source,
    });
  }

  onContainerMouseOut() {
    noop();
  }

  onContainerPointerDown(e: PointerEventState) {
    this._startPoint = this._service.viewport.toModelCoord(e.x, e.y);
    this._source = this.connector.renderConnector(this._startPoint);
  }

  onContainerTripleClick() {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  onPressSpaceBar(_pressed: boolean): void {
    noop();
  }

  quickConnect(point: IVec, element: BlockSuite.EdgelessModel) {
    this._startPoint = this._service.viewport.toModelCoord(point[0], point[1]);
    this._mode = ConnectorToolMode.Quick;
    this._sourceBounds = Bound.deserialize(element.xywh);
    this._sourceBounds.rotate = element.rotate;
    this._sourceLocations =
      element instanceof ShapeElementModel &&
      element.shapeType === ShapeType.Triangle
        ? ConnectorEndpointLocationsOnTriangle
        : ConnectorEndpointLocations;

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

    if (element instanceof GroupElementModel) {
      this.connector.sourceBounds = this._sourceBounds;
    }

    this.findTargetByPoint(point);
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      connector: ConnectorToolController;
    }
  }
}
