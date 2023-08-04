import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { Connection, ConnectorElement, IVec } from '@blocksuite/phasor';
import { StrokeStyle } from '@blocksuite/phasor';

import type { ConnectorTool } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { EdgelessToolController } from './index.js';

export class ConnectorToolController extends EdgelessToolController<ConnectorTool> {
  readonly tool = <ConnectorTool>{
    type: 'connector',
  };

  private _connector: ConnectorElement | null = null;
  private _source: Connection | null = null;
  private _startPoint: IVec | null = null;

  onContainerClick(e: PointerEventState): void {
    noop();
  }

  onContainerContextMenu(e: PointerEventState): void {
    noop();
  }

  onContainerDblClick(e: PointerEventState): void {
    noop();
  }

  onContainerTripleClick(e: PointerEventState) {
    noop();
  }

  onContainerPointerDown(e: PointerEventState): void {
    this._startPoint = this._surface.viewport.toModelCoord(e.x, e.y);
    this._source = this._edgeless.connector.searchConnection(this._startPoint);
  }

  onContainerDragStart(e: PointerEventState) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;
    assertExists(this._source);
    assertExists(this._startPoint);
    this._page.captureSync();
    const { mode, color } = this.tool;
    const { _surface } = this;
    const id = _surface.addElement('connector', {
      stroke: color,
      mode,
      controllers: [],
      strokeWidth: 2,
      strokeStyle: StrokeStyle.Solid,
      source: this._source,
      target: { position: this._startPoint },
    });
    this._connector = _surface.pickById(id) as unknown as ConnectorElement;
  }

  onContainerDragMove(e: PointerEventState) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;

    assertExists(this._connector);
    const { connector } = this._edgeless;
    const { viewport } = this._surface;
    const point = viewport.toModelCoord(e.x, e.y);
    const target = connector.searchConnection(
      point,
      this._connector.source.id ? [this._connector.source.id] : []
    ) as Connection;
    this._surface.updateElement<'connector'>(this._connector.id, { target });
  }

  onContainerDragEnd(e: PointerEventState) {
    assertExists(this._connector);
    this._edgeless.connector.clear();
    this._page.captureSync();
    this._edgeless.tools.switchToDefaultMode({
      elements: [this._connector.id],
      editing: false,
    });
    this._connector = null;
  }

  onContainerMouseMove(e: PointerEventState) {
    const { connector, surface } = this._edgeless;
    const { viewport } = surface;
    const point = viewport.toModelCoord(e.x, e.y);
    connector.searchConnection(point);
  }

  onContainerMouseOut(e: PointerEventState) {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch() {
    this._edgeless.connector.clear();
  }
}
