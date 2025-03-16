export function isFixed(
  node: HTMLElement,
  computedStyle: CSSStyleDeclaration = window.getComputedStyle(node)
): boolean {
  return computedStyle.position === 'fixed';
}

export function isScrollable(
  element: HTMLElement,
  computedStyle: CSSStyleDeclaration = window.getComputedStyle(element)
): boolean {
  const overflowRegex = /(auto|scroll|overlay)/;
  const properties = ['overflow', 'overflowX', 'overflowY'];

  return properties.some(property => {
    const value = computedStyle[property as keyof CSSStyleDeclaration];

    return typeof value === 'string' ? overflowRegex.test(value) : false;
  });
}

export function getScrollableAncestors(
  element: Node | null,
  limit?: number
): Element[] {
  const scrollParents: Element[] = [];

  if (!element) {
    return scrollParents;
  }

  let currentNode: Node | null = element;

  while (currentNode) {
    if (limit != null && scrollParents.length >= limit) {
      break;
    }

    if (!(currentNode instanceof HTMLElement)) {
      break;
    }

    const computedStyle = window.getComputedStyle(currentNode);

    if (currentNode !== element && isScrollable(currentNode, computedStyle)) {
      scrollParents.push(currentNode);
    }

    if (isFixed(currentNode, computedStyle)) {
      break;
    }

    currentNode = currentNode.parentNode;
  }

  return scrollParents;
}

export function getFirstScrollableAncestor(node: Node | null): Element | null {
  const [firstScrollableAncestor] = getScrollableAncestors(node, 1);

  return firstScrollableAncestor ?? null;
}
