import type { DocCollection } from '../collection.js';
import type { DocCollectionOptions } from '../collection.js';

type DocCollectionConstructor<Keys extends string> = {
  new (storeOptions: DocCollectionOptions): Omit<DocCollection, Keys>;
};

export type AddOn<Keys extends string> = (
  originalClass: DocCollectionConstructor<Keys>
) => { new (storeOptions: DocCollectionOptions): unknown };

export type AddOnReturn<Keys extends string> = (
  originalClass: DocCollectionConstructor<Keys>
) => typeof DocCollection;

export function addOnFactory<Keys extends string>(fn: AddOn<Keys>) {
  return fn as AddOnReturn<Keys>;
}
