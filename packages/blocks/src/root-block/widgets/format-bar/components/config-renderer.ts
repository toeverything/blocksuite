import { html, type TemplateResult } from 'lit';

import { isFormatSupported } from '../../../../note-block/commands/utils.js';
import type { AffineFormatBarWidget } from '../format-bar.js';
import { HighlightButton } from './highlight/highlight-button.js';
import { ParagraphButton } from './paragraph-button.js';

export function ConfigRenderer(formatBar: AffineFormatBarWidget) {
  return formatBar.configItems
    .filter(item => {
      if (item.type === 'paragraph-action') {
        return false;
      }
      if (item.type === 'highlighter-dropdown') {
        const [supported] = isFormatSupported(
          formatBar.std.command.chain()
        ).run();
        return supported;
      }
      if (item.type === 'inline-action') {
        return item.showWhen(formatBar.std.command.chain(), formatBar);
      }
      return true;
    })
    .map(item => {
      let template: TemplateResult | null = null;
      switch (item.type) {
        case 'divider':
          template = html`<div class="divider"></div>`;
          break;
        case 'highlighter-dropdown': {
          template = HighlightButton(formatBar);
          break;
        }
        case 'paragraph-dropdown':
          template = ParagraphButton(formatBar);
          break;
        case 'inline-action': {
          template = html`<icon-button
            size="32px"
            data-testid=${item.id}
            ?active=${item.isActive(formatBar.std.command.chain(), formatBar)}
            @click=${() => {
              item.action(formatBar.std.command.chain(), formatBar);
              formatBar.requestUpdate();
            }}
          >
            ${typeof item.icon === 'function' ? item.icon() : item.icon}
            <affine-tooltip>${item.name}</affine-tooltip>
          </icon-button>`;
          break;
        }
        case 'custom': {
          template = item.render(formatBar);
          break;
        }
        default:
          template = null;
      }

      return [template, item] as const;
    })
    .filter(([template]) => template !== null && template !== undefined)
    .filter(([_, item], index, list) => {
      if (item.type === 'divider') {
        if (index === 0) {
          return false;
        }
        if (index === list.length - 1) {
          return false;
        }
        if (list[index - 1][1].type === 'divider') {
          return false;
        }
      }
      return true;
    })
    .map(([template]) => template);
}
