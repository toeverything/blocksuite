import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import type { LastProps } from '../../../surface-block/managers/edit-session.js';
import type { PieMenuContext } from './base.js';

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
import { isControlledKeyboardEvent } from '../../../_common/utils/event.js';
import { ConnectorMode } from '../../../surface-block/element-model/connector.js';
import {
  FILL_COLORS,
  STROKE_COLORS,
} from '../../../surface-block/elements/shape/consts.js';
import { ShapeStyle, ShapeType } from '../../../surface-block/index.js';
import { LINE_COLORS } from '../../edgeless/components/panel/color-panel.js';
import {
  DEFAULT_NOTE_CHILD_FLAVOUR,
  DEFAULT_NOTE_CHILD_TYPE,
  DEFAULT_NOTE_TIP,
} from '../../edgeless/utils/consts.js';
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
  icon: ToolsIcon,
  id: AFFINE_PIE_MENU_ID_EDGELESS_TOOLS,
  label: 'Tools',
  trigger: ({ keyEvent: ev, rootElement }) => {
    if (isControlledKeyboardEvent(ev)) return false;
    const isEditing = rootElement.service.selection.editing;

    return ev.key === 'q' && !isEditing;
  },
});

pie.expandableCommand({
  action: setEdgelessToolAction({ type: 'brush' }),
  icon: EdgelessPenLightIcon,
  label: 'Pen',
  submenus: pie => {
    pie.colorPicker({
      active: getActiveConnectorStrokeColor,
      colors: LINE_COLORS.map(color => ({ color })),
      label: 'Pen Color',
      onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
        rootElement.service.editPropsStore.recordLastProps('brush', {
          color: color as LastProps['brush']['color'],
        });
      },
    });
  },
});

pie.command({
  action: setEdgelessToolAction({
    type: 'eraser',
  }),
  icon: EdgelessEraserLightIcon,
  label: 'Eraser',
});

pie.command({
  action: setEdgelessToolAction({
    type: 'frame',
  }),
  icon: FrameIcon,
  label: 'Frame',
});

pie.command({
  action: setEdgelessToolAction({
    type: 'default',
  }),
  icon: SelectIcon,
  label: 'Select',
});

pie.command({
  action: setEdgelessToolAction({
    childFlavour: DEFAULT_NOTE_CHILD_FLAVOUR,
    childType: DEFAULT_NOTE_CHILD_TYPE,
    tip: DEFAULT_NOTE_TIP,
    type: 'affine:note',
  }),
  icon: NoteIcon,
  label: 'Note',
});

pie.command({
  action: ({ rootElement }) => {
    rootElement.service.zoomToFit();
  },
  icon: ViewBarIcon,
  label: 'Reset Zoom',
});

pie.command({
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
      mode: 'fit',
      type: 'frameNavigator',
    });
  },
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
  label: 'Present',
});
// Connector submenu
pie.beginSubmenu({
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
  label: 'Connector',
});

pie.command({
  action: setEdgelessToolAction({
    mode: ConnectorMode.Curve,
    type: 'connector',
  }),
  icon: ConnectorCWithArrowIcon,
  label: 'Curved',
});

pie.command({
  action: setEdgelessToolAction({
    mode: ConnectorMode.Orthogonal,
    type: 'connector',
  }),
  icon: ConnectorXWithArrowIcon,
  label: 'Elbowed',
});

pie.command({
  action: setEdgelessToolAction({
    mode: ConnectorMode.Straight,
    type: 'connector',
  }),
  icon: ConnectorLWithArrowIcon,
  label: 'Straight',
});

pie.colorPicker({
  active: getActiveConnectorStrokeColor,
  colors: LINE_COLORS.map(color => ({ color })),
  label: 'Line Color',
  onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
    rootElement.service.editPropsStore.recordLastProps('connector', {
      stroke: color as LastProps['connector']['stroke'],
    });
  },
});

pie.endSubmenu();

// Shapes Submenu
pie.beginSubmenu({
  icon: EdgelessGeneralShapeIcon,
  label: 'Shapes',
});

const shapes = [
  {
    icon: (style: ShapeStyle) =>
      style === ShapeStyle.General ? SquareIcon : ScribbledSquareIcon,
    label: 'Rect',
    type: ShapeType.Rect,
  },
  {
    icon: (style: ShapeStyle) =>
      style === ShapeStyle.General ? EllipseIcon : ScribbledEllipseIcon,
    label: 'Ellipse',
    type: ShapeType.Ellipse,
  },
  {
    icon: (style: ShapeStyle) =>
      style === ShapeStyle.General ? TriangleIcon : ScribbledTriangleIcon,
    label: 'Triangle',
    type: ShapeType.Triangle,
  },
  {
    icon: (style: ShapeStyle) =>
      style === ShapeStyle.General ? DiamondIcon : ScribbledDiamondIcon,
    label: 'Diamond',
    type: ShapeType.Diamond,
  },
];

shapes.forEach(shape => {
  pie.command({
    action: ({ rootElement }) => {
      rootElement.service.tool.setEdgelessTool({
        shapeType: shape.type,
        type: 'shape',
      });
      rootElement.service.editPropsStore.recordLastProps('shape', {
        shapeType: shape.type,
      });
      updateShapeOverlay(rootElement);
    },
    icon: ({ rootElement }) => {
      const attributes =
        rootElement.service.editPropsStore.getLastProps('shape');
      return shape.icon(attributes.shapeStyle);
    },

    label: shape.label,
  });
});

pie.command({
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
  icon: ({ rootElement }) => {
    const { shapeStyle } =
      rootElement.service.editPropsStore.getLastProps('shape');
    return shapeStyle === ShapeStyle.General
      ? ScribbledStyleIcon
      : GeneralStyleIcon;
  },

  label: 'Toggle Style',
});

pie.colorPicker({
  active: getActiveShapeColor('fill'),
  colors: FILL_COLORS.map(color => ({ color })),
  label: 'Fill',
  onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
    rootElement.service.editPropsStore.recordLastProps('shape', {
      fillColor: color as LastProps['shape']['fillColor'],
    });
    updateShapeOverlay(rootElement);
  },
});

pie.colorPicker({
  active: getActiveShapeColor('stroke'),
  colors: STROKE_COLORS.map(color => ({ color, name: 'Color' })),
  hollow: true,
  label: 'Stroke',
  onChange: (color: CssVariableName, { rootElement }: PieMenuContext) => {
    rootElement.service.editPropsStore.recordLastProps('shape', {
      strokeColor: color as LastProps['shape']['strokeColor'],
    });
    updateShapeOverlay(rootElement);
  },
});

pie.endSubmenu();

export const edgelessToolsPieSchema = pie.build();
