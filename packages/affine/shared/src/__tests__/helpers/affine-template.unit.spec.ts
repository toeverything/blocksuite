import { describe, expect, it } from 'vitest';

import { affine } from './affine-template';

describe('helpers/affine-template', () => {
  it('should create a basic document structure from template', () => {
    const host = affine`
      <affine-page id="page">
        <affine-note id="note">
          <affine-paragraph id="paragraph-1">Hello, world</affine-paragraph>
        </affine-note>
      </affine-page>
    `;

    expect(host.doc).toBeDefined();

    const pageBlock = host.doc.getBlock('page');
    expect(pageBlock).toBeDefined();
    expect(pageBlock?.flavour).toBe('affine:page');

    const noteBlock = host.doc.getBlock('note');
    expect(noteBlock).toBeDefined();
    expect(noteBlock?.flavour).toBe('affine:note');

    const paragraphBlock = host.doc.getBlock('paragraph-1');
    expect(paragraphBlock).toBeDefined();
    expect(paragraphBlock?.flavour).toBe('affine:paragraph');
  });

  it('should handle nested blocks correctly', () => {
    const host = affine`
      <affine-page>
        <affine-note>
          <affine-paragraph>First paragraph</affine-paragraph>
          <affine-list>List item</affine-list>
          <affine-paragraph>Second paragraph</affine-paragraph>
        </affine-note>
      </affine-page>
    `;

    const noteBlocks = host.doc.getBlocksByFlavour('affine:note');
    const paragraphBlocks = host.doc.getBlocksByFlavour('affine:paragraph');
    const listBlocks = host.doc.getBlocksByFlavour('affine:list');

    expect(noteBlocks.length).toBe(1);
    expect(paragraphBlocks.length).toBe(2);
    expect(listBlocks.length).toBe(1);

    const noteBlock = noteBlocks[0];
    const noteChildren = host.doc.getBlock(noteBlock.id)?.model.children || [];
    expect(noteChildren.length).toBe(3);

    expect(noteChildren[0].flavour).toBe('affine:paragraph');
    expect(noteChildren[1].flavour).toBe('affine:list');
    expect(noteChildren[2].flavour).toBe('affine:paragraph');
  });

  it('should handle empty blocks correctly', () => {
    const host = affine`
      <affine-page>
        <affine-note>
          <affine-paragraph></affine-paragraph>
        </affine-note>
      </affine-page>
    `;

    const paragraphBlocks = host.doc.getBlocksByFlavour('affine:paragraph');
    expect(paragraphBlocks.length).toBe(1);

    const paragraphBlock = host.doc.getBlock(paragraphBlocks[0].id);
    const paragraphText = paragraphBlock?.model.text?.toString() || '';
    expect(paragraphText).toBe('');
  });

  it('should throw error on invalid template', () => {
    expect(() => {
      affine`
        <unknown-tag></unknown-tag>
      `;
    }).toThrow();
  });
});
