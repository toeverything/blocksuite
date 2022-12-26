import { useBlockSuiteStore } from '@blocksuite/react';
import { IndexedDBDocProvider, uuidv4, Workspace } from '@blocksuite/store';
import { BlockSchema } from '@blocksuite/blocks/models';

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
          const workspace = new Workspace({
            room: 'random:' + uuidv4(),
            providers: [IndexedDBDocProvider],
          });
          workspace.register(BlockSchema);
          addWorkspace(workspace);
        }}
      >
        add a workspace
      </button>
      <div>current workspace room id: {currentWorkspace.room}</div>
      <ul>
        {workspaces.map(workspace => {
          return (
            <li key={workspace.doc.guid}>
              {workspace.room}
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
