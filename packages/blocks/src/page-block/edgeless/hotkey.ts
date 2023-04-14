import { HOTKEYS } from '@blocksuite/global/config';

import { hotkey, HOTKEY_SCOPE } from '../../__internal__/utils/hotkey.js';
import type { MouseMode } from '../../__internal__/utils/types.js';
import { BrushSize } from '../../__internal__/utils/types.js';
import {
  bindCommonHotkey,
  deleteModelsByRange,
  handleDown,
  handleUp,
} from '../utils/index.js';
import { FRAME_BACKGROUND_COLORS } from './components/component-toolbar/change-frame-button.js';
import {
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_COLOR,
} from './components/component-toolbar/change-shape-button.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import { isTopLevelBlock } from './utils.js';

function setMouseMode(
  edgeless: EdgelessPageBlockComponent,
  mouseMode: MouseMode,
  ignoreActiveState = false
) {
  // when editing, should not update mouse mode by shortcut
  if (!ignoreActiveState && edgeless.getSelection().isActive) {
    return;
  }
  edgeless.slots.mouseModeUpdated.emit(mouseMode);
}

function bindSpace(edgeless: EdgelessPageBlockComponent) {
  // When user enters pan mode by pressing space,
  // we should revert to the last mouse mode once user releases the key.
  let shouldRevertMode = false;
  let lastMode: MouseMode | null = null;
  hotkey.addListener(
    HOTKEYS.SPACE,
    (event: KeyboardEvent) => {
      const { mouseMode, blockSelectionState } = edgeless.getSelection();
      if (event.type === 'keydown') {
        if (mouseMode.type === 'pan') {
          return;
        }

        // when user is editing, shouldn't enter pan mode
        if (mouseMode.type === 'default' && blockSelectionState.active) {
          return;
        }

        edgeless.mouseMode = { type: 'pan', panning: false };
        shouldRevertMode = true;
        lastMode = mouseMode;
      }
      if (event.type === 'keyup') {
        if (mouseMode.type === 'pan' && shouldRevertMode && lastMode) {
          setMouseMode(edgeless, lastMode);
        }
        shouldRevertMode = false;
      }
    },
    { keyup: true }
  );
}

export function bindEdgelessHotkeys(edgeless: EdgelessPageBlockComponent) {
  hotkey.setScope(HOTKEY_SCOPE.AFFINE_EDGELESS);

  hotkey.addListener(HOTKEYS.BACKSPACE, (e: KeyboardEvent) => {
    // TODO: add `selection-state` to handle `block`, `native`, `frame`, `shape`, etc.
    deleteModelsByRange(edgeless.page);

    const { selected } = edgeless.getSelection().blockSelectionState;
    selected.forEach(element => {
      if (isTopLevelBlock(element)) {
        const children = edgeless.page.root?.children ?? [];
        // FIXME: should always keep at least 1 frame
        if (children.length > 1) {
          edgeless.page.deleteBlock(element);
        }
      } else {
        edgeless.surface.removeElement(element.id);
      }
    });
    edgeless.getSelection().currentController.clearSelection();
    edgeless.slots.selectionUpdated.emit(
      edgeless.getSelection().blockSelectionState
    );
  });
  hotkey.addListener(HOTKEYS.UP, e => handleUp(e, edgeless.page));
  hotkey.addListener(HOTKEYS.DOWN, e => handleDown(e, edgeless.page));

  hotkey.addListener('v', () => setMouseMode(edgeless, { type: 'default' }));
  hotkey.addListener('h', () =>
    setMouseMode(edgeless, { type: 'pan', panning: false })
  );
  hotkey.addListener('t', () =>
    setMouseMode(edgeless, {
      type: 'text',
      background: FRAME_BACKGROUND_COLORS[0],
    })
  );
  hotkey.addListener('p', () =>
    setMouseMode(edgeless, {
      type: 'brush',
      color: '#000',
      lineWidth: BrushSize.Thin,
    })
  );
  hotkey.addListener('s', () =>
    setMouseMode(edgeless, {
      type: 'shape',
      shape: 'rect',
      fillColor: DEFAULT_FILL_COLOR,
      strokeColor: DEFAULT_STROKE_COLOR,
    })
  );

  // issue #1814
  hotkey.addListener('esc', () => {
    edgeless.slots.selectionUpdated.emit({ selected: [], active: false });
    setMouseMode(edgeless, { type: 'default' }, true);
  });

  bindSpace(edgeless);
  bindCommonHotkey(edgeless.page);

  return () => {
    hotkey.deleteScope(HOTKEY_SCOPE.AFFINE_EDGELESS);
  };
}
