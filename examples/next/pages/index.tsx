import { useBlockSuiteStore } from '@blocksuite/react';
import { useEffect } from 'react';
import { NoSsr } from '../components/NoSsr';

export default function Home() {
  const workspace = useBlockSuiteStore(store => store.currentWorkspace);
  useEffect(() => {
    console.log('workspace', workspace);
    // @ts-ignore
    if (!window.workspace) {
      // @ts-ignore
      window.workspace = workspace;
    }
  }, [workspace]);
  return (
    <div>
      your client id is <NoSsr>{workspace.doc.clientID}</NoSsr>
    </div>
  );
}
