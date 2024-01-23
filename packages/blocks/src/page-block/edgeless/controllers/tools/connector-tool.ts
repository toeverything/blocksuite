import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';

import type { ConnectorTool } from '../../../../_common/utils/index.js';
import type { ConnectorElementModel } from '../../../../surface-block/index.js';
import {
  CanvasElementType,
  type Connection,
  type IVec,
} from '../../../../surface-block/index.js';
import { EdgelessToolController } from './index.js';

export class ConnectorToolController extends EdgelessToolController<ConnectorTool> {
  readonly tool = <ConnectorTool>{
    type: 'connector',
  };

  private _connector: ConnectorElementModel | null = null;
  private _source: Connection | null = null;
  private _startPoint: IVec | null = null;

  onContainerClick(): void {
    noop();
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

  onContainerPointerDown(e: PointerEventState): void {
    this._startPoint = this._service.viewport.toModelCoord(e.x, e.y);
    this._source = this._surface.overlays.connector.renderConnector(
      this._startPoint
    );
  }

  onContainerDragStart() {
    assertExists(this._source);
    assertExists(this._startPoint);
    this._page.captureSync();
    const { mode } = this.tool;

    const { _edgeless } = this;
    const id = _edgeless.service.addElement(CanvasElementType.CONNECTOR, {
      mode,
      controllers: [],
      source: this._source,
      target: { position: this._startPoint },
    });
    this._connector = _edgeless.service.getElementById(
      id
    ) as ConnectorElementModel;
  }

  onContainerDragMove(e: PointerEventState) {
    assertExists(this._connector);
    const { overlays } = this._surface;
    const { viewport } = this._service;

    const point = viewport.toModelCoord(e.x, e.y);
    const target = overlays.connector.renderConnector(
      point,
      this._connector.source.id ? [this._connector.source.id] : []
    ) as Connection;
    this._edgeless.service.updateElement(this._connector.id, { target });
  }

  onContainerDragEnd() {
    assertExists(this._connector);
    this._surface.overlays.connector.clear();
    this._page.captureSync();
    this._edgeless.tools.switchToDefaultMode({
      elements: [this._connector.id],
      editing: false,
    });
    this._connector = null;
  }

  onContainerMouseMove(e: PointerEventState) {
    const { overlays } = this._surface;
    const { viewport } = this._service;
    const point = viewport.toModelCoord(e.x, e.y);

    overlays.connector.renderConnector(point);
  }

  onContainerMouseOut() {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch() {
    this._surface.overlays.connector.clear();
  }
}
