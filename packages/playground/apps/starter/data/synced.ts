import { MarkdownTransformer } from '@blocksuite/blocks';
import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

const syncedPageMarkdown = `We share some of our findings from developing local-first software prototypes at [Ink & Switch](https://www.inkandswitch.com/) over the course of several years. These experiments test the viability of CRDTs in practice, and explore the user interface challenges for this new data model. Lastly, we suggest some next steps for moving towards local-first software: for researchers, for app developers, and a startup opportunity for entrepreneurs.

This article has also been published [in PDF format](https://www.inkandswitch.com/local-first/static/local-first.pdf) in the proceedings of the [Onward! 2019 conference](https://2019.splashcon.org/track/splash-2019-Onward-Essays). Please cite it as:

> Martin Kleppmann, Adam Wiggins, Peter van Hardenberg, and Mark McGranaghan. Local-first software: you own your data, in spite of the cloud. 2019 ACM SIGPLAN International Symposium on New Ideas, New Paradigms, and Reflections on Programming and Software (Onward!), October 2019, pages 154-178. [doi:10.1145/3359591.3359737](https://doi.org/10.1145/3359591.3359737)

We welcome your feedback: [@inkandswitch](https://twitter.com/inkandswitch) or hello@inkandswitch.com.`;

export const synced: InitFn = async (workspace: Workspace, id: string) => {
  const pageMain = workspace.getPage(id) ?? workspace.createPage({ id });
  const pageSyncedPage = workspace.createPage({ id: 'synced-page' });
  const pageSyncedEdgeless = workspace.createPage({ id: 'synced-edgeless' });
  pageMain.clear();
  pageSyncedPage.clear();
  pageSyncedEdgeless.clear();

  await pageSyncedPage.load(async () => {
    // Add page block and surface block at root level
    const pageBlockId = pageSyncedPage.addBlock('affine:page', {
      title: new Text('Synced - Page View'),
    });

    pageSyncedPage.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = pageSyncedPage.addBlock('affine:note', {}, pageBlockId);

    // Add markdown to note block
    await MarkdownTransformer.importMarkdown({
      page: pageSyncedPage,
      noteId,
      markdown: syncedPageMarkdown,
    });
  });

  await pageSyncedEdgeless.load(async () => {
    // Add page block and surface block at root level
    const pageBlockId = pageSyncedEdgeless.addBlock('affine:page', {
      title: new Text('Synced - Edgeless View'),
    });

    pageSyncedEdgeless.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = pageSyncedEdgeless.addBlock('affine:note', {}, pageBlockId);

    // Add markdown to note block
    await MarkdownTransformer.importMarkdown({
      page: pageSyncedEdgeless,
      noteId,
      markdown: syncedPageMarkdown,
    });
  });

  await pageMain.load(async () => {
    // Add page block and surface block at root level
    const pageBlockId = pageMain.addBlock('affine:page', {
      title: new Text('Home page, having synced blocks'),
    });

    const surfaceId = pageMain.addBlock('affine:surface', {}, pageBlockId);
    const noteId = pageMain.addBlock('affine:note', {}, pageBlockId);

    // Add markdown to note block
    await MarkdownTransformer.importMarkdown({
      page: pageMain,
      noteId,
      markdown: syncedPageMarkdown,
    });

    // Add synced block - page view
    pageMain.addBlock(
      'affine:synced',
      {
        pageId: 'synced-page',
      },
      noteId
    );

    // Add synced block - edgeless view
    pageMain.addBlock(
      'affine:synced',
      {
        pageId: 'synced-edgeless',
      },
      noteId
    );

    // Add synced block - page view
    pageMain.addBlock(
      'affine:synced',
      {
        pageId: 'synced-page',
        xywh: '[-1000, 0, 752, 455]',
      },
      surfaceId
    );

    // Add synced block - edgeless view
    pageMain.addBlock(
      'affine:synced',
      {
        pageId: 'synced-edgeless',
        xywh: '[-1000, 500, 752, 455]',
      },
      surfaceId
    );
  });

  pageSyncedEdgeless.resetHistory();
  pageSyncedPage.resetHistory();
  pageMain.resetHistory();
};

synced.id = 'synced';
synced.displayName = 'Synced block demo';
synced.description = 'A simple demo for synced block';
