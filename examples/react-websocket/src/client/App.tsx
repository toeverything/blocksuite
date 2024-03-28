import { EditorProvider } from './components/EditorProvider.js';
import Sidebar from './components/Sidebar.js';
import TopBar from './components/TopBar.js';
import EditorContainer from './components/EditorContainer.js';
import './index.css';

function App() {
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

export default App;
