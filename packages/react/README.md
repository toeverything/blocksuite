# `@blocksuite/react`

## Usage

### Use `@blocksuite/editor`

```tsx
import dynamic from 'next/dynamic';
import { useBlockSuiteStore } from '@blocksuite/react';

export const Editor = dynamic(
  async () => (await import('@blocksuite/react/editor')).Editor,
  {
    ssr: false,
  }
);

export default function Page() {
  const currentPage = useBlockSuiteStore(store => store.currentPage);
  return <Editor page={page} />;
}
```

### Use `@blocksuite/store`

```tsx
// in _app.tsx
import type { AppProps } from 'next/app';
import { BlockSuiteProvider, createBlockSuiteStore } from '@blocksuite/react';
import { Workspace } from '@blocksuite/store';
import { IndexedDBDocProvider } from '@blocksuite/store';

const localWorkspace = new Workspace({
  id: 'local-room',
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
```
