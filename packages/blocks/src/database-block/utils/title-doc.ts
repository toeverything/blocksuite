import type { AffineTextAttributes } from '@blocksuite/affine-components/rich-text';
import type { Text } from '@blocksuite/store';

export const getDocIdsFromText = (text?: Text) => {
  return (
    text?.deltas$.value
      ?.filter(delta => {
        const attributes: AffineTextAttributes | undefined = delta.attributes;
        return attributes?.reference?.type === 'LinkedPage';
      })
      ?.map(delta => delta.attributes?.reference?.pageId as string) ?? []
  );
};
