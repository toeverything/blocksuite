import { useBlockSuiteStore } from '@blocksuite/react';
import dynamic from 'next/dynamic';
import type { Page } from '@blocksuite/store';

const Editor: React.ComponentType<{
  page: Page;
}> = dynamic(
  // @ts-ignore
  async () => (await import('@blocksuite/react/editor')).Editor,
  {
    ssr: false,
  }
);

export const PageManger = () => {
  const pages = useBlockSuiteStore(store => store.pages);
  const currentPage = useBlockSuiteStore(store => store.currentPage);
  const createPage = useBlockSuiteStore(store => store.createPage);
  const setCurrentPage = useBlockSuiteStore(store => store.setCurrentPage);
  if (!currentPage) {
    return (
      <div>
        there is no current page
        <button
          onClick={() => {
            createPage();
          }}
        >
          create one
        </button>
        <ul>
          {pages.map(page => {
            return (
              <li key={page.id}>
                page id: {page.id}
                <button
                  onClick={() => {
                    setCurrentPage(page);
                  }}
                >
                  set current
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return (
    <div>
      <button onClick={() => setCurrentPage(null)}>back to list</button>
      <Editor page={currentPage} />
    </div>
  );
};
