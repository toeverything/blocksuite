import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';

import type { ConnectorTool } from '../../../__internal__/index.js';
import {
  type Connection,
  type ConnectorElement,
  type IVec,
  StrokeStyle,
} from '../../../surface-block/index.js';
import { EdgelessToolController } from './index.js';

export class ConnectorToolController extends EdgelessToolController<ConnectorTool> {
  readonly tool = <ConnectorTool>{
    type: 'connector',
  };

  private _connector: ConnectorElement | null = null;
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
    this._startPoint = this._surface.viewport.toModelCoord(e.x, e.y);
    this._source = this._surface.connector.searchConnection(this._startPoint);
  }

  onContainerDragStart() {
    assertExists(this._source);
    assertExists(this._startPoint);
    this._page.captureSync();
    const { mode, color, strokeWidth } = this.tool;
    const { _surface } = this;
    const id = _surface.addElement('connector', {
      stroke: color,
      mode,
      controllers: [],
      strokeWidth,
      strokeStyle: StrokeStyle.Solid,
      source: this._source,
      target: { position: this._startPoint },
    });
    this._connector = _surface.pickById(id) as unknown as ConnectorElement;
  }

  onContainerDragMove(e: PointerEventState) {
    assertExists(this._connector);
    const { connector, viewport } = this._surface;

    const point = viewport.toModelCoord(e.x, e.y);
    const target = connector.searchConnection(
      point,
      this._connector.source.id ? [this._connector.source.id] : []
    ) as Connection;
    this._surface.updateElement<'connector'>(this._connector.id, { target });
  }

  onContainerDragEnd() {
    assertExists(this._connector);
    this._surface.connector.clear();
    this._page.captureSync();
    this._edgeless.tools.switchToDefaultMode({
      elements: [this._connector.id],
      editing: false,
    });
    this._connector = null;
  }

  onContainerMouseMove(e: PointerEventState) {
    const { connector, viewport } = this._surface;
    const point = viewport.toModelCoord(e.x, e.y);
    connector.searchConnection(point);
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
    this._surface.connector.clear();
  }
}
