import { useEffect, useState } from 'react';
import { useEditor } from '../editor/context';
import { type ConnectionStatus } from '../editor/provider';

const TopBar = () => {
  const { provider } = useEditor()!;
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    if (!provider) return;

    const disposable = provider.slots.connectStatusChanged.on(setStatus);

    return () => disposable.dispose();
  }, [provider]);

  return (
    <div className="top-bar">
      <div>React Websocket</div>
      <div className={status}>{status} </div>
    </div>
  );
};
export default TopBar;
