export type EdgelessTool = BlockSuite.EdgelessToolType;

declare global {
  namespace BlockSuite {
    type EdgelessModelKeys = EdgelessBlockModelKeyType | SurfaceModelKeyType;

    interface EdgelessToolControllerMap {}
    type EdgelessToolControllerKeyType = keyof EdgelessToolMap;
    type EdgelessToolControllerType =
      EdgelessToolMap[EdgelessToolControllerKeyType];
    type EdgelessToolType = EdgelessToolControllerType['tool'];
  }
}
