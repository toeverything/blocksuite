import type { ListBlockModel } from '../list-model.js';

const getIndex = (model: ListBlockModel) => {
  const siblings = model.page.getParent(model)?.children || [];
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

const getListDeep = (model: ListBlockModel): number => {
  let deep = 0;
  let parent = model.page.getParent(model);
  while (parent?.flavour === model.flavour) {
    deep++;
    parent = model.page.getParent(parent);
  }
  return deep;
};

export const getListInfo = (model: ListBlockModel) => {
  const deep = getListDeep(model);
  const index = getIndex(model);

  return { deep, index };
};
