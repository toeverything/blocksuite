import { download, upload } from '../editor/utils';
import { useEditor } from '../editor/context';

const TopBar = () => {
  const { provider, updateCollection } = useEditor()!;

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
          if (!provider) return;
          const blob = await upload();
          await provider.reset(blob);
          updateCollection(provider.collection);
        }}
      >
        Import
      </button>
    </div>
  );
};

export default TopBar;
