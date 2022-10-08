import type { PrefixedBlockProps } from '../store';

type DocRecord = {
  [id: string]: PrefixedBlockProps & {
    'sys:children'?: string[];
  };
};

interface JSXElement {
  // Ad-hoc for `ReactTestComponent` identify.
  // Use ReactTestComponent serializer prevent snapshot be be wrapped in a string, which cases " to be escaped.
  // See https://github.com/facebook/jest/blob/f1263368cc85c3f8b70eaba534ddf593392c44f3/packages/pretty-format/src/plugins/ReactTestComponent.ts#L78-L79
  $$typeof: symbol;
  type: string;
  props?: Record<string, unknown>;
  children?: null | (JSXElement | string | number)[];
}

const isValidRecord = (data: unknown): data is DocRecord => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  // TODO enhance this check
  return true;
};

const IGNORE_PROPS = ['sys:id', 'sys:flavour', 'sys:children'];

export const blockRecordToJSXNode = (
  docRecord: Record<string, unknown>,
  nodeId: string
): JSXElement => {
  if (!isValidRecord(docRecord)) {
    throw new Error('Failed to parse doc record! Invalid data.');
  }
  const node = docRecord[nodeId];
  if (!node) {
    throw new Error(
      `Failed to parse doc record! Node not found! id: ${nodeId}.`
    );
  }
  // TODO maybe need set PascalCase
  const flavour = node['sys:flavour'];
  // TODO maybe need check children recursively nested
  const children = node['sys:children'];
  const props = Object.fromEntries(
    Object.entries(node).filter(([key]) => !IGNORE_PROPS.includes(key))
  );

  return {
    // Ad-hoc for `ReactTestComponent` identify.
    // See https://github.com/facebook/jest/blob/f1263368cc85c3f8b70eaba534ddf593392c44f3/packages/pretty-format/src/plugins/ReactTestComponent.ts#L26-L29
    $$typeof: Symbol.for('react.test.json'),
    type: flavour,
    props,
    children: children?.map(id => blockRecordToJSXNode(docRecord, id)) ?? [],
  };
};
