import type { TemplateResult } from 'lit';

import { MindmapStyle } from '../../../../../surface-block/index.js';
import { type DraggableTool, getMindmapRender } from './basket-elements.js';
import {
  mindMapStyle1Dark,
  mindMapStyle1Light,
  mindMapStyle2Dark,
  mindMapStyle2Light,
  mindMapStyle3,
  mindMapStyle4,
} from './icons.js';

export type ToolbarMindmapItem = {
  icon: TemplateResult;
  render: DraggableTool['render'];
  style: MindmapStyle;
  type: 'mindmap';
};

export const getMindMaps = (theme: 'dark' | 'light'): ToolbarMindmapItem[] => [
  {
    icon: theme === 'light' ? mindMapStyle1Light : mindMapStyle1Dark,
    render: getMindmapRender(MindmapStyle.ONE),
    style: MindmapStyle.ONE,
    type: 'mindmap',
  },
  {
    icon: mindMapStyle4,
    render: getMindmapRender(MindmapStyle.FOUR),
    style: MindmapStyle.FOUR,
    type: 'mindmap',
  },
  {
    icon: mindMapStyle3,
    render: getMindmapRender(MindmapStyle.THREE),
    style: MindmapStyle.THREE,
    type: 'mindmap',
  },
  {
    icon: theme === 'light' ? mindMapStyle2Light : mindMapStyle2Dark,
    render: getMindmapRender(MindmapStyle.TWO),
    style: MindmapStyle.TWO,
    type: 'mindmap',
  },
];
