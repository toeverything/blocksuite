import type { ListBlockModel } from '@blocksuite/affine-model';
import {
  BulletedList01Icon,
  BulletedList02Icon,
  BulletedList03Icon,
  BulletedList04Icon,
  CheckBoxCheckSolidIcon,
  CheckBoxUnIcon,
  ToggleDownIcon,
  ToggleRightIcon,
} from '@blocksuite/icons/lit';
import { html } from 'lit';

import { getNumberPrefix } from './get-number-prefix.js';

const getListDeep = (model: ListBlockModel): number => {
  let deep = 0;
  let parent = model.doc.getParent(model);
  while (parent?.flavour === model.flavour) {
    deep++;
    parent = model.doc.getParent(parent);
  }
  return deep;
};

const BulletIcons = [
  BulletedList01Icon({ width: '24px', height: '24px' }),
  BulletedList02Icon({ width: '24px', height: '24px' }),
  BulletedList03Icon({ width: '24px', height: '24px' }),
  BulletedList04Icon({ width: '24px', height: '24px' }),
];

export function getListIcon(
  model: ListBlockModel,
  showChildren: boolean,
  onClick: (e: MouseEvent) => void
) {
  const deep = getListDeep(model);
  switch (model.props.type) {
    case 'bulleted':
      return html`<div
        contenteditable="false"
        class="affine-list-block__prefix"
        @click=${onClick}
      >
        ${BulletIcons[deep % BulletIcons.length]}
      </div>`;
    case 'numbered':
      return html`<div
        contenteditable="false"
        class="affine-list-block__prefix affine-list-block__numbered"
        @click=${onClick}
      >
        ${model.props.order ? getNumberPrefix(model.props.order, deep) : '1.'}
      </div>`;
    case 'todo':
      return html`<div
        contenteditable="false"
        class=${`affine-list-block__prefix affine-list-block__todo-prefix ${model.doc.readonly ? 'readonly' : ''}`}
        @click=${onClick}
      >
        ${model.props.checked
          ? CheckBoxCheckSolidIcon({ style: 'color: #1E96EB' })
          : CheckBoxUnIcon()}
      </div>`;
    case 'toggle':
      return html`<div
        contenteditable="false"
        class="affine-list-block__prefix"
        @click=${onClick}
      >
        ${showChildren ? ToggleDownIcon() : ToggleRightIcon()}
      </div>`;
    default:
      console.error('Unknown list type', model.props.type, model);
      return null;
  }
}
