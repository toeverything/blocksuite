import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { LockIcon } from '@blocksuite/icons/lit';
import { html, LitElement } from 'lit';

export class EdgelessLockButton extends SignalWatcher(
  WithDisposable(LitElement)
) {
  protected override render() {
    return html`<editor-icon-button>
      ${LockIcon()}<span class="label medium">Lock</span>
    </editor-icon-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-lock-button': EdgelessLockButton;
  }
}
