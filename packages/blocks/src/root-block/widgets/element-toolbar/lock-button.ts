import type { BlockStdScope } from '@blocksuite/block-std';
import type { GfxModel } from '@blocksuite/block-std/gfx';

import {
  GroupElementModel,
  MindmapElementModel,
} from '@blocksuite/affine-model';
import {
  type ElementLockEvent,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { LockIcon, UnlockIcon } from '@blocksuite/icons/lit';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/index.js';

export class EdgelessLockButton extends SignalWatcher(
  WithDisposable(LitElement)
) {
  private get _selectedElements() {
    const elements = new Set<GfxModel>();
    this.edgeless.service.selection.selectedElements.forEach(element => {
      if (element.group instanceof MindmapElementModel) {
        elements.add(element.group);
      } else {
        elements.add(element);
      }
    });
    return [...elements];
  }

  private _lock() {
    const { service, doc, std } = this.edgeless;

    doc.captureSync();

    // get most top selected elements(*) from tree, like in a tree below
    //         G0
    //        /  \
    //      E1*  G1
    //          /  \
    //        E2*  E3*
    //
    // (*) selected elements, [E1, E2, E3]
    // return [E1]

    const selectedElements = this._selectedElements;
    const levels = selectedElements.map(element => element.groups.length);
    const topElement = selectedElements[levels.indexOf(Math.min(...levels))];
    const otherElements = selectedElements.filter(
      element => element !== topElement
    );

    // release other elements from their groups and group with top element
    otherElements.forEach(element => {
      // eslint-disable-next-line unicorn/prefer-dom-node-remove
      element.group?.removeChild(element);
      topElement.group?.addChild(element);
    });

    if (otherElements.length === 0) {
      topElement.lock();
      this.edgeless.gfx.selection.set({
        editing: false,
        elements: [topElement.id],
      });
      track(std, topElement, 'lock');
      return;
    }

    const groupId = service.createGroup([topElement, ...otherElements]);

    if (groupId) {
      const group = service.getElementById(groupId);
      if (group) {
        group.lock();
        this.edgeless.gfx.selection.set({
          editing: false,
          elements: [groupId],
        });
        track(std, group, 'group-lock');
        return;
      }
    }

    selectedElements.forEach(e => {
      e.lock();
      track(std, e, 'lock');
    });

    this.edgeless.gfx.selection.set({
      editing: false,
      elements: selectedElements.map(e => e.id),
    });
  }

  private _unlock() {
    const { service, doc } = this.edgeless;
    doc.captureSync();

    this._selectedElements.forEach(element => {
      if (element instanceof GroupElementModel) {
        service.ungroup(element);
      } else {
        element.lockedBySelf = false;
      }
      track(this.edgeless.std, element, 'unlock');
    });
  }

  override render() {
    const hasLocked = this._selectedElements.some(element =>
      element.isLocked()
    );

    this.dataset.locked = hasLocked ? 'true' : 'false';

    const icon = hasLocked ? UnlockIcon : LockIcon;

    return html`<editor-icon-button
      @click=${hasLocked ? this._unlock : this._lock}
    >
      ${icon({ width: '20px', height: '20px' })}
      ${hasLocked
        ? html`<span class="label medium">Click to unlock</span>`
        : nothing}
    </editor-icon-button>`;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;
}

function track(
  std: BlockStdScope,
  element: GfxModel,
  control: ElementLockEvent['control']
) {
  const type =
    'flavour' in element
      ? (element.flavour.split(':')[1] ?? element.flavour)
      : element.type;

  std.getOptional(TelemetryProvider)?.track('EdgelessElementLocked', {
    page: 'whiteboard editor',
    segment: 'element toolbar',
    module: 'element toolbar',
    control,
    type,
  });
}
