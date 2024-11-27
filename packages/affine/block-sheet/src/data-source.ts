import type { SheetBlockModel } from '@blocksuite/affine-model';

export const sheetInitTemplate = (model: SheetBlockModel) => {
  for (let i = 0; i < 3; i++) {
    const rowId = model.doc.addBlock('affine:sheet-row', {}, model.id);
    for (let u = 0; u < 2; u++) {
      const cellId = model.doc.addBlock('affine:sheet-cell', {}, rowId);
      model.doc.addBlock(
        'affine:paragraph',
        {
          text: new model.doc.Text(`Cell...`),
        },
        cellId
      );
    }
  }
};
