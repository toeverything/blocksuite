import { AffineSchemas } from '@blocksuite/blocks/models';
import {
  BlockSuiteProvider,
  createBlockSuiteStore,
  useBlockSuiteStore,
} from '@blocksuite/react';
import { Workspace } from '@blocksuite/store';
import { DebugDocProvider, IndexedDBDocProvider } from '@blocksuite/store';
import { Navbar, Text } from '@nextui-org/react';
import { useEffect } from 'react';

import { NoSsr } from '../components/NoSsr';
import { PageManger } from '../components/PageManger';
import { WorkspacesDropdown } from '../components/WorkspacesDropdown';
import { Layout } from '../layouts/Layout';

declare global {
  interface Window {
    workspace: Workspace;
  }
}

const localWorkspace = new Workspace({
  id: 'local-room',
  isSSR: typeof window === 'undefined',
  providers:
    typeof window === 'undefined'
      ? []
      : [DebugDocProvider, IndexedDBDocProvider],
});

localWorkspace.register(AffineSchemas);

const HomeInner = () => {
  const workspace = useBlockSuiteStore(store => store.currentWorkspace);
  useEffect(() => {
    if (!window.workspace) {
      window.workspace = workspace;
    }
  }, [workspace]);
  return (
    <Layout>
      <Navbar isBordered>
        <Navbar.Brand>
          <Text b color="inherit" hideIn="xs">
            BlockSuite
          </Text>
        </Navbar.Brand>
        <Navbar.Content>
          <WorkspacesDropdown />
        </Navbar.Content>
      </Navbar>
      <NoSsr>
        <PageManger />
      </NoSsr>
    </Layout>
  );
};

export default function Home() {
  return (
    <BlockSuiteProvider
      createStore={() => createBlockSuiteStore(localWorkspace)}
    >
      <HomeInner />
    </BlockSuiteProvider>
  );
}
