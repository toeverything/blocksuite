import type { Element, ElementContent, Root, RootContentMap, Text } from 'hast';

export type HastUnionType<
  K extends keyof RootContentMap,
  V extends RootContentMap[K],
> = V;

export type HtmlAST =
  | HastUnionType<keyof RootContentMap, RootContentMap[keyof RootContentMap]>
  | Root;

export const hastGetTextContent = (
  ast: HtmlAST | undefined,
  defaultStr = ''
): string => {
  if (!ast) {
    return defaultStr;
  }
  switch (ast.type) {
    case 'text': {
      return ast.value.replace(/\s+/g, ' ');
    }
    case 'element': {
      switch (ast.tagName) {
        case 'br': {
          return '\n';
        }
      }
      return ast.children.map(child => hastGetTextContent(child)).join('');
    }
  }
  return defaultStr;
};

export const hastGetElementChildren = (ast: HtmlAST | undefined): Element[] => {
  if (!ast) {
    return [];
  }
  if (ast.type === 'element') {
    return ast.children.filter(child => child.type === 'element') as Element[];
  }
  return [];
};

export const hastGetTextChildren = (ast: HtmlAST | undefined): Text[] => {
  if (!ast) {
    return [];
  }
  if (ast.type === 'element') {
    return ast.children.filter(child => child.type === 'text') as Text[];
  }
  return [];
};

export const hastGetTextChildrenOnlyAst = (ast: Element): Element => {
  return {
    ...ast,
    children: hastGetTextChildren(ast),
  };
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
  if (ast.type === 'root') {
    for (const child of ast.children) {
      const result = hastQuerySelector(child, selector);
      if (result) {
        return result;
      }
    }
  } else if (ast.type === 'element') {
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

export const hastFlatNodes = (
  ast: HtmlAST,
  expression: (tagName: string) => boolean
): HtmlAST => {
  if (ast.type === 'element') {
    const children = ast.children.map(child =>
      hastFlatNodes(child, expression)
    );
    return {
      ...ast,
      children: children.flatMap(child => {
        if (child.type === 'element') {
          if (expression(child.tagName)) {
            return child.children;
          }
        }
        return child;
      }) as ElementContent[],
    };
  }
  return ast;
};

// Check if it is a paragraph like element
// https://html.spec.whatwg.org/#paragraph
export const hastIsParagraphLike = (node: Element): boolean => {
  // Flex container
  return (
    (typeof node.properties?.style === 'string' &&
      node.properties.style.match(/display:\s*flex/) !== null) ||
    hastGetElementChildren(node).every(
      // Phrasing content
      child =>
        [
          'a',
          'abbr',
          'audio',
          'b',
          'bdi',
          'bdo',
          'br',
          'button',
          'canvas',
          'cite',
          'code',
          'data',
          'datalist',
          'del',
          'dfn',
          'em',
          'embed',
          'i',
          // 'iframe' is not included because it needs special handling
          // 'img' is not included because it needs special handling
          'input',
          'ins',
          'kbd',
          'label',
          'link',
          'map',
          'mark',
          'math',
          'meta',
          'meter',
          'noscript',
          'object',
          'output',
          'picture',
          'progress',
          'q',
          'ruby',
          's',
          'samp',
          'script',
          'select',
          'slot',
          'small',
          'span',
          'strong',
          'sub',
          'sup',
          'svg',
          'template',
          'textarea',
          'time',
          'u',
          'var',
          'video',
          'wbr',
        ].includes(child.tagName) ||
        // Inline elements
        (typeof child.properties?.style === 'string' &&
          child.properties.style.match(/display:\s*inline/))
    )
  );
};
