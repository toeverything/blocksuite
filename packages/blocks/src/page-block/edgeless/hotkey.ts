import { FRAME_BACKGROUND_COLORS, HOTKEYS } from '@blocksuite/global/config';

import { activeEditorManager } from '../../__internal__/utils/active-editor-manager.js';
import { hotkey, HOTKEY_SCOPE_TYPE } from '../../__internal__/utils/hotkey.js';
import type {
  MouseMode,
  TopLevelBlockModel,
} from '../../__internal__/utils/types.js';
import { BrushSize } from '../../__internal__/utils/types.js';
import {
  bindCommonHotkey,
  deleteModelsByRange,
  handleDown,
  handleUp,
} from '../utils/index.js';
import { DEFAULT_SELECTED_COLOR } from './components/color-panel.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
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

        return;
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

function bindDelete(edgeless: EdgelessPageBlockComponent) {
  function backspace(e: KeyboardEvent) {
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
  }
  hotkey.addListener(HOTKEYS.BACKSPACE, backspace);
  hotkey.addListener(HOTKEYS.DELETE, backspace);
}

export function bindEdgelessHotkeys(edgeless: EdgelessPageBlockComponent) {
  const scope = hotkey.newScope(HOTKEY_SCOPE_TYPE.AFFINE_EDGELESS);
  if (activeEditorManager.isActive(edgeless)) {
    hotkey.setScope(scope);
  }
  const activeDispose = activeEditorManager.activeSlot.on(() => {
    if (activeEditorManager.isActive(edgeless)) {
      hotkey.setScope(scope);
    }
  });
  hotkey.withScope(scope, () => {
    hotkey.addListener(HOTKEYS.UP, e =>
      handleUp(e, edgeless.page, { zoom: edgeless.surface.viewport.zoom })
    );
    hotkey.addListener(HOTKEYS.DOWN, e =>
      handleDown(e, edgeless.page, { zoom: edgeless.surface.viewport.zoom })
    );

    hotkey.addListener('v', () => setMouseMode(edgeless, { type: 'default' }));
    hotkey.addListener('t', () =>
      setMouseMode(edgeless, {
        type: 'text',
      })
    );
    hotkey.addListener('h', () =>
      setMouseMode(edgeless, { type: 'pan', panning: false })
    );
    hotkey.addListener('n', () =>
      setMouseMode(edgeless, {
        type: 'note',
        background: FRAME_BACKGROUND_COLORS[0],
      })
    );
    hotkey.addListener('p', () =>
      setMouseMode(edgeless, {
        type: 'brush',
        color: DEFAULT_SELECTED_COLOR,
        lineWidth: BrushSize.Thin,
      })
    );
    hotkey.addListener('s', () =>
      setMouseMode(edgeless, {
        type: 'shape',
        shape: 'rect',
        fillColor: DEFAULT_SHAPE_FILL_COLOR,
        strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
      })
    );

    // issue #1814
    hotkey.addListener(HOTKEYS.ESC, () => {
      edgeless.slots.selectionUpdated.emit({ selected: [], active: false });
      setMouseMode(edgeless, { type: 'default' }, true);
    });

    hotkey.addListener(HOTKEYS.SELECT_ALL, keyboardEvent => {
      keyboardEvent.preventDefault();
      const pageModels = (edgeless.page.root?.children.filter(
        child => child.flavour === 'affine:frame'
      ) ?? []) as TopLevelBlockModel[];
      edgeless.slots.selectionUpdated.emit({
        selected: [...pageModels, ...edgeless.surface.getElementList()],
        active: false,
      });
    });

    bindSpace(edgeless);
    bindDelete(edgeless);
    bindCommonHotkey(edgeless.page);
  });
  return () => {
    hotkey.deleteScope(scope);
    activeDispose.dispose();
  };
}
