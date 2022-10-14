import { BlockHost } from '../../__internal__';
import { ListBlockModel } from '../list-model';

const getIndex = (host: BlockHost, model: ListBlockModel) => {
  const siblings = host.store.getParent(model)?.children || [];

  return siblings
    .filter(v => v.flavour === model.flavour)
    .findIndex(v => v === model);
};

const getListDeep = (host: BlockHost, model: ListBlockModel): number => {
  let deep = 0;
  let parent = host.store.getParent(model);
  while (parent?.flavour === model.flavour) {
    deep++;
    parent = host.store.getParent(parent);
  }
  return deep;
};

export const getListInfo = (host: BlockHost, model: ListBlockModel) => {
  const deep = getListDeep(host, model);
  const index = getIndex(host, model);

  return { deep, index };
};
