import {
  type AffineFormatBarWidget,
  type AIItemGroupConfig,
  toolbarDefaultConfig,
} from '@blocksuite/blocks';
import { html, type TemplateResult } from 'lit';

import { FormatBarAIButton } from './format-bar-ai-button.js';

export function setupFormatBarEntry(
  formatBar: AffineFormatBarWidget,
  actionGroups: AIItemGroupConfig[]
) {
  toolbarDefaultConfig(formatBar);
  formatBar.addRawConfigItems(
    [
      {
        type: 'custom' as const,
        render(formatBar: AffineFormatBarWidget): TemplateResult | null {
          const askAIButton = new FormatBarAIButton();
          askAIButton.host = formatBar.host;
          askAIButton.actionGroups = actionGroups;
          return html`${askAIButton}`;
        },
      },
      { type: 'divider' },
    ],
    0
  );
}
