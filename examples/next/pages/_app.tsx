import type { AppProps } from 'next/app';
import { BlockSuiteProvider, createBlockSuiteStore } from '@blocksuite/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <BlockSuiteProvider
      createStore={() =>
        createBlockSuiteStore({
          room: 'default-room',
        })
      }
    >
      <Component {...pageProps} />
    </BlockSuiteProvider>
  );
}
