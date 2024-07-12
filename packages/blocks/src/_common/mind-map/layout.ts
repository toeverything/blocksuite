export type LayoutNode = {
  children: LayoutNode[];
  height: number;
  width: number;
};
export type Connector = {
  direction: 'bottom' | 'left' | 'right' | 'top';
  parentId: string;
} | null;
export type LayoutNodeResult = {
  children: LayoutNodeResult[];
  self: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
};
export type LayoutOptions = {
  gapHorizontal?: number;
  gapVertical?: number;
  x?: number;
  y?: number;
};
export type Layout = (
  node: LayoutNode,
  options?: LayoutOptions
) => LayoutNodeResult;
type LayoutOptionsRequired = Required<LayoutOptions>;
const defaultOptions: LayoutOptionsRequired = {
  gapHorizontal: 130,
  gapVertical: 10,
  x: 0,
  y: 0,
};
type BoxWithHeight = {
  children: BoxWithHeight[];
  height: number;
  self: LayoutNode;
};
const sum = (arr: number[]) => arr.reduce((prev, cur) => prev + cur, 0);
const computeBoxHeight = (
  node: LayoutNode,
  options: LayoutOptionsRequired
): BoxWithHeight => {
  const { height } = node;
  const children = node.children.map(child => computeBoxHeight(child, options));
  return {
    children,
    height: Math.max(
      height,
      children.reduce((prev, cur) => prev + cur.height, 0) +
        options.gapVertical * (children.length - 1)
    ),
    self: node,
  };
};
const computePositionRight = (
  node: BoxWithHeight,
  x: number,
  y: number,
  options: LayoutOptionsRequired
): LayoutNodeResult => {
  const { children, height, self } = node;
  const result: LayoutNodeResult = {
    children: [],
    self: {
      height: self.height,
      width: self.width,
      x: x,
      y: y - self.height / 2,
    },
  };
  let top = y - height / 2;
  children.forEach(child => {
    const { height } = child;
    const childY = top + height / 2;
    top += height + options.gapVertical;
    result.children.push(
      computePositionRight(
        child,
        x + node.self.width + options.gapHorizontal,
        childY,
        options
      )
    );
  });
  return result;
};

const rightLayout: Layout = (node, options) => {
  const realOptions = { ...defaultOptions, ...options };

  const box = computeBoxHeight(node, realOptions);
  return computePositionRight(box, realOptions.x, realOptions.y, realOptions);
};

const computePositionLeft = (
  node: BoxWithHeight,
  x: number,
  y: number,
  options: LayoutOptionsRequired
): LayoutNodeResult => {
  const { children, height, self } = node;
  const result: LayoutNodeResult = {
    children: [],
    self: {
      height: self.height,
      width: self.width,
      x: x - self.width,
      y: y - self.height / 2,
    },
  };
  let top = y - height / 2;
  children.forEach(child => {
    const { height } = child;
    const childY = top + height / 2;
    top += height + options.gapVertical;
    result.children.push(
      computePositionLeft(
        child,
        x - node.self.width - options.gapHorizontal,
        childY,
        options
      )
    );
  });
  return result;
};

const leftLayout: Layout = (node, options) => {
  const realOptions = { ...defaultOptions, ...options };
  const box = computeBoxHeight(node, realOptions);
  return computePositionLeft(box, 0, 0, realOptions);
};

const leftRightLayout: Layout = (node, options) => {
  const realOptions = { ...defaultOptions, ...options };
  const boxList = node.children.map(child =>
    computeBoxHeight(child, realOptions)
  );
  const mid = boxList.reduce((prev, cur) => Math.max(prev, cur.height), 0) / 2;
  const leftBox: BoxWithHeight[] = [];
  const rightBox: BoxWithHeight[] = [];
  let left = true;
  let currentTop = 0;
  boxList.forEach(box => {
    if (left) {
      leftBox.push(box);
    } else {
      rightBox.push(box);
    }
    currentTop += box.height;
    if (left && currentTop > mid) {
      left = false;
      currentTop = 0;
    }
  });
  let rightTop =
    0 -
    (sum(rightBox.map(v => v.height)) +
      realOptions.gapVertical * (rightBox.length - 1)) /
      2;
  let leftTop =
    0 -
    (leftBox.reduce((prev, cur) => prev + cur.height, 0) +
      realOptions.gapVertical * (leftBox.length - 1)) /
      2;
  const root: LayoutNodeResult = {
    children: [],
    self: {
      height: node.height,
      width: node.width,
      x: 0 - node.width / 2,
      y: 0 - node.height / 2,
    },
  };
  leftBox.forEach(box => {
    root.children.push(
      computePositionLeft(
        box,
        0 - (node.width / 2 + realOptions.gapHorizontal),
        leftTop + box.height / 2,
        realOptions
      )
    );
    leftTop += box.height + realOptions.gapVertical;
  });
  rightBox.forEach(box => {
    root.children.push(
      computePositionRight(
        box,
        node.width / 2 + realOptions.gapHorizontal,
        rightTop + box.height / 2,
        realOptions
      )
    );
    rightTop += box.height + realOptions.gapVertical;
  });
  return root;
};

