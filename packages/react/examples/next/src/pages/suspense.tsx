import { builtInSchemas } from '@blocksuite/blocks/models';
import type { EditorProps } from '@blocksuite/react/editor';
import { Page, Workspace } from '@blocksuite/store';
import dynamic from 'next/dynamic';

import { Layout } from '../layouts/Layout';

const Editor: React.ComponentType<EditorProps> = dynamic(
  () => import('@blocksuite/react/editor').then(module => module.Editor),
  {
    ssr: false,
    loading: () => <Loading />,
  }
);

const localWorkspace = new Workspace({
  room: 'suspense',
  providers: [],
  isSSR: typeof window === 'undefined',
});

localWorkspace.register(builtInSchemas);

const promise = new Promise<Page>(resolve => {
  localWorkspace.slots.pageAdded.once(pageId => {
    const page = localWorkspace.getPage(pageId) as Page;
    setTimeout(() => {
      pagePromiseLike = page;
      console.log('resolve', page);
      resolve(page);
    }, 5000);
  });
  localWorkspace.createPage('0');
});

let pagePromiseLike: Promise<Page> | Page = promise;

const Loading = () => {
  return <div>Loading editor after 5 seconds...</div>;
};

const SuspensePage = () => {
  return (
    <Layout>
      <Editor page={() => pagePromiseLike} />
    </Layout>
  );
};

export default SuspensePage;
