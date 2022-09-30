import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { BlockHost } from '@blocksuite/shared';
import { ListBlockModel } from '../list-model';
import { number2letter } from './number2letter';
import { number2roman } from './number2roman';

const numberStyle = styleMap({
  color: '#7389FD',
  font: '14px/26px "Roboto Mono"',
});

const getIndex = (host: BlockHost, model: ListBlockModel) => {
  const siblings = host.store.getParent(model)?.children || [];
  return (
    siblings.filter(v => v.flavour === model.flavour).findIndex(v => v === v) +
    1
  );
};

const getPrefix = (deep: number, index: number) => {
  const map = [() => index, number2letter, number2roman];
  return map[deep % map.length](index);
};

export const getNumberPrefix = ({
  host,
  model,
  deep,
}: {
  host: BlockHost;
  model: ListBlockModel;
  deep: number;
}) => {
  const index = getIndex(host, model);
  const prefix = getPrefix(deep, index);
  return html`<div style="${numberStyle}">${prefix} .</div>`;
};
