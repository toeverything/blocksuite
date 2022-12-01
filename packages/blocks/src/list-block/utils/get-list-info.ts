import type { BlockHost } from '../../__internal__';
import type { ListBlockModel } from '../list-model';

const getIndex = (host: BlockHost, model: ListBlockModel) => {
  const siblings = host.page.getParent(model)?.children || [];
  const fakeIndex = siblings.findIndex(v => v === model);

  // fakeIndex is the index of the model in the parent's children array
  // but we need to filter out the other list items
  let index = 0;
  for (let i = 0; i < fakeIndex; i++) {
    if (
      siblings[i].flavour === model.flavour &&
      siblings[i].type === model.type
    ) {
      index += 1;
    } else {
      index = 0;
    }
  }

  return index;
};

const getListDeep = (host: BlockHost, model: ListBlockModel): number => {
  let deep = 0;
  let parent = host.page.getParent(model);
  while (parent?.flavour === model.flavour) {
    deep++;
    parent = host.page.getParent(parent);
  }
  return deep;
};

export const getListInfo = (host: BlockHost, model: ListBlockModel) => {
  const deep = getListDeep(host, model);
  const index = getIndex(host, model);

  return { deep, index };
};
