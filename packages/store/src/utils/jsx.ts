import * as Y from 'yjs';

import type { PrefixedBlockProps } from '../workspace/page.js';

type DocRecord = {
  [id: string]: PrefixedBlockProps & {
    'sys:children'?: string[];
  };
};

export interface JSXElement {
  // Ad-hoc for `ReactTestComponent` identify.
  // Use ReactTestComponent serializer prevent snapshot be be wrapped in a string, which cases " to be escaped.
  // See https://github.com/facebook/jest/blob/f1263368cc85c3f8b70eaba534ddf593392c44f3/packages/pretty-format/src/plugins/ReactTestComponent.ts#L78-L79
  $$typeof: symbol | 0xea71357;
  type: string;
  props: { 'prop:text'?: string | JSXElement } & Record<string, unknown>;
  children?: null | (JSXElement | string | number)[];
}

// Ad-hoc for `ReactTestComponent` identify.
// See https://github.com/facebook/jest/blob/f1263368cc85c3f8b70eaba534ddf593392c44f3/packages/pretty-format/src/plugins/ReactTestComponent.ts#L26-L29
const testSymbol = Symbol.for('react.test.json');

function isValidRecord(data: unknown): data is DocRecord {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  // TODO enhance this check
  return true;
}

const IGNORED_PROPS = [
  'sys:id',
  'sys:flavour',
  'sys:children',
  'prop:xywh',
  'prop:yCells',
];

export function yDocToJSXNode(
  serializedDoc: Record<string, unknown>,
  nodeId: string
): JSXElement {
  if (!isValidRecord(serializedDoc)) {
    throw new Error('Failed to parse doc record! Invalid data.');
  }
  const node = serializedDoc[nodeId];
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
    Object.entries(node).filter(([key]) => !IGNORED_PROPS.includes(key))
  );

  if ('prop:text' in props && props['prop:text'] instanceof Array) {
    props['prop:text'] = parseDelta(props['prop:text'] as DeltaText);
  }

  if ('prop:title' in props && props['prop:title'] instanceof Array) {
    props['prop:title'] = parseDelta(props['prop:title'] as DeltaText);
  }

  if ('prop:columns' in props && props['prop:columns'] instanceof Array) {
    props['prop:columns'] = `Array [${props['prop:columns'].length}]`;
  }

  return {
    $$typeof: testSymbol,
    type: flavour,
    props,
    children: children?.map(id => yDocToJSXNode(serializedDoc, id)) ?? [],
  };
}

export function serializeYDoc(doc: Y.Doc) {
  const json: Record<string, unknown> = {};
  doc.share.forEach((value, key) => {
    if (value instanceof Y.Map) {
      json[key] = serializeYMap(value);
    } else {
      json[key] = value.toJSON();
    }
  });
  return json;
}

function serializeYMap(map: Y.Map<unknown>) {
  const json: Record<string, unknown> = {};
  map.forEach((value, key) => {
    if (value instanceof Y.Map) {
      json[key] = serializeYMap(value);
    } else if (value instanceof Y.Text) {
      json[key] = serializeYText(value);
    } else if (value instanceof Y.Array) {
      json[key] = value.toJSON();
    } else if (value instanceof Y.AbstractType) {
      json[key] = value.toJSON();
    } else {
      json[key] = value;
    }
  });
  return json;
}

type DeltaText = {
  insert: string;
  attributes?: { [format: string]: unknown };
}[];

function serializeYText(text: Y.Text): DeltaText {
  const delta = text.toDelta();
  return delta;
}

function parseDelta(text: DeltaText) {
  if (!text.length) {
    return undefined;
  }
  if (text.length === 1 && !text[0].attributes) {
    // just plain text
    return text[0].insert;
  }
  return {
    // The `Symbol.for('react.fragment')` will render as `<React.Fragment>`
    // so we use a empty string to render it as `<>`.
    // But it will empty children ad `< />`
    // so we return `undefined` directly if not delta text.
    $$typeof: testSymbol, // Symbol.for('react.element'),
    type: '', // Symbol.for('react.fragment'),
    props: {},
    children: text?.map(({ insert, attributes }) => ({
      $$typeof: testSymbol,
      type: 'text',
      props: {
        // Not place at `children` to avoid the trailing whitespace be trim by formatter.
        insert,
        ...attributes,
      },
    })),
  };
}
