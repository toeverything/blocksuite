import { type EditorProps, useBlockSuiteStore } from '@blocksuite/react';
import { Button, Card, Grid, Text } from '@nextui-org/react';
import dynamic from 'next/dynamic';

import { Box } from './Box';

const Editor: React.ComponentType<EditorProps> = dynamic(
  () => import('@blocksuite/react/editor'),
  {
    ssr: false,
  }
);

const presetMarkdown = `This example is designed to:

* ⚛️ Test react binding with BlockSuite.

For any feedback, please visit [BlockSuite issues](https://github.com/toeverything/blocksuite/issues) 📍`;

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
        <Editor
          page={() => currentPage}
          onInit={async (page, editor) => {
            const pageBlockId = page.addBlockByFlavour('affine:page', {
              title: new page.Text('Welcome to BlockSuite React example'),
            });
            page.addBlockByFlavour('affine:surface', {}, null);
            const frameId = page.addBlockByFlavour(
              'affine:frame',
              {},
              pageBlockId
            );
            // Import preset markdown content inside frame block
            await editor.contentParser.importMarkdown(presetMarkdown, frameId);
            page.resetHistory();
          }}
        />
      </Box>
    </Box>
  );
};
