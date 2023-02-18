// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/editor/themes/affine.css';

import { EditorContainer } from '@blocksuite/editor';
import type { Page } from '@blocksuite/store';
import {
  defineComponent,
  ExtractPropTypes,
  onBeforeUnmount,
  PropType,
  ref,
  watch,
  watchEffect,
} from 'vue';

const editorProps = {
  page: {
    type: Function as PropType<() => Page>,
    required: true,
  },
  onInit: {
    type: Function as PropType<
      (page: Page, editor: Readonly<EditorContainer>) => void
    >,
    required: false,
  },
};

export type EditorProps = ExtractPropTypes<typeof editorProps>;

export const Editor = defineComponent({
  props: editorProps,
  setup(props) {
    const $containerRef = ref<HTMLDivElement>();

    const pageRef = ref<Page>();
    const editorIns: EditorContainer = new EditorContainer();

    watchEffect(() => {
      const maybePage = props.page?.();
      if (pageRef.value === undefined) {
        pageRef.value = maybePage;
      }
    });

    watch(
      () => [pageRef.value, $containerRef.value],
      () => {
        const editor = editorIns;
        if (!editor || !$containerRef.value || !pageRef.value) {
          return;
        }
        const page = pageRef.value;
        editorIns.page = page;
        if (page.root === null) {
          if (props.onInit) {
            props.onInit(page, editor);
          } else {
            const pageBlockId = page.addBlockByFlavour('affine:page');
            const frameId = page.addBlockByFlavour(
              'affine:frame',
              {},
              pageBlockId
            );
            page.addBlockByFlavour('affine:paragraph', {}, frameId);
            page.resetHistory();
          }
        }
      },
      { immediate: true }
    );

    const mountDomDisposer = watch(
      () => [pageRef.value, $containerRef.value],
      () => {
        const editor = editorIns;
        const container = $containerRef.value;

        if (!editor || !container || !pageRef.value) {
          return;
        }

        container.appendChild(editor);

        mountDomDisposer();
      },
      { immediate: true, flush: 'post' }
    );

    onBeforeUnmount(() => {
      const editor = editorIns;
      const container = $containerRef.value;

      if (!editor || !container || !pageRef.value) {
        return;
      }

      container.removeChild(editor);
    });

    watch(
      () => pageRef.value,
      () => {
        const page = pageRef.value;
        if (page && !page.workspace.connected) {
          page.workspace.connect();
        }
      },
      { immediate: true }
    );

    onBeforeUnmount(() => {
      const page = pageRef.value;

      page?.workspace.disconnect();
    });

    return () => {
      // eslint-disable-next-line react/no-unknown-property
      return <div class="editor-wrapper" ref={$containerRef} />;
    };
  },
});
