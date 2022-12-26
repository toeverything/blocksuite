import type { AppProps } from 'next/app';
import { BlockSuiteProvider, createBlockSuiteStore } from '@blocksuite/react';
import { Workspace } from '@blocksuite/store';
import { IndexedDBDocProvider } from '@blocksuite/store';

const localWorkspace = new Workspace({
  room: 'local-room',
  isSSR: typeof window === 'undefined',
  providers: typeof window === 'undefined' ? [] : [IndexedDBDocProvider],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <BlockSuiteProvider
      createStore={() => createBlockSuiteStore(localWorkspace)}
    >
      <Component {...pageProps} />
    </BlockSuiteProvider>
  );
}
