import EditorContainer from './components/EditorContainer';
import { EditorProvider } from './components/EditorProvider';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import './index.css';

export function App() {
  return (
    <EditorProvider>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <TopBar />
          <EditorContainer />
        </div>
      </div>
    </EditorProvider>
  );
}
