type Keyof<T> = T extends unknown ? keyof T : never;

export class ASTWalkerContext<TNode extends object> {
  private _stack: { node: TNode; prop: Keyof<TNode> }[] = [];

  private _defautltProp: Keyof<TNode> = 'children' as unknown as Keyof<TNode>;

  setDefaultProp = (parentProp: Keyof<TNode>) => {
    this._defautltProp = parentProp;
  };

  currentNode() {
    return this._stack[this._stack.length - 1]?.node;
  }

  openNode(node: TNode, parentProp?: Keyof<TNode>) {
    this._stack.push({ node, prop: parentProp ?? this._defautltProp });
    return this;
  }

  closeNode() {
    const ele = this._stack.pop();
    if (!ele) return this;
    const parent = this._stack.pop();
    if (!parent) {
      this._stack.push(ele);
      return this;
    }
    if (parent.node[ele.prop] instanceof Array) {
      (parent.node[ele.prop] as Array<object>).push(ele.node);
    }
    this._stack.push(parent);
    return this;
  }
}
