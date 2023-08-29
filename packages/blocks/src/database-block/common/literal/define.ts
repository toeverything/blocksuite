import { createUniComponentFromWebComponent } from '../../../components/uni-component/uni-component.js';
import { tNumber, tString, tTag } from '../../logical/data-type.js';
import { tArray, tUnknown } from '../../logical/typesystem.js';
import { literalMatcher } from './matcher.js';
import { ArrayLiteral } from './renderer/array-literal.js';
import { NumberLiteral, NumberLiteralEdit } from './renderer/number-literal.js';
import { StringLiteral, StringLiteralEdit } from './renderer/string-literal.js';
import { TagLiteral } from './renderer/tag-literal.js';

literalMatcher.register(tString.create(), {
  view: createUniComponentFromWebComponent(StringLiteral),
  edit: createUniComponentFromWebComponent(StringLiteralEdit),
});
literalMatcher.register(tNumber.create(), {
  view: createUniComponentFromWebComponent(NumberLiteral),
  edit: createUniComponentFromWebComponent(NumberLiteralEdit),
});
literalMatcher.register(tArray(tUnknown.create()), {
  view: createUniComponentFromWebComponent(ArrayLiteral),
  edit: createUniComponentFromWebComponent(ArrayLiteral),
});
literalMatcher.register(tTag.create(), {
  view: createUniComponentFromWebComponent(TagLiteral),
  edit: createUniComponentFromWebComponent(TagLiteral),
});
