import { useBlockSuiteStore } from '@blocksuite/react';
import { useEffect } from 'react';

export default function Home() {
  const workspace = useBlockSuiteStore(store => store.workspace);
  useEffect(() => {
    console.log('workspace', workspace);
    // @ts-ignore
    if (!window.workspace) {
      // @ts-ignore
      window.workspace = workspace;
    }
  }, [workspace]);
  return <div>your client id is {workspace.doc.clientID}</div>;
}
