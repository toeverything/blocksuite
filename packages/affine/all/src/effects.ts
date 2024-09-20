import { effects as blocksEffects } from '@blocksuite/blocks/effects';
import { effects as presetsEffects } from '@blocksuite/presets/effects';

export function effects() {
  blocksEffects();
  presetsEffects();
}
