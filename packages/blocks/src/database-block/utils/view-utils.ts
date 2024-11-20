import type {
  DatabaseBlockModel,
  ViewBasicDataType,
} from '@blocksuite/affine-model';

import {
  genIndexByPosition,
  getIndexMap,
  type NewInsertPosition,
  numIndexToStrIndex,
} from '@blocksuite/affine-shared/utils';

import { updateProps } from './block-utils.js';

export const updateView = <ViewData extends ViewBasicDataType>(
  model: DatabaseBlockModel,
  id: string,
  update: (data: ViewData) => Partial<ViewData>
) => {
  updateProps(model, 'views', views => {
    const index = views.findIndex(v => v.id === id);
    if (index < 0) return;
    const viewData = views[index];
    Object.assign(viewData, update(viewData as ViewData));
  });
};

export function deleteView(model: DatabaseBlockModel, id: string) {
  model.doc.captureSync();
  updateProps(model, 'views', views => {
    const index = views.findIndex(v => v.id === id);
    views.splice(index, 1);
  });
}

export function duplicateView(model: DatabaseBlockModel, id: string): string {
  const newId = model.doc.generateBlockId();
  updateProps(model, 'views', views => {
    const index = views.findIndex(v => v.id === id);
    const view = views[index];
    if (view) {
      views.splice(
        index + 1,
        0,
        JSON.parse(JSON.stringify({ ...view, id: newId }))
      );
    }
  });
  return newId;
}

export function moveViewTo(
  model: DatabaseBlockModel,
  id: string,
  position: NewInsertPosition
) {
  const indexMap = getIndexMap(model.views$.value);
  updateProps(model, 'views', views => {
    const view = views.find(v => v.id === id);
    if (view) {
      view.index = genIndexByPosition(position, indexMap);
    }
  });
}

export const getViews = (model: DatabaseBlockModel) => {
  const views = model.views$.value.map((v, i) => {
    return {
      ...v,
      index: v.index ?? numIndexToStrIndex(i),
    };
  });
  return views.sort((a, b) => {
    return a.index.localeCompare(b.index);
  });
};
