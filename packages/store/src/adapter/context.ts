type Keyof<T> = T extends unknown ? keyof T : never;

export class ASTWalkerContext<TNode extends object> {
  private _stack: {
    node: TNode;
    prop: Keyof<TNode>;
    context: Record<string, unknown>;
  }[] = [];

  private _defautltProp: Keyof<TNode> = 'children' as unknown as Keyof<TNode>;

  setDefaultProp = (parentProp: Keyof<TNode>) => {
    this._defautltProp = parentProp;
  };

  get stack() {
    return this._stack;
  }

  private current() {
    return this._stack[this._stack.length - 1];
  }

  currentNode() {
    return this.current()?.node;
  }

  openNode(node: TNode, parentProp?: Keyof<TNode>) {
    this._stack.push({
      node,
      prop: parentProp ?? this._defautltProp,
      context: Object.create(null),
    });
    return this;
  }

  setContext(key: string, value: unknown) {
    this._stack[this._stack.length - 1].context[key] = value;
    return this;
  }

  getContext(key: string) {
    return this.current().context[key];
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
