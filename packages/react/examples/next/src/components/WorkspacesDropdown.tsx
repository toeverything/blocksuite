import { AffineSchemas } from '@blocksuite/blocks/models';
import { useBlockSuiteStore } from '@blocksuite/react';
import { IndexedDBDocProvider, uuidv4, Workspace } from '@blocksuite/store';
import { Dropdown } from '@nextui-org/react';
import React from 'react';

export const DisplayRoomName = ({ room }: { room: string | undefined }) => {
  return (
    <>
      {room
        ? room === 'local-room'
          ? 'local-room'
          : room.substring(7, 14)
        : 'local-room'}
    </>
  );
};

export const WorkspacesDropdown = (): React.ReactElement => {
  const currentWorkspace = useBlockSuiteStore(store => store.currentWorkspace);
  const workspaces = useBlockSuiteStore(store => store.workspaces);
  const setCurrentWorkspace = useBlockSuiteStore(
    store => store.setCurrentWorkspace
  );
  const deleteWorkspace = useBlockSuiteStore(store => store.deleteWorkspace);
  const addWorkspace = useBlockSuiteStore(store => store.addWorkspace);
  console.log('current', currentWorkspace.doc.guid);
  return (
    <Dropdown>
      <Dropdown.Button flat id={React.useId()}>
        <DisplayRoomName room={currentWorkspace.id} />
      </Dropdown.Button>
      <Dropdown.Menu
        color="primary"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={new Set([currentWorkspace.id ?? 'local-room'])}
        onSelectionChange={changes => {
          const array = [...changes];
          if (array[0] === 'add-new-one') {
            const workspace = new Workspace({
              id: 'random:' + uuidv4(),
              providers: [IndexedDBDocProvider],
            });
            workspace.register(AffineSchemas);
            addWorkspace(workspace);
            setCurrentWorkspace(workspace);
          } else if (array[0] === 'delete-workspace') {
            if (workspaces.length === 1) {
              return;
            }
            if (currentWorkspace.id === 'local-room') {
              return;
            }
            deleteWorkspace(currentWorkspace);
            setCurrentWorkspace(
              workspaces[0] === currentWorkspace ? workspaces[1] : workspaces[0]
            );
          } else {
            array.forEach(change => {
              const target = workspaces.find(
                workspace => workspace.id === change
              );
              target && setCurrentWorkspace(target);
            });
          }
        }}
      >
        <Dropdown.Section title="actions">
          <Dropdown.Item key="add-new-one" textValue="Add New Workspace">
            Add New Workspace
          </Dropdown.Item>
          <Dropdown.Item
            key="delete-workspace"
            textValue="Delete Current Workspace"
          >
            Delete Current Workspace
          </Dropdown.Item>
        </Dropdown.Section>
        <Dropdown.Section title="workspaces">
          {workspaces.map(workspace => (
            <Dropdown.Item
              key={workspace.id ?? 'local-room'}
              textValue={workspace.id}
            >
              <DisplayRoomName room={workspace.id} />
            </Dropdown.Item>
          ))}
        </Dropdown.Section>
      </Dropdown.Menu>
    </Dropdown>
  );
};
