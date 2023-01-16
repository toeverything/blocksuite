import { useBlockSuiteStore } from '@blocksuite/react';
import dynamic from 'next/dynamic';
import type { Page } from '@blocksuite/store';
import { Button, Card, Grid, Text } from '@nextui-org/react';
import { Box } from './Box';

const Editor: React.ComponentType<{
  page: Page;
  // @ts-ignore
}> = dynamic(async () => (await import('@blocksuite/react/editor')).Editor, {
  ssr: false,
});

export const PageManger = () => {
  const pages = useBlockSuiteStore(store => store.pages);
  const currentPage = useBlockSuiteStore(store => store.currentPage);
  const createPage = useBlockSuiteStore(store => store.createPage);
  const deletePage = useBlockSuiteStore(store => store.deletePage);
  const setCurrentPage = useBlockSuiteStore(store => store.setCurrentPage);
  if (!currentPage) {
    return (
      <>
        <Button
          css={{
            mt: '1rem',
            ml: '1rem',
          }}
          onClick={() => {
            createPage();
          }}
        >
          Add Page
        </Button>
        <Grid.Container gap={2}>
          {pages.map(page => {
            return (
              // @ts-ignore
              <Grid sx={4} key={page.id}>
                <Card
                  isPressable
                  isHoverable
                  variant="bordered"
                  onClick={() => {
                    setCurrentPage(page);
                  }}
                >
                  <Card.Body>
                    <Text>{page.id}</Text>
                  </Card.Body>
                </Card>
              </Grid>
            );
          })}
        </Grid.Container>
      </>
    );
  }
  return (
    <Box>
      <Grid.Container gap={2}>
        <Button
          css={{
            mt: '1rem',
            ml: '1rem',
          }}
          onClick={() => setCurrentPage(null)}
        >
          Back to list
        </Button>
        <Button
          css={{
            mt: '1rem',
            ml: '1rem',
          }}
          color="error"
          onClick={() => deletePage(currentPage.id)}
        >
          Delete Page
        </Button>
      </Grid.Container>
      <Box
        css={{
          marginTop: '1rem',
          height: '1px',
          width: '100%',
          maxWidth: '100%',
          background: 'var(--nextui-colors-border)',
        }}
      />
      <Box css={{ bg: 'white' }}>
        <Editor page={currentPage} />
      </Box>
    </Box>
  );
};
