import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ConnectorCWithArrowIcon,
  ConnectorIcon,
  ConnectorLWithArrowIcon,
  ConnectorXWithArrowIcon,
  DiamondIcon,
  EdgelessEraserLightIcon,
  EdgelessGeneralShapeIcon,
  EdgelessPenLightIcon,
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
  updateShapeOverlay,
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

    return ev.key === 'q' && !isEditing;
  },
});

pie.expandableCommand({
  label: 'Pen',
  icon: EdgelessPenLightIcon,
  action: setEdgelessToolAction({ type: 'brush' }),
  submenus: pie => {
    pie.colorPicker({
      label: 'Pen Color',
      active: getActiveConnectorStrokeColor,
      onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
        rootElement.service.editPropsStore.recordLastProps('brush', {
          color: color as LastProps['brush']['color'],
        });
      },
      colors: LINE_COLORS.map(color => ({ color })),
    });
  },
});

pie.command({
  label: 'Eraser',
  icon: EdgelessEraserLightIcon,
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
          return ConnectorLWithArrowIcon;
        case ConnectorMode.Curve:
          return ConnectorCWithArrowIcon;
        case ConnectorMode.Straight:
          return ConnectorXWithArrowIcon;
      }
    }
    return ConnectorIcon;
  },
});

pie.command({
  label: 'Curved',
  icon: ConnectorCWithArrowIcon,
  action: setEdgelessToolAction({
    type: 'connector',
    mode: ConnectorMode.Curve,
  }),
});

pie.command({
  label: 'Elbowed',
  icon: ConnectorXWithArrowIcon,
  action: setEdgelessToolAction({
    type: 'connector',
    mode: ConnectorMode.Orthogonal,
  }),
});

pie.command({
  label: 'Straight',
  icon: ConnectorLWithArrowIcon,
  action: setEdgelessToolAction({
    type: 'connector',
    mode: ConnectorMode.Straight,
  }),
});

pie.colorPicker({
  label: 'Line Color',
  active: getActiveConnectorStrokeColor,
  onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
    rootElement.service.editPropsStore.recordLastProps('connector', {
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
      const attributes =
        rootElement.service.editPropsStore.getLastProps('shape');
      return shape.icon(attributes.shapeStyle);
    },

    action: ({ rootElement }) => {
      rootElement.service.tool.setEdgelessTool({
        type: 'shape',
        shapeType: shape.type,
      });
      rootElement.service.editPropsStore.recordLastProps('shape', {
        shapeType: shape.type,
      });
      updateShapeOverlay(rootElement);
    },
  });
});

pie.command({
  label: 'Toggle Style',
  icon: ({ rootElement }) => {
    const { shapeStyle } =
      rootElement.service.editPropsStore.getLastProps('shape');
    return shapeStyle === ShapeStyle.General
      ? ScribbledStyleIcon
      : GeneralStyleIcon;
  },

  action: ({ rootElement }) => {
    const { shapeStyle } =
      rootElement.service.editPropsStore.getLastProps('shape');
    const toggleType =
      shapeStyle === ShapeStyle.General
        ? ShapeStyle.Scribbled
        : ShapeStyle.General;

    rootElement.service.editPropsStore.recordLastProps('shape', {
      shapeStyle: toggleType,
    });

    updateShapeOverlay(rootElement);
  },
});

pie.colorPicker({
  label: 'Fill',
  active: getActiveShapeColor('fill'),
  onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
    rootElement.service.editPropsStore.recordLastProps('shape', {
      fillColor: color as LastProps['shape']['fillColor'],
    });
    updateShapeOverlay(rootElement);
  },
  colors: FILL_COLORS.map(color => ({ color })),
});

pie.colorPicker({
  label: 'Stroke',
  hollow: true,
  active: getActiveShapeColor('stroke'),
  onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
    rootElement.service.editPropsStore.recordLastProps('shape', {
      strokeColor: color as LastProps['shape']['strokeColor'],
    });
    updateShapeOverlay(rootElement);
  },
  colors: STROKE_COLORS.map(color => ({ color, name: 'Color' })),
});

pie.endSubmenu();

export const edgelessToolsPieSchema = pie.build();
