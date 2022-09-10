import { useState } from 'react';
import { hello } from '@building-blocks/blocks';

export function App() {
  const [count, setCount] = useState(hello());

  return <div onClick={() => setCount(count + 1)}>{count}</div>;
}
