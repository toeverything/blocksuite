import {
  type AffineFormatBarWidget,
  toolbarDefaultConfig,
} from '@blocksuite/blocks';
import { html, type TemplateResult } from 'lit';

import { AIItemGroups } from './config.js';
import { FormatBarAIButton } from './format-bar-ai-button.js';

export function setupFormatBarEntry(formatBar: AffineFormatBarWidget) {
  toolbarDefaultConfig(formatBar);
  formatBar.addRawConfigItems(
    [
      {
        type: 'custom' as const,
        render(formatBar: AffineFormatBarWidget): TemplateResult | null {
          const askAIButton = new FormatBarAIButton();
          askAIButton.host = formatBar.host;
          askAIButton.actionGroups = AIItemGroups;
          return html`${askAIButton}`;
        },
      },
      { type: 'divider' },
    ],
    0
  );
}
