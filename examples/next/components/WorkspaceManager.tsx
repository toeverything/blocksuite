import { useBlockSuiteStore } from '@blocksuite/react';
import { IndexedDBDocProvider, uuidv4, Workspace } from '@blocksuite/store';

export const WorkspaceManager = () => {
  const currentWorkspace = useBlockSuiteStore(store => store.currentWorkspace);
  const workspaces = useBlockSuiteStore(store => store.workspaces);
  const addWorkspace = useBlockSuiteStore(store => store.addWorkspace);
  const setCurrentWorkspace = useBlockSuiteStore(
    store => store.setCurrentWorkspace
  );
  return (
    <div>
      <button
        onClick={() => {
          addWorkspace(
            new Workspace({
              room: 'random:' + uuidv4(),
              providers: [IndexedDBDocProvider],
            })
          );
        }}
      >
        add a workspace
      </button>
      <div>current workspace guid: {currentWorkspace.doc.guid}</div>
      <ul>
        {workspaces.map(workspace => {
          return (
            <li key={workspace.doc.guid}>
              {workspace.doc.guid}
              <button
                onClick={() => {
                  setCurrentWorkspace(workspace);
                }}
              >
                choose me!
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
