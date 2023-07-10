import { HOTKEYS, SHORT_KEY } from '@blocksuite/global/config';
import { ConnectorMode } from '@blocksuite/phasor';

import { activeEditorManager } from '../../../__internal__/utils/active-editor-manager.js';
import {
  hotkey,
  HOTKEY_SCOPE_TYPE,
} from '../../../__internal__/utils/hotkey.js';
import type { EdgelessTool } from '../../../__internal__/utils/types.js';
import { BrushSize } from '../../../__internal__/utils/types.js';
import { DEFAULT_NOTE_COLOR } from '../../../note-block/note-model.js';
import {
  bindCommonHotkey,
  deleteModelsByRange,
  handleDown,
  handleUp,
} from '../../utils/index.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '../components/component-toolbar/change-shape-button.js';
import { GET_DEFAULT_LINE_COLOR } from '../components/panel/color-panel.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from './consts.js';
import { isTopLevelBlock } from './query.js';

function setEdgelessTool(
  edgeless: EdgelessPageBlockComponent,
  edgelessTool: EdgelessTool,
  ignoreActiveState = false
) {
  // when editing, should not update mouse mode by shortcut
  if (!ignoreActiveState && edgeless.selection.isActive) {
    return;
  }
  edgeless.selection.setEdgelessTool(edgelessTool);
}

function bindSpace(edgeless: EdgelessPageBlockComponent) {
  // When user enters pan mode by pressing space,
  // we should revert to the last mouse mode once user releases the key.
  let shouldRevertMode = false;
  let lastMode: EdgelessTool | null = null;
  hotkey.addListener(
    HOTKEYS.SPACE,
    (event: KeyboardEvent) => {
      const { edgelessTool: edgelessTool, state } = edgeless.selection;
      if (event.type === 'keydown') {
        if (edgelessTool.type === 'pan') {
          return;
        }

        // when user is editing, shouldn't enter pan mode
        if (edgelessTool.type === 'default' && state.active) {
          return;
        }

        shouldRevertMode = true;
        lastMode = edgelessTool;
        setEdgelessTool(edgeless, { type: 'pan', panning: false });
        return;
      }
      if (event.type === 'keyup') {
        if (edgelessTool.type === 'pan' && shouldRevertMode && lastMode) {
          setEdgelessTool(edgeless, lastMode);
        }
        shouldRevertMode = false;
      }
    },
    {
      keydown: true,
      keyup: true,
    }
  );
}

function bindDelete(edgeless: EdgelessPageBlockComponent) {
  function backspace(e: KeyboardEvent) {
    // TODO: add `selection-state` to handle `block`, `native`, `note`, `shape`, etc.
    deleteModelsByRange(edgeless.page);

    if (edgeless.selection.isActive) return;

    const { selected } = edgeless.selection.state;
    selected.forEach(element => {
      if (isTopLevelBlock(element)) {
        const children = edgeless.page.root?.children ?? [];
        // FIXME: should always keep at least 1 note
        if (children.length > 1) {
          edgeless.page.deleteBlock(element);
        }
      } else {
        edgeless.connector.detachConnectors([element]);
        edgeless.surface.removeElement(element.id);
      }
    });
    edgeless.selection.clear();
    edgeless.slots.selectionUpdated.emit(edgeless.selection.state);
  }
  hotkey.addListener(HOTKEYS.BACKSPACE, backspace);
  hotkey.addListener(HOTKEYS.DELETE, backspace);
}

function bindShift(
  edgeless: EdgelessPageBlockComponent,
  key = 'shift',
  pressed = false
) {
  hotkey.addListener(
    HOTKEYS.ANY_KEY,
    e => {
      if (e.key.toLowerCase() === key && pressed !== e.shiftKey) {
        pressed = e.shiftKey;
        edgeless.slots.pressShiftKeyUpdated.emit(pressed);
      }
    },
    {
      keydown: true,
      keyup: true,
    }
  );
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

    hotkey.addListener('v', () =>
      setEdgelessTool(edgeless, { type: 'default' })
    );
    hotkey.addListener('t', () => setEdgelessTool(edgeless, { type: 'text' }));
    hotkey.addListener('l', () =>
      setEdgelessTool(edgeless, {
        type: 'connector',
        mode: ConnectorMode.Straight,
        color: GET_DEFAULT_LINE_COLOR(),
      })
    );
    hotkey.addListener('x', () =>
      setEdgelessTool(edgeless, {
        type: 'connector',
        mode: ConnectorMode.Orthogonal,
        color: GET_DEFAULT_LINE_COLOR(),
      })
    );
    hotkey.addListener('h', () =>
      setEdgelessTool(edgeless, { type: 'pan', panning: false })
    );
    hotkey.addListener('n', () =>
      setEdgelessTool(edgeless, {
        type: 'note',
        background: DEFAULT_NOTE_COLOR,
        childFlavour: DEFAULT_NOTE_CHILD_FLAVOUR,
        childType: DEFAULT_NOTE_CHILD_TYPE,
        tip: DEFAULT_NOTE_TIP,
      })
    );
    hotkey.addListener('p', () =>
      setEdgelessTool(edgeless, {
        type: 'brush',
        color: GET_DEFAULT_LINE_COLOR(),
        lineWidth: BrushSize.Thin,
      })
    );
    hotkey.addListener('e', () =>
      setEdgelessTool(edgeless, { type: 'eraser' })
    );
    hotkey.addListener('s', () =>
      setEdgelessTool(edgeless, {
        type: 'shape',
        shape: 'rect',
        fillColor: DEFAULT_SHAPE_FILL_COLOR,
        strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
      })
    );

    // issue #1814
    hotkey.addListener(HOTKEYS.ESC, () => {
      edgeless.slots.selectionUpdated.emit({ selected: [], active: false });
      setEdgelessTool(edgeless, { type: 'default' }, true);
    });

    hotkey.addListener(HOTKEYS.SELECT_ALL, keyboardEvent => {
      if (edgeless.selection.isActive) return;

      keyboardEvent.preventDefault();
      edgeless.slots.selectionUpdated.emit({
        selected: [...edgeless.notes, ...edgeless.surface.getElements()],
        active: false,
      });
    });

    hotkey.addListener(`${SHORT_KEY}+1`, e => {
      e.preventDefault();
      edgeless.slots.zoomUpdated.emit('fit');
    });
    hotkey.addListener(`${SHORT_KEY}+-`, e => {
      e.preventDefault();
      edgeless.slots.zoomUpdated.emit('out');
    });
    hotkey.addListener(`${SHORT_KEY}+0`, e => {
      e.preventDefault();
      edgeless.slots.zoomUpdated.emit('reset');
    });
    hotkey.addListener(`${SHORT_KEY}+=`, e => {
      e.preventDefault();
      edgeless.slots.zoomUpdated.emit('in');
    });

    bindSpace(edgeless);
    bindDelete(edgeless);
    bindShift(edgeless);
    bindCommonHotkey(edgeless.page);
  });
  return () => {
    hotkey.deleteScope(scope);
    activeDispose.dispose();
  };
}
