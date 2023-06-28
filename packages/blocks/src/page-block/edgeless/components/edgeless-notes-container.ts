import { EDGELESS_BLOCK_CHILD_PADDING } from '@blocksuite/global/config';
import { deserializeXYWH } from '@blocksuite/phasor';
import type { TemplateResult } from 'lit';
import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { TopLevelBlockModel } from '../../../__internal__/utils/types.js';
import {
  DEFAULT_NOTE_COLOR,
  type NoteBlockModel,
} from '../../../note-block/note-model.js';

function NoteMask() {
  const style = {
    position: 'absolute',
    top: '0',
    left: '0',
    bottom: '0',
    right: '0',
    zIndex: '1',
  };
  return html` <div class="affine-note-mask" style=${styleMap(style)}></div> `;
}

function EdgelessChildNote(
  index: number,
  model: NoteBlockModel,
  active: boolean,
  renderer: (model: TopLevelBlockModel) => TemplateResult
) {
  const { xywh, background } = model;
  const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
  const isHiddenNote = model.hidden;

  const style = {
    position: 'absolute',
    zIndex: `${index}`,
    width: modelW + 'px',
    height: modelH + 'px',
    padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
    border: `2px ${isHiddenNote ? 'dashed' : 'solid'} var(--affine-black-10)`,
    borderRadius: '8px',
    boxSizing: 'border-box',
    background: isHiddenNote
      ? 'transparent'
      : `var(${background ?? DEFAULT_NOTE_COLOR})`,
    boxShadow: 'var(--affine-shadow-3)',
    pointerEvents: 'all',
    overflow: 'hidden',
    transform: `translate(${modelX}px, ${modelY}px)`,
    transformOrigin: '0 0',
  };

  const mask = active ? nothing : NoteMask();

  return html`
    <div class="affine-edgeless-child-note" style=${styleMap(style)}>
      ${renderer(model)} ${mask}
    </div>
  `;
}

export function EdgelessNotesContainer(
  notes: TopLevelBlockModel[],
  active: boolean,
  renderer: (model: TopLevelBlockModel) => TemplateResult
) {
  return html`
    ${repeat(
      notes,
      child => child.id,
      (child, index) => EdgelessChildNote(index, child, active, renderer)
    )}
  `;
}
