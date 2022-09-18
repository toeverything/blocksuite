import React, { useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { CounterBlockElement } from '@building-blocks/blocks';
import { createComponent, type EventName } from '@lit-labs/react';

const CounterBlockComponent = createComponent(
  React,
  'counter-block-element',
  CounterBlockElement,
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
