import { isControlledKeyboardEvent } from '../../../_common/utils/event.js';
import type { EdgelessRootBlockComponent } from '../../index.js';
import { PieMenuBuilder } from './pie-builder.js';
import { PieManager } from './pie-manager.js';

//----------------------------------------------------------
// EDGELESS TOOLS PIE MENU SCHEMA
//----------------------------------------------------------
const pie = new PieMenuBuilder({
  id: 'affine:pie:edgeless:tools',
  label: 'Tools',
  scope: { edgeless: true },
  trigger: ({ keyEvent: ev, rootElement }) => {
    if (isControlledKeyboardEvent(ev)) return false;
    const isEditing = (rootElement as EdgelessRootBlockComponent).service
      .selection.editing;

    return ev.key === 'q' && !isEditing;
  },
});

pie.action({
  label: 'pen',

  action: () => {
    console.log('Pen');
  },
});

pie.action({
  label: 'eraser',

  action: () => {
    console.log('Eraser');
  },
});

pie.action({
  label: 'frame',

  action: () => {
    console.log('Frame');
  },
});

pie.action({
  label: 'connector',

  action: () => {
    console.log('Connector');
  },
});

pie.beginSubmenu({ label: 'Shapes' });
pie.action({
  label: 'Rectangle',

  action: () => {
    console.log('rectangle');
  },
});

pie.action({
  label: 'Ellipse',

  action: () => {
    console.log('ellipse');
  },
});

pie.action({
  label: 'Triangle',

  action: () => {
    console.log('Triangle');
  },
});
pie.endSubmenu();

PieManager.add(pie.build());
