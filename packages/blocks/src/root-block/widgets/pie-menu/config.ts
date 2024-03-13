import {
  ConnectorIcon,
  EdgelessEraserIcon,
  EdgelessPenIcon,
  EllipseIcon,
  FrameIcon,
  HandIcon,
  SelectIcon,
  SquareIcon,
  ToolsIcon,
  TriangleIcon,
} from '../../../_common/icons/edgeless.js';
import { isControlledKeyboardEvent } from '../../../_common/utils/event.js';
import { ConnectorMode } from '../../../surface-block/element-model/connector.js';
import { ShapeType } from '../../../surface-block/index.js';
import { EdgelessRootBlockComponent } from '../../index.js';
import { PieMenuBuilder } from './pie-builder.js';
import { PieManager } from './pie-manager.js';

//----------------------------------------------------------
// EDGELESS TOOLS PIE MENU SCHEMA
//----------------------------------------------------------
const pie = new PieMenuBuilder({
  id: 'affine:pie:edgeless:tools',
  label: 'Tools',
  icon: ToolsIcon,
  scope: { edgeless: true },
  trigger: ({ keyEvent: ev, rootElement }) => {
    if (isControlledKeyboardEvent(ev)) return false;
    const isEditing = (rootElement as EdgelessRootBlockComponent).service
      .selection.editing;

    return ev.key === 'q' && !isEditing;
  },
});

pie.action({
  label: 'Pen',
  icon: EdgelessPenIcon,
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      rootElement.service.tool.setEdgelessTool({ type: 'brush' });
    }
  },
});

pie.action({
  label: 'Eraser',
  icon: EdgelessEraserIcon,
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      rootElement.service.tool.setEdgelessTool({ type: 'eraser' });
    }
  },
});

pie.action({
  label: 'Frame',
  icon: FrameIcon,
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      rootElement.service.tool.setEdgelessTool({ type: 'frame' });
    }
  },
});

pie.action({
  label: 'Connector',
  icon: ConnectorIcon,
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      rootElement.service.tool.setEdgelessTool({
        type: 'connector',
        mode: ConnectorMode.Orthogonal,
      });
    }
  },
});

// Shapes Submenu
pie.beginSubmenu({ label: 'Shapes', icon: SquareIcon });
pie.action({
  label: 'Rect',
  icon: SquareIcon,
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      rootElement.service.tool.setEdgelessTool({
        type: 'shape',
        shapeType: ShapeType.Rect,
      });
    }
  },
});

pie.action({
  label: 'Ellipse',
  icon: EllipseIcon,
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      rootElement.service.tool.setEdgelessTool({
        type: 'shape',
        shapeType: ShapeType.Ellipse,
      });
    }
  },
});

pie.action({
  label: 'Triangle',
  icon: TriangleIcon,
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      rootElement.service.tool.setEdgelessTool({
        type: 'shape',
        shapeType: ShapeType.Triangle,
      });
    }
  },
});

pie.endSubmenu();

// Hand and Select tool submenu
pie.beginSubmenu({ label: 'Default', icon: SelectIcon });
pie.action({
  label: 'Select',
  icon: SelectIcon,
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      rootElement.service.tool.setEdgelessTool({ type: 'default' });
    }
  },
});

pie.action({
  label: 'Hand',
  icon: HandIcon,
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      rootElement.service.tool.setEdgelessTool({
        type: 'pan',
        panning: false,
      });
    }
  },
});
pie.endSubmenu();

PieManager.add(pie.build());
