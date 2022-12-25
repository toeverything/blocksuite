import { Workspace } from '@blocksuite/store';

const workspace = new Workspace({
  room: 'test-room',
});

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.workspace = workspace;
}

export default function Home() {
  return <div>hello, world!</div>;
}
