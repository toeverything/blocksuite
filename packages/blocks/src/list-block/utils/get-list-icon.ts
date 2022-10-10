import { BlockHost } from '@blocksuite/shared';
import { ListBlockModel } from '../list-model';
import { points } from './points';
import { getNumberPrefix } from './get-number-prefix';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

const listPrefixStyle = styleMap({
  flexShrink: '0',
  minWidth: '26px',
  height: '26px',
  padding: '3px 0',
  marginRight: '4px',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'flex-end',
});

const getListDeep = (host: BlockHost, model: ListBlockModel): number => {
  let deep = 0;
  let parent = host.store.getParent(model);
  while (parent?.flavour === model.flavour) {
    deep++;
    parent = host.store.getParent(parent);
  }
  return deep;
};

export function getListIcon(host: BlockHost, model: ListBlockModel) {
  const deep = getListDeep(host, model);

  if (model.type === 'numbered') {
    return html`<div style="${listPrefixStyle}">
      ${getNumberPrefix({
        deep,
        host,
        model,
      })}
    </div>`;
  }

  return html`<div style="${listPrefixStyle}">
    ${points[deep % points.length]}
  </div>`;
}
