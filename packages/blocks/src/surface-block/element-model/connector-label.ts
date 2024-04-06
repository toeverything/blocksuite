import { type SerializedXYWH } from '../utils/xywh.js';
import { local, yfield } from './decorators.js';
import { TextElementModel } from './text.js';

export class ConnectorLabelElementModel extends TextElementModel {
  override get type() {
    return 'connector-label';
  }

  override get connectable() {
    return false;
  }

  override get resizeable() {
    return false;
  }

  @yfield()
  override xywh: SerializedXYWH = '[0,0,65,19]';

  @yfield()
  override hasMaxWidth = true;

  // Connector's ID
  @yfield()
  connector!: string;

  // Along the path, 0.5 by default.
  // `t`: [0, 1];
  @yfield(0.5)
  t!: number;

  // Background color when `actived`.
  @local()
  fillColor: string = 'rgba(22,255,208,.1)';

  // if `actived` is true, sets the background.
  @local()
  actived!: boolean;
}
