import type { DocCollection, DocCollectionOptions } from '../collection.js';

type DocCollectionConstructor<Keys extends string> = {
  new (storeOptions: DocCollectionOptions): Omit<DocCollection, Keys>;
};

export type AddOn<Keys extends string> = (
  originalClass: DocCollectionConstructor<Keys>,
  context: ClassDecoratorContext
) => { new (storeOptions: DocCollectionOptions): unknown };

export type AddOnReturn<Keys extends string> = (
  originalClass: DocCollectionConstructor<Keys>,
  context: ClassDecoratorContext
) => typeof DocCollection;

export function addOnFactory<Keys extends string>(fn: AddOn<Keys>) {
  return fn as AddOnReturn<Keys>;
}
