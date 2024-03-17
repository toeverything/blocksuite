import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ConnectorIcon,
  CurveLineIcon,
  DiamondIcon,
  EdgelessEraserIcon,
  EdgelessGeneralShapeIcon,
  EdgelessPenIcon,
  ElbowedLineIcon,
  EllipseIcon,
  FrameIcon,
  FrameNavigatorIcon,
  GeneralStyleIcon,
  NoteIcon,
  ScribbledDiamondIcon,
  ScribbledEllipseIcon,
  ScribbledSquareIcon,
  ScribbledStyleIcon,
  ScribbledTriangleIcon,
  SelectIcon,
  SquareIcon,
  StraightLineIcon,
  ToolsIcon,
  TriangleIcon,
  ViewBarIcon,
} from '../../../_common/icons/edgeless.js';
import { isControlledKeyboardEvent } from '../../../_common/utils/event.js';
import { ConnectorMode } from '../../../surface-block/element-model/connector.js';
import { ShapeStyle, ShapeType } from '../../../surface-block/index.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from '../../edgeless/utils/consts.js';
import { EdgelessRootBlockComponent } from '../../index.js';
import { PieMenuBuilder } from './pie-builder.js';
import { setEdgelessToolAction } from './utils.js';

//----------------------------------------------------------
// EDGELESS TOOLS PIE MENU SCHEMA
//----------------------------------------------------------

export const AFFINE_PIE_MENU_ID_EDGELESS_TOOLS = 'affine:pie:edgeless:tools';

const pie = new PieMenuBuilder({
  id: AFFINE_PIE_MENU_ID_EDGELESS_TOOLS,
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
  action: setEdgelessToolAction({
    type: 'brush',
  }),
});

pie.action({
  label: 'Eraser',
  icon: EdgelessEraserIcon,
  action: setEdgelessToolAction({
    type: 'eraser',
  }),
});

pie.action({
  label: 'Frame',
  icon: FrameIcon,
  action: setEdgelessToolAction({
    type: 'frame',
  }),
});

pie.action({
  label: 'Select',
  icon: SelectIcon,
  action: setEdgelessToolAction({
    type: 'default',
  }),
});

pie.action({
  label: 'Note',
  icon: NoteIcon,
  action: setEdgelessToolAction({
    type: 'affine:note',
    childFlavour: DEFAULT_NOTE_CHILD_FLAVOUR,
    childType: DEFAULT_NOTE_CHILD_TYPE,
    tip: DEFAULT_NOTE_TIP,
  }),
});

pie.action({
  label: 'Reset Zoom',
  icon: ViewBarIcon,
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      rootElement.service.zoomToFit();
    }
  },
});

pie.action({
  label: 'Present',
  icon: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      const { type } = rootElement.edgelessTool;
      if (type === 'frameNavigator') {
        return html`
          <span
            style="${styleMap({
              color: '#eb4335',
              fontWeight: 'bold',
            })}"
            >Stop</span
          >
        `;
      }

      return FrameNavigatorIcon;
    }

    return FrameNavigatorIcon;
  },
  action: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      const { type } = rootElement.edgelessTool;
      if (type === 'frameNavigator') {
        rootElement.tools.setEdgelessTool({ type: 'default' });

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.error);
        }

        return;
      }

      rootElement.tools.setEdgelessTool({
        type: 'frameNavigator',
        mode: 'fit',
      });
    }
  },
});
// Connector submenu
pie.beginSubmenu({
  label: 'Connector',
  icon: ({ rootElement }) => {
    if (rootElement instanceof EdgelessRootBlockComponent) {
      const tool = rootElement.edgelessTool;

      if (tool.type === 'connector') {
        switch (tool.mode) {
          case ConnectorMode.Orthogonal:
            return ElbowedLineIcon;
          case ConnectorMode.Curve:
            return CurveLineIcon;
          case ConnectorMode.Straight:
            return StraightLineIcon;
        }
      }
      return ConnectorIcon;
    }

    return ConnectorIcon;
  },
});

pie.action({
  label: 'Straight',
  icon: StraightLineIcon,
  action: setEdgelessToolAction({
    type: 'connector',
    mode: ConnectorMode.Straight,
  }),
});

pie.action({
  label: 'Curved',
  icon: CurveLineIcon,
  action: setEdgelessToolAction({
    type: 'connector',
    mode: ConnectorMode.Curve,
  }),
});

pie.action({
  label: 'Elbowed',
  icon: ElbowedLineIcon,
  action: setEdgelessToolAction({
    type: 'connector',
    mode: ConnectorMode.Orthogonal,
  }),
});
pie.endSubmenu();

// Shapes Submenu
pie.beginSubmenu({
  label: 'Shapes',
  icon: EdgelessGeneralShapeIcon,
});

const shapes = [
  {
    type: ShapeType.Rect,
    label: 'Rect',
    icon: (style: ShapeStyle) =>
      style === ShapeStyle.General ? SquareIcon : ScribbledSquareIcon,
  },
  {
    type: ShapeType.Ellipse,
    label: 'Ellipse',
    icon: (style: ShapeStyle) =>
      style === ShapeStyle.General ? EllipseIcon : ScribbledEllipseIcon,
  },
  {
    type: ShapeType.Triangle,
    label: 'Triangle',
    icon: (style: ShapeStyle) =>
      style === ShapeStyle.General ? TriangleIcon : ScribbledTriangleIcon,
  },
  {
    type: ShapeType.Diamond,
    label: 'Diamond',
    icon: (style: ShapeStyle) =>
      style === ShapeStyle.General ? DiamondIcon : ScribbledDiamondIcon,
  },
];

shapes.forEach(shape => {
  pie.action({
    label: shape.label,
    icon: ({ rootElement }) => {
      const attributes = rootElement.service.editSession.getLastProps('shape');
      return shape.icon(attributes.shapeStyle);
    },

    action: setEdgelessToolAction({
      type: 'shape',
      shapeType: shape.type,
    }),
  });
});

pie.action({
  label: 'Toggle Style',
  icon: ({ rootElement }) => {
    const { shapeStyle } =
      rootElement.service.editSession.getLastProps('shape');
    return shapeStyle === ShapeStyle.General
      ? ScribbledStyleIcon
      : GeneralStyleIcon;
  },
  action: ({ rootElement }) => {
    const { shapeStyle } =
      rootElement.service.editSession.getLastProps('shape');
    const toggleType =
      shapeStyle === ShapeStyle.General
        ? ShapeStyle.Scribbled
        : ShapeStyle.General;

    rootElement.service.editSession.record('shape', {
      shapeStyle: toggleType,
    });
  },
});
pie.endSubmenu();

export const edgelessToolsPieSchema = pie.build();
