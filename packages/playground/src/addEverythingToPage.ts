import type { PageBlockModel } from '@blocksuite/blocks';
import { init } from './init-helper';

export const addEverythingToPage = (page: PageBlockModel) =>
  init.fromModel(page).self(page => {
    page.addChild('affine:group', {}).self(group => {
      group.addChild('affine:paragraph', { type: 'h2' }).withText('Headings');

      const sampleText = addEverythingToPage
        .toString()
        .replace(/[^\w]+/g, ' ')
        .slice(0, 240)
        .trim();

      group
        .addChild('affine:paragraph', { type: 'h1' })
        .withText('Heading 1 with trailing text');
      group.addChild('affine:paragraph', { type: 'text' }).withText(sampleText);
      group
        .addChild('affine:paragraph', { type: 'h2' })
        .withText('Heading 2 with trailing text');
      group.addChild('affine:paragraph', { type: 'text' }).withText(sampleText);
      group
        .addChild('affine:paragraph', { type: 'h3' })
        .withText('Heading 3 with trailing text');
      group.addChild('affine:paragraph', { type: 'text' }).withText(sampleText);
      group
        .addChild('affine:paragraph', { type: 'h4' })
        .withText('Heading 4 with trailing text');
      group.addChild('affine:paragraph', { type: 'text' }).withText(sampleText);
      group
        .addChild('affine:paragraph', { type: 'h5' })
        .withText('Heading 5 with trailing text');
      group.addChild('affine:paragraph', { type: 'text' }).withText(sampleText);
      group
        .addChild('affine:paragraph', { type: 'h6' })
        .withText('Heading 6 with trailing text');
      group.addChild('affine:paragraph', { type: 'text' }).withText(sampleText);

      group.addChild('affine:paragraph', { type: 'h2' }).withText('Quote');
      group
        .addChild('affine:paragraph', { type: 'quote' })
        .withText('Quote with ' + sampleText);

      group
        .addChild('affine:paragraph', { type: 'h2' })
        .withText('Text attributes');

      group
        .addChild('affine:paragraph')
        .withText('Some text, in ')
        .withText('bold, ', { bold: true })
        .withText('italic, ', { italic: true })
        .withText('bold-italic', { bold: true, italic: true })
        .withText('!', {});

      group.addChild('affine:paragraph', { type: 'h2' }).withText('Lists');

      group.addChild('affine:paragraph', { type: 'h3' }).withText('List');

      for (let i = 0; i < 3; i++) {
        group.addChild('affine:list').withText(`List item #${i + 1}`);
      }

      group.addChild('affine:paragraph', { type: 'h3' }).withText('Todo items');

      for (let i = 0; i < 3; i++) {
        group
          .addChild('affine:list', { type: 'todo' })
          .withText(`Todo item #${i + 1}`);
      }

      group
        .addChild('affine:paragraph', { type: 'h3' })
        .withText('Numbered items');

      for (let i = 0; i < 3; i++) {
        group
          .addChild('affine:list', { type: 'numbered' })
          .withText(`Numbered item #${i + 1}`);
      }

      group
        .addChild('affine:paragraph', { type: 'h3' })
        .withText('Just the headings');

      group.addChild('affine:paragraph', { type: 'h1' }).withText('Heading 1');
      group.addChild('affine:paragraph', { type: 'h2' }).withText('Heading 2');
      group.addChild('affine:paragraph', { type: 'h3' }).withText('Heading 3');
      group.addChild('affine:paragraph', { type: 'h4' }).withText('Heading 4');
      group.addChild('affine:paragraph', { type: 'h5' }).withText('Heading 5');
      group.addChild('affine:paragraph', { type: 'h6' }).withText('Heading 6');
    });
  });
