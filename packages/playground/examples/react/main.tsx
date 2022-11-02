import { Editor } from '@blocksuite/react';
import * as React from 'react';
import { useCallback } from 'react';
import * as ReactDOM from 'react-dom/client';
import '../../src/style.css';

function App() {
  return (
    <div>
      <Editor />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
