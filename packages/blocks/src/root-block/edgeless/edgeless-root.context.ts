import { createContext } from '@lit/context';

import type { EdgelessTool } from '../../_common/types.js';

export const edgelessToolContext = createContext<EdgelessTool>(
  Symbol('edgeless-tool-context')
);

export interface TestStore {
  count: number;
}

export const testStoreContext = createContext<TestStore>(
  Symbol('test-store-context')
);
