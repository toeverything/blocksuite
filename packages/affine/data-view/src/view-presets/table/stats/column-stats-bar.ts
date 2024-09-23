import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { GroupData } from '../../../core/common/group-by/helper.js';
import type { TableSingleView } from '../table-view-manager.js';

import { LEFT_TOOL_BAR_WIDTH, STATS_BAR_HEIGHT } from '../consts.js';

const styles = css`
  .affine-database-column-stats {
    width: 100%;
    margin-left: ${LEFT_TOOL_BAR_WIDTH}px;
    height: ${STATS_BAR_HEIGHT}px;
    display: flex;
  }
`;

export class DataBaseColumnStats extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  protected override render() {
    const cols = this.view.properties$.value;

    return html`
      <div class="affine-database-column-stats">
        ${repeat(
          cols,
          col => col.id,
          col => {
            return html`<affine-database-column-stats-cell
              .column=${col}
              .group=${this.group}
            ></affine-database-column-stats-cell>`;
          }
        )}
      </div>
    `;
  }

  @property({ attribute: false })
  accessor group: GroupData | undefined = undefined;

  @property({ attribute: false })
  accessor view!: TableSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-stats': DataBaseColumnStats;
  }
}
