import { z } from 'zod';

export enum FrameBackgroundColor {
  Blue = '--affine-tag-blue',
  Gray = '--affine-tag-gray',
  Green = '--affine-tag-green',
  Orange = '--affine-tag-orange',
  Pink = '--affine-tag-pink',
  Purple = '--affine-tag-purple',
  Red = '--affine-tag-red',
  Teal = '--affine-tag-teal',
  Yellow = '--affine-tag-yellow',
}

export const FRAME_BACKGROUND_COLORS = [
  FrameBackgroundColor.Gray,
  FrameBackgroundColor.Red,
  FrameBackgroundColor.Orange,
  FrameBackgroundColor.Yellow,
  FrameBackgroundColor.Green,
  FrameBackgroundColor.Teal,
  FrameBackgroundColor.Blue,
  FrameBackgroundColor.Purple,
  FrameBackgroundColor.Pink,
];

export const FrameBackgroundColorsSchema = z.nativeEnum(FrameBackgroundColor);
