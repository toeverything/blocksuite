import type { EditorHost } from '@blocksuite/block-std';
import type { EdgelessRootService } from '@blocksuite/blocks';
import type { BlockSnapshot } from '@blocksuite/store';

import { markdownToSnapshot } from '../_common/markdown-utils.js';
import { getSurfaceElementFromEditor } from '../_common/selection-utils.js';
import {
  basicTheme,
  type PPTDoc,
  type PPTSection,
  type TemplateImage,
} from './template.js';

export const PPTBuilder = (host: EditorHost) => {
  const service = host.spec.getService<EdgelessRootService>('affine:page');
  const docs: PPTDoc[] = [];
  const contents: unknown[] = [];
  const allImages: TemplateImage[][] = [];

  const addDoc = async (block: BlockSnapshot) => {
    const sections = block.children.map(v => {
      const title = getText(v);
      const keywords = getText(v.children[0]);
      const content = getText(v.children[1]);
      return {
        title,
        keywords,
        content,
      } satisfies PPTSection;
    });
    const doc: PPTDoc = {
      isCover: docs.length === 0,
      title: getText(block),
      sections,
    };
    docs.push(doc);

    if (doc.isCover) return;
    const job = service.createTemplateJob('template');
    const { images, content } = await basicTheme(doc);
    contents.push(content);
    allImages.push(images);
    if (images.length) {
      await Promise.all(
        images.map(({ id, url }) =>
          fetch(url)
            .then(res => res.blob())
            .then(blob => job.job.assets.set(id, blob))
        )
      );
    }
    await job.insertTemplate(content);
    getSurfaceElementFromEditor(host).refresh();
  };

  return {
    process: async (text: string) => {
      const snapshot = await markdownToSnapshot(text, host);

      const block = snapshot.snapshot.content[0];
      for (let i = 0; i < block.children.length; i++) {
        await addDoc(block.children[i]);
        const { centerX, centerY, zoom } = service.getFitToScreenData();
        service.viewport.setViewport(zoom, [centerX, centerY]);
      }
      return { contents, images: allImages };
    },
    done: async (text: string) => {
      const snapshot = await markdownToSnapshot(text, host);
      const block = snapshot.snapshot.content[0];
      await addDoc(block.children[block.children.length - 1]);
    },
  };
};

const getText = (block: BlockSnapshot) => {
  // @ts-ignore
  return block.props.text?.delta?.[0]?.insert ?? '';
};
