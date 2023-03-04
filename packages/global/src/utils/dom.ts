export class Dom {
  /**
   * Returns `16` if node is contained in the parent.
   * @param parent Element
   * @param node Element
   */
  static contains(parent: Element, node: Element): number {
    return (
      parent.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
    );
  }
}

export default Dom;
