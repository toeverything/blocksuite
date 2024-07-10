import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';

import type {
  ConnectorMode,
  IBound,
  IVec2,
} from '../../../../surface-block/index.js';
import {
  Bound,
  CanvasElementType,
  type Connection,
  type ConnectorElementModel,
  GroupElementModel,
  type IVec,
  ShapeElementModel,
  ShapeType,
} from '../../../../surface-block/index.js';
import {
  calculateNearestLocation,
  ConnectorEndpointLocations,
  ConnectorEndpointLocationsOnTriangle,
} from '../../../../surface-block/managers/connector-manager.js';
import type { EdgelessTool } from '../../types.js';
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
  private _mode: ConnectorToolMode = ConnectorToolMode.Dragging;

  private _connector: ConnectorElementModel | null = null;

  private _source: Connection | null = null;

  private _sourceBounds: IBound | null = null;

  private _sourceLocations: IVec2[] = ConnectorEndpointLocations;

  private _startPoint: IVec | null = null;

  // Likes pressing `ESC`
  private _allowCancel = false;

  readonly tool = {
    type: 'connector',
  } as ConnectorTool;

  private _createConnector() {
    assertExists(this._source);
    assertExists(this._startPoint);

    this._doc.captureSync();
    const id = this._edgeless.service.addElement(CanvasElementType.CONNECTOR, {
      mode: this.tool.mode,
      controllers: [],
      source: this._source,
      target: { position: this._startPoint },
    });
    this._edgeless.service.telemetryService?.track('CanvasElementAdded', {
      control: 'canvas:draw',
      page: 'whiteboard editor',
      module: 'toolbar',
      segment: 'toolbar',
      type: CanvasElementType.CONNECTOR,
    });
    this._connector = this._edgeless.service.getElementById(
      id
    ) as ConnectorElementModel;
  }

  quickConnect(point: IVec, element: BlockSuite.EdgelessModelType) {
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
      this._surface.overlays.connector.sourceBounds = this._sourceBounds;
    }

    this.findTargetByPoint(point);
  }

  findTargetByPoint(point: IVec) {
    assertExists(this._connector);
    const {
      _connector,
      _edgeless,
      _surface: { overlays },
      _service: { viewport },
    } = this;

    point = viewport.toModelCoord(point[0], point[1]);

    const excludedIds = [];
    if (_connector.source.id) {
      excludedIds.push(_connector.source.id);
    }

    const target = overlays.connector.renderConnector(point, excludedIds);
    _edgeless.service.updateElement(_connector.id, { target });
  }

  onContainerClick() {
    if (this._mode === ConnectorToolMode.Dragging) return;
    if (!this._connector) return;

    const { id, source, target } = this._connector;
    let focusedId = id;

    if (source.id && !target.id) {
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

  onContainerTripleClick() {
    noop();
  }

  onContainerPointerDown(e: PointerEventState) {
    this._startPoint = this._service.viewport.toModelCoord(e.x, e.y);
    this._source = this._surface.overlays.connector.renderConnector(
      this._startPoint
    );
  }

  onContainerDragStart() {
    if (this._mode === ConnectorToolMode.Quick) return;

    this._createConnector();
  }

  onContainerDragMove(e: PointerEventState) {
    this.findTargetByPoint([e.x, e.y]);
  }

  onContainerDragEnd() {
    if (this._mode === ConnectorToolMode.Quick) return;
    assertExists(this._connector);

    this._doc.captureSync();
    this._edgeless.tools.switchToDefaultMode({
      elements: [this._connector.id],
      editing: false,
    });
  }

  onContainerMouseMove(e: PointerEventState) {
    if (this._mode === ConnectorToolMode.Dragging) return;

    assertExists(this._sourceBounds);
    assertExists(this._connector);

    const sourceId = this._connector.source.id;
    assertExists(sourceId);

    const point = this._service.viewport.toModelCoord(e.x, e.y);
    const target = this._surface.overlays.connector.renderConnector(point, [
      sourceId,
    ]);

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

  onPressShiftKey(_: boolean) {
    noop();
  }

  onPressSpaceBar(_pressed: boolean): void {
    noop();
  }

  beforeModeSwitch(edgelessTool: EdgelessTool) {
    if (edgelessTool.type === 'connector') return;

    const id = this._connector?.id;
    if (this._allowCancel && id) {
      this._edgeless.service.removeElement(id);
    }

    this._surface.overlays.connector.clear();
    this._mode = ConnectorToolMode.Dragging;
    this._connector = null;
    this._source = null;
    this._sourceBounds = null;
    this._startPoint = null;
    this._allowCancel = false;
  }

  afterModeSwitch() {
    noop();
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      connector: ConnectorToolController;
    }
  }
}
