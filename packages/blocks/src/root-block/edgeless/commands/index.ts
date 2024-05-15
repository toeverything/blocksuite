declare global {
  namespace BlockSuite {
    interface EdgelessCommands {}

    type EdgelessCommandName = keyof EdgelessCommands;
  }
}
