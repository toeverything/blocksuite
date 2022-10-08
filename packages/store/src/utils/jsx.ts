import type { PrefixedBlockProps } from '../store';
import { format } from 'prettier';

type DocRecord = {
  [id: string]: PrefixedBlockProps & {
    'sys:children'?: string[];
  };
};

interface Node {
  type: string;
  props: Record<string, unknown>;
  children: Node[];
  // For jsx, we don't need this
  // isVoidTag: boolean;
}

const isValidRecord = (data: unknown): data is DocRecord => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  // TODO enhance this check
  return true;
};

const IGNORE_PROPS = ['sys:id', 'sys:flavour', 'sys:children'];
/**
 * @internal Only for testing
 */
export const blockRecordToJSXNode = (
  docRecord: Record<string, unknown>,
  nodeId = '0'
): Node => {
  if (!isValidRecord(docRecord)) {
    throw new Error('Failed to parse doc record! Invalid data.');
  }
  const node = docRecord[nodeId];
  if (!node) {
    throw new Error(
      `Failed to parse doc record! Node not found! id: ${nodeId}.`
    );
  }
  // TODO PascalCase
  const flavour = node['sys:flavour'];
  // TODO maybe need check children recursively nested
  const children = node['sys:children'];
  const props = Object.fromEntries(
    Object.entries(node).filter(([key]) => !IGNORE_PROPS.includes(key))
  );

  const ret = {
    type: flavour,
    props,
    children: children?.map(id => blockRecordToJSXNode(docRecord, id)) ?? [],
  };
  // Ad-hoc for `ReactTestComponent` identify.
  // Use ReactTestComponent serializer prevent snapshot be be wrapped in a string, which cases " to be escaped.
  // See https://github.com/facebook/jest/blob/f1263368cc85c3f8b70eaba534ddf593392c44f3/packages/pretty-format/src/plugins/ReactTestComponent.ts#L26-L29
  // @ts-expect-error
  ret.$$typeof = Symbol.for('react.test.json');
  return ret;
};

/**
 * @deprecated
 */
const convertPropsToString = (props: Record<string, unknown>) => {
  return Object.entries(props)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, value]) => {
      switch (typeof value) {
        case 'boolean':
          return value ? key : `${key}={false}`;
        case 'string':
          return `${key}="${value}"`;
        case 'number':
          return `${key}={${value}}`;
        case 'object':
          return `${key}={${JSON.stringify(value)}}`;
        case 'undefined':
          return '';
        default:
          throw new Error(
            `Can't convert prop to string! prop: ${key}, value: ${value}, type: ${typeof value}`
          );
      }
    })
    .join(' ');
};

/**
 * @deprecated Use {@link blockRecordToJSXNode} with `vitest.toMatchSnapshot` directly. Vitest has default serializers for React elements.
 */
const JSXNodeToString = ({ type, props, children }: Node): string => {
  const propsString = convertPropsToString(props);
  if (!children || !children.length) {
    return `<${type} ${propsString} />`;
  }

  return `<${type} ${propsString}>${children
    .map(child => JSXNodeToString(child))
    .join('')}</${type}>`;
};

/**
 * @internal Only for testing
 * @deprecated Use {@link blockRecordToJSXNode} with `vitest.toMatchSnapshot` directly. Vitest has default serializers for React elements.
 */
export const docRecordToJSX = (
  docRecord: Record<string, unknown>,
  nodeId = '0'
): string =>
  format(JSXNodeToString(blockRecordToJSXNode(docRecord, nodeId)), {
    // Use the mdx parser to prevent the tailing semicolon
    // parser: 'typescript',
    parser: 'mdx',
    singleQuote: true,
    // trailingComma: 'es5',
    tabWidth: 2,
    // arrowParens: 'avoid',
  });
