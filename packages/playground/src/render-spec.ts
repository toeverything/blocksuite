import { Signal } from '@blocksuite/store';

/* eslint-disable @typescript-eslint/no-explicit-any */
type DOMNode = Node;
// Reference https://github.com/ProseMirror/prosemirror-model/blob/777079ad54cc09620fab4048c9585966145e8966/src/to_dom.ts

/**
 * A description of a DOM structure. Can be either a string, which is
 * interpreted as a text node, a DOM node, which is interpreted as
 * itself, a `{dom, contentDOM}` object, or an array.
 *
 * An array describes a DOM element. The first value in the array
 * should be a string—the name of the DOM element, optionally prefixed
 * by a namespace URL and a space. If the second element is plain
 * object, it is interpreted as a set of attributes for the element.
 * Any elements after that (including the 2nd if it's not an attribute
 * object) are interpreted as children of the DOM elements, and must
 * either be valid `DOMOutputSpec` values, or the number zero.
 *
 * The number zero (pronounced “hole”) is used to indicate the place
 * where a node's child nodes should be inserted. If it occurs in an
 * output spec, it should be the only child element in its parent
 * node.
 */
export type DOMOutputSpec =
  | string
  | DOMNode
  | { dom: DOMNode; contentDOM?: HTMLElement }
  | readonly [string, ...any[]];

/**
 * Render an [output spec](#model.DOMOutputSpec) to a DOM node. If
 * the spec has a hole (zero) in it, `contentDOM` will point at the
 * node with the hole.
 *
 * @remarks
 *
 * Does not properly dispose of signal children elements
 */
export function renderSpec(
  doc: Document,
  structure: DOMOutputSpec,
  xmlNS: string | null = null
): {
  dom: DOMNode;
  contentDOM?: HTMLElement;
} {
  if (typeof structure == 'string')
    return { dom: doc.createTextNode(structure) };
  if ((structure as DOMNode).nodeType != null)
    return { dom: structure as DOMNode };
  if ((structure as any).dom && (structure as any).dom.nodeType != null)
    return structure as { dom: DOMNode; contentDOM?: HTMLElement };
  let tagName = (structure as [string])[0];
  const space = tagName.indexOf(' ');
  if (space > 0) {
    xmlNS = tagName.slice(0, space);
    tagName = tagName.slice(space + 1);
  }
  let contentDOM: HTMLElement | undefined,
    start = 1;
  const dom = (
      xmlNS ? doc.createElementNS(xmlNS, tagName) : doc.createElement(tagName)
    ) as HTMLElement,
    attrs = (structure as any)[1];
  if (
    attrs &&
    typeof attrs == 'object' &&
    attrs.nodeType == null &&
    !Array.isArray(attrs)
  ) {
    start = 2;
    for (const name in attrs)
      if (attrs[name] != null) {
        const space = name.indexOf(' ');
        if (space > 0)
          dom.setAttributeNS(
            name.slice(0, space),
            name.slice(space + 1),
            attrs[name]
          );
        else setAttr(dom, name, attrs[name]);
      }
  }
  for (let i = start; i < (structure as readonly any[]).length; i++) {
    const child = (structure as any)[i] as DOMOutputSpec | 0;
    if (child === 0) {
      if (i < (structure as readonly any[]).length - 1 || i > start)
        throw new RangeError(
          'Content hole must be the only child of its parent node'
        );
      return { dom, contentDOM: dom };
    } else if (child instanceof Signal) {
      const emptyNode = document.createElement('signal-empty');
      let initChild = emptyNode as Node;
      dom.appendChild(initChild);
      child.on(val => {
        const { dom: inner, contentDOM: innerContent } =
          val == null || val === false
            ? { dom: emptyNode, contentDOM: undefined }
            : renderSpec(doc, val, xmlNS);
        dom.replaceChild(inner, initChild);
        initChild = inner;
        if (innerContent)
          throw new RangeError('Content hole must not be within signal');
      });
    } else {
      const { dom: inner, contentDOM: innerContent } = renderSpec(
        doc,
        child,
        xmlNS
      );
      dom.appendChild(inner);
      if (innerContent) {
        if (contentDOM) throw new RangeError('Multiple content holes');
        contentDOM = innerContent as HTMLElement;
      }
    }
  }
  return { dom, contentDOM };
}

function setAttr(elt: Element, attrName: string, attrValue: unknown) {
  if (attrValue == null) return;
  else if (
    typeof attrValue === 'boolean' ||
    attrName.startsWith('on') ||
    attrName === 'value'
  ) {
    (elt as any)[attrName] = attrValue;
  } else {
    elt.setAttribute(attrName, String(attrValue));
  }
}
