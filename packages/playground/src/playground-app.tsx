import React, { useCallback } from 'react';
import { CounterBlock } from '@building-blocks/blocks';
import { createComponent, type EventName } from '@lit-labs/react';

const CounterBlockComponent = createComponent(
  React,
  'counter-block',
  CounterBlock,
  {
    onUpdate: 'block-count-update' as EventName<CustomEvent<number>>,
  }
);

export function App() {
  const onUpdate = useCallback((e: CustomEvent<number>) => {
    console.log('new count', e.detail);
  }, []);

  return (
    <div>
      <CounterBlockComponent onUpdate={onUpdate} />
    </div>
  );
}
