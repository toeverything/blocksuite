import { type SerializedXYWH } from '../utils/xywh.js';
import { derive, local, yfield } from './decorators.js';
import { TextElementModel, type TextElementProps } from './text.js';

export type ConnectorLabelElementProps = TextElementProps & {
  connector: string;
  time: number;
};

export class ConnectorLabelElementModel extends TextElementModel<ConnectorLabelElementProps> {
  static MAX_WIDTH = 280;

  override get type() {
    return 'connector-label';
  }

  override get connectable() {
    return false;
  }

  override get resizeable() {
    return false;
  }

  private _connectorId!: string;

  get connectorId() {
    return this._connectorId;
  }

  set connectorId(id: string) {
    this._connectorId = id;
  }

  @yfield()
  override xywh: SerializedXYWH = '[0,0,65,19]';

  @yfield()
  override hasMaxWidth = true;

  // Connector's ID
  @derive((connectorId: string, _: ConnectorLabelElementModel) => {
    return {
      connectorId,
    };
  })
  @yfield()
  connector!: string;

  // Along the path, 0.5 by default.
  // `time`: [0, 1];
  @yfield(0.5)
  time!: number;

  // Background color when `actived`.
  @local()
  fillColor: string = 'rgba(22,255,208,.1)';

  // if `actived` is true, sets the background.
  @local()
  actived!: boolean;
}
