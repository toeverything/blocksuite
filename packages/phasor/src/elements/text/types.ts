import type { SerializedXYWH } from '../../utils/xywh.js';

export interface IText {
  id: string;
  index: string;
  type: 'text';
  xywh: SerializedXYWH;
  seed: number;

  text: string;
  color: string;
  fontSize: number;
  fontFamily: string;
  textAlign: CanvasTextAlign;
  lineHeight: number;

  containerId?: string;
}
