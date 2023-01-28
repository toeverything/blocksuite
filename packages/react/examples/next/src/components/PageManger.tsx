import dynamic from 'next/dynamic';
import { type EditorProps, useBlockSuiteStore } from '@blocksuite/react';
import { Button, Card, Grid, Text } from '@nextui-org/react';
import { Box } from './Box';

const Editor: React.ComponentType<EditorProps> = dynamic(
  async () => (await import('@blocksuite/react/editor')).Editor,
  {
    ssr: false,
  }
);

const presetMarkdown = `This playground is designed to:

* 📝 Test basic editing experience.
* ⚙️ Serve as E2E test entry.
* 🔗 Demonstrate how BlockSuite reconciles real-time collaboration with [local-first](https://martin.kleppmann.com/papers/local-first.pdf) data ownership.

## Controlling Playground Data Source
You might initially enter this page with the \`?init\` URL param. This is the default (opt-in) setup that automatically loads this built-in article. Meanwhile, you'll connect to a random single-user room via a WebRTC provider by default. This is the "single-user mode" for local testing.

To test real-time collaboration, you can specify the room to join by adding the \`?room=foo\` config - Try opening this page with \`?room=foo\` in two different tabs and see what happens!

> Note that the second and subsequent users should not open the page with the \`?init\` param in this case. Also, due to the P2P nature of WebRTC, as long as there is at least one user connected to the room, the content inside the room will **always** exist.

If you are the only user in the room, your content will be lost after refresh. This is great for local debugging. But if you want local persistence, you can open this page with the \`?providers=indexeddb&room=foo\` config, then click the init button in the bottom-left corner to initialize this default content.

As a pro tip, you can combine multiple providers! For example, feel free to open this page with \`?providers=indexeddb,webrtc&room=hello\` params, and see if everything works as expected. Have fun!

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
          page={currentPage}
          onInit={async (page, editor) => {
            const pageBlockId = page.addBlockByFlavour('affine:page', {
              title: 'Welcome to BlockSuite playground',
            });
            page.addBlockByFlavour('affine:surface', {}, null);
            const frameId = page.addBlockByFlavour(
              'affine:frame',
              {},
              pageBlockId
            );
            // Import preset markdown content inside frame block
            await editor.clipboard.importMarkdown(presetMarkdown, frameId);
            page.resetHistory();
          }}
        />
      </Box>
    </Box>
  );
};
