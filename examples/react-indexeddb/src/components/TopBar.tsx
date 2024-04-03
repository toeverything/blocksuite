import { download, upload } from '../editor/utils';
import { useEditor } from '../editor/context';
import { CollectionProvider } from '../editor/provider/provider';

const TopBar = () => {
  const { provider, updateProvider, editor } = useEditor()!;

  return (
    <div className="top-bar">
      <button
        onClick={async () => {
          if (!provider) return;
          download(await provider.export(), 'data.db');
        }}
      >
        Export
      </button>
      <button
        onClick={async () => {
          if (!editor) return;
          const binary = await upload();
          const provider = await CollectionProvider.init(binary);
          updateProvider(provider);
          editor.doc = [...provider.collection.docs.values()][0];
        }}
      >
        Import
      </button>
    </div>
  );
};

export default TopBar;
