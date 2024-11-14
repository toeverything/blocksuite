import { menu, popMenu } from '@blocksuite/affine-components/context-menu';

import type { LiteralData } from './types.js';

import { tString } from '../../logical/data-type.js';
import { MatcherCreator } from '../../logical/matcher.js';
import { createUniComponentFromWebComponent } from '../../utils/uni-component/uni-component.js';
import { StringLiteral } from './renderer/literal-element.js';

const literalMatcherCreator = new MatcherCreator<LiteralData>();
export const literalMatchers = [
  literalMatcherCreator.createMatcher(tString.create(), {
    view: createUniComponentFromWebComponent(StringLiteral),
    popEdit: (position, { value$, onChange }) => {
      popMenu(position, {
        options: {
          items: [
            menu.input({
              initialValue: value$.value?.toString() ?? '',
              onComplete: text => {
                onChange(text || undefined);
              },
            }),
          ],
        },
      });
    },
  }),
];
