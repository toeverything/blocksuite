import { adapted } from '@blocksuite/react';
import { DocCollection, Schema } from '@blocksuite/store';
import './index.css';
import { AffineSchemas, PageEditorBlockSpecs } from '@blocksuite/blocks';

const specs = PageEditorBlockSpecs;
const schema = new Schema().register(AffineSchemas);
const collection = new DocCollection({ schema });
const doc = collection.createDoc({ id: 'page1' });
doc.load(() => {
  const pageBlockId = doc.addBlock('affine:page', {});
  doc.addBlock('affine:surface', {}, pageBlockId);
  const noteId = doc.addBlock('affine:note', {}, pageBlockId);
  doc.addBlock('affine:paragraph', {}, noteId);
});

function App() {
  return (
    <div className="app">
      <adapted.DocEditor doc={doc} specs={specs} />
    </div>
  );
}

export default App;
