import { builtInSchemas } from '@blocksuite/blocks/models';
import {
  DebugDocProvider,
  IndexedDBDocProvider,
  Workspace,
} from '@blocksuite/store';
import { BlockSuiteProvider, createBlockSuiteStore } from '@blocksuite/vue';
import { HomePage } from 'pages/home.jsx';
import { createApp, defineComponent, h } from 'vue';

const localWorkspace = new Workspace({
  room: 'local-room',
  isSSR: typeof window === 'undefined',
  providers:
    typeof window === 'undefined'
      ? []
      : [DebugDocProvider, IndexedDBDocProvider],
});

localWorkspace.register(builtInSchemas);

const App = defineComponent({
  setup() {
    return () => (
      <BlockSuiteProvider
        createStore={() => createBlockSuiteStore(localWorkspace)}
      >
        <HomePage />
      </BlockSuiteProvider>
    );
  },
});

createApp(h(App)).mount('#app');
