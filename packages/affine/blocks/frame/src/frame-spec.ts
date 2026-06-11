import { FrameBlockSchema } from '@labre/affine-model';
import { BlockViewExtension } from '@labre/std';
import type { ExtensionType } from '@labre/store';
import { literal } from 'lit/static-html.js';

import { FrameBlockInteraction } from './frame-block';
import { EdgelessFrameManager, FrameOverlay } from './frame-manager';

const flavour = FrameBlockSchema.model.flavour;

export const FrameBlockSpec: ExtensionType[] = [
  BlockViewExtension(flavour, literal`affine-frame`),
  FrameOverlay,
  EdgelessFrameManager,
  FrameBlockInteraction,
];
