import type { EditorHost } from '@blocksuite/block-std';
import type { EdgelessRootService } from '@blocksuite/blocks';
import type { BlockSnapshot } from '@blocksuite/store';

import { markdownToSnapshot } from '../_common/markdown-utils.js';
import { getSurfaceElementFromEditor } from '../_common/selection-utils.js';
import { basicTheme } from '../slides/template.js';

type PPTSection = {
  content: string;
  keywords: string;
  title: string;
};

type PPTDoc = {
  isCover: boolean;
  sections: PPTSection[];
  title: string;
};

export const PPTBuilder = (host: EditorHost) => {
  const service = host.spec.getService<EdgelessRootService>('affine:page');
  const docs: PPTDoc[] = [];
  let done = false;
  const addDoc = async (block: BlockSnapshot) => {
    const sections = block.children.map(v => {
      const title = getText(v);
      const keywords = getText(v.children[0]);
      const content = getText(v.children[1]);
      return {
        content,
        keywords,
        title,
      } satisfies PPTSection;
    });
    const doc: PPTDoc = {
      isCover: docs.length === 0,
      sections,
      title: getText(block),
    };
    docs.push(doc);

    if (doc.sections.length !== 3 || doc.isCover) return;
    if (done) return;
    done = true;
    const job = service.createTemplateJob('template');
    const { content, images } = await basicTheme(doc);

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
    done: async (text: string) => {
      const snapshot = await markdownToSnapshot(text, host);
      const block = snapshot.snapshot.content[0];
      await addDoc(block.children[block.children.length - 1]);
    },
    process: async (text: string) => {
      const snapshot = await markdownToSnapshot(text, host);

      const block = snapshot.snapshot.content[0];
      for (let i = 0; i < block.children.length; i++) {
        await addDoc(block.children[i]);
        const { centerX, centerY, zoom } = service.getFitToScreenData();
        service.viewport.setViewport(zoom, [centerX, centerY]);
      }
    },
  };
};

const getText = (block: BlockSnapshot) => {
  // @ts-ignore
  return block.props.text?.delta?.[0]?.insert ?? '';
};
