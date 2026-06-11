import { correctNumberedListsOrderToPrev } from '@labre/affine-block-list';
import { ListBlockModel } from '@labre/affine-model';
import { matchModels } from '@labre/affine-shared/utils';
import type { BlockStdScope } from '@labre/std';
import type { TransformerMiddleware } from '@labre/store';

export const reorderList =
  (std: BlockStdScope): TransformerMiddleware =>
  ({ slots }) => {
    const afterImportBlockSubscription = slots.afterImport.subscribe(
      payload => {
        if (payload.type === 'block') {
          const model = payload.model;
          if (
            matchModels(model, [ListBlockModel]) &&
            model.props.type === 'numbered'
          ) {
            const next = std.store.getNext(model);
            correctNumberedListsOrderToPrev(std.store, model);
            if (next) {
              correctNumberedListsOrderToPrev(std.store, next);
            }
          }
        }
      }
    );

    return () => {
      afterImportBlockSubscription.unsubscribe();
    };
  };
