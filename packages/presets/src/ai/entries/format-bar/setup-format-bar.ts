import './format-bar-ai-button.js';

import {
  type AffineFormatBarWidget,
  toolbarDefaultConfig,
} from '@blocksuite/blocks';
import { html, type TemplateResult } from 'lit';

import { AIItemGroups } from './config.js';

export function setupFormatBarEntry(formatBar: AffineFormatBarWidget) {
  toolbarDefaultConfig(formatBar);
  formatBar.addRawConfigItems(
    [
      {
        type: 'custom' as const,
        render(formatBar: AffineFormatBarWidget): TemplateResult | null {
          return html` <format-bar-ai-button
            .host=${formatBar.host}
            .actionGroups=${AIItemGroups}
          ></format-bar-ai-button>`;
        },
      },
      { type: 'divider' },
    ],
    0
  );
}
