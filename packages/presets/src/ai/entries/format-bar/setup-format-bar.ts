import {
  type AffineFormatBarWidget,
  toolbarDefaultConfig,
} from '@blocksuite/blocks';
import { type TemplateResult, html } from 'lit';

import '../../_common/components/ask-ai-button.js';
import { AIItemGroups } from '../../_common/config.js';

export function setupFormatBarEntry(formatBar: AffineFormatBarWidget) {
  toolbarDefaultConfig(formatBar);
  formatBar.addRawConfigItems(
    [
      {
        type: 'custom' as const,
        render(formatBar: AffineFormatBarWidget): TemplateResult | null {
          return html` <ask-ai-button
            .host=${formatBar.host}
            .actionGroups=${AIItemGroups}
            .toggleType=${'hover'}
          ></ask-ai-button>`;
        },
      },
      { type: 'divider' },
    ],
    0
  );
}
