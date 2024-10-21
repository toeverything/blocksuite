import type { BlockCommands } from '@blocksuite/block-std';

import {
  autoArrangeElementsCommand,
  autoResizeElementsCommand,
} from './auto-align.js';
import { reassociateConnectorsCommand } from './reassociate-connectors.js';

export const commands: BlockCommands = {
  reassociateConnectors: reassociateConnectorsCommand,
  autoArrangeElements: autoArrangeElementsCommand,
  autoResizeElements: autoResizeElementsCommand,
};
