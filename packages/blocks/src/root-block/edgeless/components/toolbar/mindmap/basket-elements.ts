import type { TemplateResult } from 'lit';

import { assertInstanceOf } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type { MindmapStyle } from '../../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import type { EdgelessRootService } from '../../../edgeless-root-service.js';

import { LayoutType } from '../../../../../surface-block/element-model/utils/mindmap/layout.js';
import {
  Bound,
  CanvasElementType,
  type MindmapElementModel,
  type ShapeElementModel,
  TextElementModel,
} from '../../../../../surface-block/index.js';
import { mountTextElementEditor } from '../../../utils/text.js';

export type ConfigProperty = 'o' | 'r' | 's' | 'x' | 'y' | 'z';
export type ConfigState = 'active' | 'default' | 'hover' | 'next';
export type ConfigStyle = Partial<Record<ConfigProperty, number | string>>;
export type ToolConfig = Record<ConfigState, ConfigStyle>;

export type DraggableTool = {
  config: ToolConfig;
  icon: TemplateResult;
  name: 'mindmap' | 'text';
  render: (
    bound: Bound,
    edgelessService: EdgelessRootService,
    edgeless: EdgelessRootBlockComponent
  ) => string;
  standardWidth?: number;
};

const unitMap = { o: '', r: 'deg', s: '', x: 'px', y: 'px', z: '' };
export const textConfig: ToolConfig = {
  active: {
    r: -8,
    s: 0.92,
    x: -22,
    y: -9,
  },
  default: {
    r: 7.74,
    s: 0.92,
    x: -20,
    y: -8,
    z: 2,
  },
  hover: {
    r: -8,
    s: 1,
    x: -22,
    y: -9,
    z: 3,
  },
  next: {
    r: 0,
    x: -22,
    y: 64,
  },
};
export const mindmapConfig: ToolConfig = {
  active: {
    r: 9,
    s: 1,
    x: 11,
    y: -14,
  },
  default: {
    r: -7,
    s: 1,
    x: 4,
    y: -4,
    z: 1,
  },
  hover: {
    r: 9,
    s: 1.16,
    x: 11,
    y: -14,
    z: 3,
  },
  next: {
    r: 0,
    y: 64,
  },
};

export const getMindmapRender =
  (mindmapStyle: MindmapStyle): DraggableTool['render'] =>
  (bound, edgelessService) => {
    const [x, y, _, h] = bound.toXYWH();
    const mindmapId = edgelessService.addElement('mindmap', {
      style: mindmapStyle,
    }) as string;

    edgelessService.telemetryService?.track('CanvasElementAdded', {
      control: 'toolbar:dnd', // for now we use toolbar:dnd for all mindmap creation here
      module: 'toolbar',
      page: 'whiteboard editor',
      segment: 'toolbar',
      type: 'mindmap',
    });

    const mindmap = edgelessService.getElementById(
      mindmapId
    ) as MindmapElementModel;

    const rootW = 145;
    const rootH = 50;

    const nodeW = 80;
    const nodeH = 35;

    const centerVertical = y + h / 2;
    const rootX = x;
    const rootY = centerVertical - rootH / 2;

    const createNode = (
      ...args: Parameters<MindmapElementModel['addNode']>
    ) => {
      const id = mindmap.addNode(...args);
      const node = edgelessService.getElementById(id) as ShapeElementModel;
      return { id, node };
    };
    const root = createNode(null, undefined, undefined, {
      text: 'Mind Map',
      xywh: `[${rootX},${rootY},${rootW},${rootH}]`,
    });

    for (let i = 0; i < 3; i++) {
      const nodeX = x + rootW + 300;
      const nodeY = centerVertical - nodeH / 2 + (i - 1) * 50;
      createNode(
        root.id,
        undefined,
        undefined,
        {
          text: 'Text',
          xywh: `[${nodeX},${nodeY},${nodeW},${nodeH}]`,
        },
        LayoutType.RIGHT
      );
    }

    return mindmapId;
  };
export const textRender: DraggableTool['render'] = (
  bound,
  service,
  edgeless
) => {
  const vCenter = bound.y + bound.h / 2;
  const w = 100;
  const h = 32;

  const flag = edgeless.doc.awarenessStore.getFlag('enable_edgeless_text');
  let id: string;
  if (flag) {
    const textService = edgeless.host.spec.getService('affine:edgeless-text');
    id = textService.initEdgelessTextBlock({
      edgeless,
      x: bound.x,
      y: vCenter - h / 2,
    });
  } else {
    id = service.addElement(CanvasElementType.TEXT, {
      text: new DocCollection.Y.Text(),
      xywh: new Bound(bound.x, vCenter - h / 2, w, h).serialize(),
    });

    edgeless.doc.captureSync();
    const textElement = edgeless.service.getElementById(id);
    assertInstanceOf(textElement, TextElementModel);
    mountTextElementEditor(textElement, edgeless);
  }

  service.telemetryService?.track('CanvasElementAdded', {
    control: 'toolbar:dnd',
    module: 'toolbar',
    page: 'whiteboard editor',
    segment: 'toolbar',
    type: 'text',
  });

  return id;
};

const toolStyle2StyleObj = (state: ConfigState, style: ConfigStyle = {}) => {
  const styleObj = {} as Record<string, string>;
  for (const [key, value] of Object.entries(style)) {
    styleObj[`--${state}-${key}`] = `${value}${unitMap[key as ConfigProperty]}`;
  }
  return styleObj;
};
export const toolConfig2StyleObj = (config: ToolConfig) => {
  const styleObj = {} as Record<string, string>;
  for (const [state, style] of Object.entries(config)) {
    Object.assign(
      styleObj,
      toolStyle2StyleObj(state as ConfigState, {
        ...config.default,
        ...style,
      })
    );
  }
  return styleObj;
};
