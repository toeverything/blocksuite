import { useBlockSuiteStore } from '@blocksuite/react';
import { useEffect, useState } from 'react';
import { NoSsr } from '../components/NoSsr';
import { WorkspaceManager } from '../components/WorkspaceManager';
import { PageManger } from '../components/PageManger';

export default function Home() {
  const workspace = useBlockSuiteStore(store => store.currentWorkspace);
  const [panel, setPanel] = useState<'page' | 'workspace'>('workspace');
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
      your selected workspace detail{' '}
      <NoSsr>
        {workspace.room} {workspace.doc.guid}
      </NoSsr>
      <button
        onClick={() =>
          setPanel(state => (state === 'page' ? 'workspace' : 'page'))
        }
      >
        switch
      </button>
      <hr />
      {panel === 'workspace' ? (
        <NoSsr>
          <WorkspaceManager />
        </NoSsr>
      ) : (
        <NoSsr>
          <PageManger />
        </NoSsr>
      )}
    </div>
  );
}
