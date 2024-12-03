import type { DeltaInsert } from '@blocksuite/inline';
import type { Code } from 'mdast';

import { CodeBlockSchema } from '@blocksuite/affine-model';
import {
  BlockMarkdownAdapterExtension,
  type BlockMarkdownAdapterMatcher,
  type MarkdownAST,
} from '@blocksuite/affine-shared/adapters';
import { nanoid } from '@blocksuite/store';

const isCodeNode = (node: MarkdownAST): node is Code => node.type === 'code';

export const codeBlockMarkdownAdapterMatcher: BlockMarkdownAdapterMatcher = {
  flavour: CodeBlockSchema.model.flavour,
  toMatch: o => isCodeNode(o.node),
  fromMatch: o => o.node.flavour === 'affine:code',
  toBlockSnapshot: {
    enter: (o, context) => {
      if (!isCodeNode(o.node)) {
        return;
      }
      const { walkerContext } = context;
      walkerContext
        .openNode(
          {
            type: 'block',
            id: nanoid(),
            flavour: 'affine:code',
            props: {
              language: o.node.lang ?? 'Plain Text',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: o.node.value,
                  },
                ],
              },
            },
            children: [],
          },
          'children'
        )
        .closeNode();
    },
  },
  fromBlockSnapshot: {
    enter: (o, context) => {
      const text = (o.node.props.text ?? { delta: [] }) as {
        delta: DeltaInsert[];
      };
      const { walkerContext } = context;
      walkerContext
        .openNode(
          {
            type: 'code',
            lang: (o.node.props.language as string) ?? null,
            meta: null,
            value: text.delta.map(delta => delta.insert).join(''),
          },
          'children'
        )
        .closeNode();
    },
  },
};

export const CodeBlockMarkdownAdapterExtension = BlockMarkdownAdapterExtension(
  codeBlockMarkdownAdapterMatcher
);
