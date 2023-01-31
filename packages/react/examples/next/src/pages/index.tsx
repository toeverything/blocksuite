import { useBlockSuiteStore } from '@blocksuite/react';
import { useEffect } from 'react';
import { NoSsr } from '../components/NoSsr';
import { PageManger } from '../components/PageManger';
import { Layout } from '../layouts/Layout';
import { Navbar, Text } from '@nextui-org/react';
import { WorkspacesDropdown } from '../components/WorkspacesDropdown';
import type { Workspace } from '@blocksuite/store';

declare global {
  interface Window {
    workspace: Workspace;
  }
}

export default function Home() {
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
}
