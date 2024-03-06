import { EditorProvider } from './components/EditorProvider';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { EditorContainer } from './components/EditorContainer';
import './index.css';

function App() {
  return (
    <EditorProvider>
      <div class="app">
        <Sidebar />
        <div class="main-content">
          <TopBar />
          <EditorContainer />
        </div>
      </div>
    </EditorProvider>
  );
}

export default App;
