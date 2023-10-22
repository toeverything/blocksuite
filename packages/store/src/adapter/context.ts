type Keyof<T> = T extends unknown ? keyof T : never;

export class ASTWalkerContext<TNode extends object> {
  private _stack: {
    node: TNode;
    prop: Keyof<TNode>;
    context: Record<string, unknown>;
  }[] = [];

  private _globalContext: Record<string, unknown> = Object.create(null);

  private _defautltProp: Keyof<TNode> = 'children' as unknown as Keyof<TNode>;

  _skip = false;
  _skipChildrenNum = 0;

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

  setNodeContext(key: string, value: unknown) {
    this._stack[this._stack.length - 1].context[key] = value;
    return this;
  }

  getNodeContext(key: string) {
    return this.current().context[key];
  }

  getGlobalContext(key: string) {
    return this._globalContext[key];
  }

  setGlobalContext(key: string, value: unknown) {
    this._globalContext[key] = value;
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

  skipAllChildren() {
    this._skip = true;
  }

  skipChildren(num = 1) {
    this._skipChildrenNum = num;
  }
}
