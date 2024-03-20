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
import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { isControlledKeyboardEvent } from '../../../_common/utils/event.js';
import { ConnectorMode } from '../../../surface-block/element-model/connector.js';
import {
  FILL_COLORS,
  STROKE_COLORS,
} from '../../../surface-block/elements/shape/consts.js';
import { ShapeStyle, ShapeType } from '../../../surface-block/index.js';
import type { LastProps } from '../../../surface-block/managers/edit-session.js';
import { LINE_COLORS } from '../../edgeless/components/panel/color-panel.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from '../../edgeless/utils/consts.js';
import type { PieMenuContext } from './base.js';
import { PieMenuBuilder } from './pie-builder.js';
import {
  getActiveConnectorStrokeColor,
  getActiveShapeColor,
  setEdgelessToolAction,
} from './utils.js';

//----------------------------------------------------------
// EDGELESS TOOLS PIE MENU SCHEMA
//----------------------------------------------------------

export const AFFINE_PIE_MENU_ID_EDGELESS_TOOLS = 'affine:pie:edgeless:tools';

const pie = new PieMenuBuilder({
  id: AFFINE_PIE_MENU_ID_EDGELESS_TOOLS,
  label: 'Tools',
  icon: ToolsIcon,
  trigger: ({ keyEvent: ev, rootElement }) => {
    if (isControlledKeyboardEvent(ev)) return false;
    const isEditing = rootElement.service.selection.editing;

    // Todo: make this trigger user configurable .
    return ev.key === 'q' && !isEditing;
  },
});

pie.command({
  label: 'Pen',
  icon: EdgelessPenIcon,
  action: setEdgelessToolAction({
    type: 'brush',
  }),
});

pie.command({
  label: 'Eraser',
  icon: EdgelessEraserIcon,
  action: setEdgelessToolAction({
    type: 'eraser',
  }),
});

pie.command({
  label: 'Frame',
  icon: FrameIcon,
  action: setEdgelessToolAction({
    type: 'frame',
  }),
});

pie.command({
  label: 'Select',
  icon: SelectIcon,
  action: setEdgelessToolAction({
    type: 'default',
  }),
});

pie.command({
  label: 'Note',
  icon: NoteIcon,
  action: setEdgelessToolAction({
    type: 'affine:note',
    childFlavour: DEFAULT_NOTE_CHILD_FLAVOUR,
    childType: DEFAULT_NOTE_CHILD_TYPE,
    tip: DEFAULT_NOTE_TIP,
  }),
});

pie.command({
  label: 'Reset Zoom',
  icon: ViewBarIcon,
  action: ({ rootElement }) => {
    rootElement.service.zoomToFit();
  },
});

pie.command({
  label: 'Present',
  icon: ({ rootElement }) => {
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

    return FrameNavigatorIcon;
  },
  action: ({ rootElement }) => {
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
  },
});
// Connector submenu
pie.beginSubmenu({
  label: 'Connector',
  icon: ({ rootElement }) => {
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
  },
});

pie.command({
  label: 'Straight',
  icon: StraightLineIcon,
  action: setEdgelessToolAction({
    type: 'connector',
    mode: ConnectorMode.Straight,
  }),
});

pie.command({
  label: 'Curved',
  icon: CurveLineIcon,
  action: setEdgelessToolAction({
    type: 'connector',
    mode: ConnectorMode.Curve,
  }),
});

pie.command({
  label: 'Elbowed',
  icon: ElbowedLineIcon,
  action: setEdgelessToolAction({
    type: 'connector',
    mode: ConnectorMode.Orthogonal,
  }),
});

pie.colorPicker({
  label: 'Line Color',
  active: getActiveConnectorStrokeColor,
  onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
    rootElement.service.editSession.record('connector', {
      stroke: color as LastProps['connector']['stroke'],
    });
  },
  colors: LINE_COLORS.map(color => ({ color })),
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
  pie.command({
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

pie.command({
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

pie.colorPicker({
  label: 'Fill',
  active: getActiveShapeColor('fill'),
  onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
    rootElement.service.editSession.record('shape', {
      fillColor: color as LastProps['shape']['fillColor'],
    });
  },
  colors: FILL_COLORS.map(color => ({ color })),
});

pie.colorPicker({
  label: 'Stroke',
  hollow: true,
  active: getActiveShapeColor('stroke'),
  onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
    rootElement.service.editSession.record('shape', {
      strokeColor: color as LastProps['shape']['strokeColor'],
    });
  },
  colors: STROKE_COLORS.map(color => ({ color, name: 'Color' })),
});

pie.endSubmenu();

export const edgelessToolsPieSchema = pie.build();
