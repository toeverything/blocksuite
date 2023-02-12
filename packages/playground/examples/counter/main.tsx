import { CounterBlock } from '@blocksuite/blocks';
import { createComponent, type EventName } from '@lit-labs/react';
import * as React from 'react';
import { useCallback } from 'react';
import * as ReactDOM from 'react-dom/client';

const CounterBlockComponent = createComponent(
  React,
  'counter-block',
  CounterBlock,
  {
    onUpdate: 'block-count-update' as EventName<CustomEvent<number>>,
  }
);

function App() {
  const onUpdate = useCallback((e: CustomEvent<number>) => {
    console.log('new count', e.detail);
  }, []);

  return (
    <div>
      <CounterBlockComponent onUpdate={onUpdate} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