type BoxWithWidth = {
  children: BoxWithWidth[];
  self: LayoutNode;
  width: number;
};

const computeBoxWidth = (
  node: LayoutNode,
  options: LayoutOptionsRequired
): BoxWithWidth => {
  const { width } = node;
  const children = node.children.map(child => computeBoxWidth(child, options));
  return {
    children,
    self: node,
    width: Math.max(
      width,
      children.reduce((prev, cur) => prev + cur.width, 0) +
        options.gapHorizontal * (children.length - 1)
    ),
  };
};

const computePositionTop = (
  node: BoxWithWidth,
  x: number,
  y: number,
  options: LayoutOptionsRequired
): LayoutNodeResult => {
  const { children, self, width } = node;
  const result: LayoutNodeResult = {
    children: [],
    self: {
      height: self.height,
      width: self.width,
      x,
      y,
    },
  };
  let left = x - width / 2;
  children.forEach(child => {
    const { self, width } = child;
    const childX = left + width / 2;
    left += width + options.gapHorizontal;
    result.children.push(
      computePositionTop(
        child,
        childX,
        y - self.height - options.gapVertical,
        options
      )
    );
  });
  return result;
};

const topLayout: Layout = (node, options) => {
  const realOptions = { ...defaultOptions, ...options };
  const box = computeBoxWidth(node, realOptions);
  return computePositionTop(box, 0, 0, realOptions);
};

const computePositionBottom = (
  node: BoxWithWidth,
  x: number,
  y: number,
  options: LayoutOptionsRequired
): LayoutNodeResult => {
  const { children, self, width } = node;
  const result: LayoutNodeResult = {
    children: [],
    self: {
      height: self.height,
      width: self.width,
      x,
      y,
    },
  };
  let left = x - width / 2;
  children.forEach(child => {
    const { self, width } = child;
    const childX = left + width / 2;
    left += width + options.gapHorizontal;
    result.children.push(
      computePositionBottom(
        child,
        childX,
        y + self.height + options.gapVertical,
        options
      )
    );
  });
  return result;
};

const bottomLayout: Layout = (node, options) => {
  const realOptions = { ...defaultOptions, ...options };
  const box = computeBoxWidth(node, realOptions);
  return computePositionBottom(box, 0, 0, realOptions);
};

const topBottomLayout: Layout = (node, options) => {
  const realOptions = { ...defaultOptions, ...options };
  const boxList = node.children.map(child =>
    computeBoxWidth(child, realOptions)
  );
  const mid = boxList.reduce((prev, cur) => Math.max(prev, cur.width), 0) / 2;
  const topBox: BoxWithWidth[] = [];
  const bottomBox: BoxWithWidth[] = [];
  let top = true;
  let currentLeft = 0;
  boxList.forEach(box => {
    if (top) {
      topBox.push(box);
    } else {
      bottomBox.push(box);
    }
    currentLeft += box.width;
    if (top && currentLeft > mid) {
      top = false;
      currentLeft = 0;
    }
  });
  let topLeft =
    0 -
    (sum(topBox.map(v => v.width)) +
      realOptions.gapHorizontal * (topBox.length - 1)) /
      2;
  let bottomLeft =
    0 -
    (bottomBox.reduce((prev, cur) => prev + cur.width, 0) +
      realOptions.gapHorizontal * (bottomBox.length - 1)) /
      2;
  const root: LayoutNodeResult = {
    children: [],
    self: {
      height: node.height,
      width: node.width,
      x: 0,
      y: 0,
    },
  };
  topBox.forEach(box => {
    root.children.push(
      computePositionTop(
        box,
        topLeft + box.width / 2,
        0 - (node.height / 2 + realOptions.gapVertical),
        realOptions
      )
    );
    topLeft += box.width + realOptions.gapHorizontal;
  });
  bottomBox.forEach(box => {
    root.children.push(
      computePositionBottom(
        box,
        bottomLeft + box.width / 2,
        node.height / 2 + realOptions.gapVertical,
        realOptions
      )
    );
    bottomLeft += box.width + realOptions.gapHorizontal;
  });
  return root;
};
export const layout = {
  bottom: bottomLayout,
  left: leftLayout,
  leftRight: leftRightLayout,
  right: rightLayout,
  top: topLayout,
  topBottom: topBottomLayout,
} satisfies Record<string, Layout>;
