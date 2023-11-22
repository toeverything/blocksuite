import type { Element, Root, RootContentMap } from 'hast';

export type HastUnionType<
  K extends keyof RootContentMap,
  V extends RootContentMap[K],
> = V;

export type HtmlAST =
  | HastUnionType<keyof RootContentMap, RootContentMap[keyof RootContentMap]>
  | Root;

export const hastGetTextContent = (ast: HtmlAST | undefined): string => {
  if (!ast) {
    return '';
  }
  switch (ast.type) {
    case 'text': {
      return ast.value;
    }
    case 'element': {
      return ast.children.map(child => hastGetTextContent(child)).join('');
    }
  }
  return '';
};

const querySelectorTag = (
  ast: HtmlAST,
  tagName: string
): Element | undefined => {
  if (ast.type === 'element') {
    if (ast.tagName === tagName) {
      return ast;
    }
    for (const child of ast.children) {
      const result = querySelectorTag(child, tagName);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};

const querySelectorClass = (
  ast: HtmlAST,
  className: string
): Element | undefined => {
  if (ast.type === 'element') {
    if (
      Array.isArray(ast.properties?.className) &&
      ast.properties.className.includes(className)
    ) {
      return ast;
    }
    for (const child of ast.children) {
      const result = querySelectorClass(child, className);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};

const querySelectorId = (ast: HtmlAST, id: string): Element | undefined => {
  if (ast.type === 'element') {
    if (ast.properties.id === id) {
      return ast;
    }
    for (const child of ast.children) {
      const result = querySelectorId(child, id);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};

export const hastQuerySelector = (
  ast: HtmlAST,
  selector: string
): Element | undefined => {
  if (ast.type === 'element') {
    if (selector.startsWith('.')) {
      return querySelectorClass(ast, selector.slice(1));
    } else if (selector.startsWith('#')) {
      return querySelectorId(ast, selector.slice(1));
    } else {
      return querySelectorTag(ast, selector);
    }
  }
  return undefined;
};
