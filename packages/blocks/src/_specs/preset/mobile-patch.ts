import type { Container } from '@blocksuite/global/di';

import {
  type ReferenceNodeConfig,
  ReferenceNodeConfigIdentifier,
} from '@blocksuite/affine-components/rich-text';
import {
  type BlockStdScope,
  ConfigIdentifier,
  LifeCycleWatcher,
  WidgetViewMapIdentifier,
  type WidgetViewMapType,
} from '@blocksuite/block-std';

import type { CodeBlockConfig } from '../../code-block/code-block-config.js';

import { AFFINE_EMBED_CARD_TOOLBAR_WIDGET } from '../../root-block/widgets/embed-card-toolbar/embed-card-toolbar.js';
import { AFFINE_FORMAT_BAR_WIDGET } from '../../root-block/widgets/format-bar/format-bar.js';
import { AFFINE_SLASH_MENU_WIDGET } from '../../root-block/widgets/slash-menu/index.js';

export class MobileSpecsPatches extends LifeCycleWatcher {
  static override key = 'mobile-patches';

  constructor(std: BlockStdScope) {
    super(std);

    std.doc.awarenessStore.setFlag('enable_mobile_keyboard_toolbar', true);
    std.doc.awarenessStore.setFlag('enable_mobile_linked_doc_menu', true);
  }

  static override setup(di: Container) {
    super.setup(di);

    // Hide reference popup on mobile.
    {
      const prev = di.getFactory(ReferenceNodeConfigIdentifier);
      di.override(ReferenceNodeConfigIdentifier, provider => {
        return {
          ...prev?.(provider),
          hidePopup: true,
        } satisfies ReferenceNodeConfig;
      });
    }

    // Hide number lines for code block on mobile.
    {
      const codeConfigIdentifier = ConfigIdentifier('affine:code');
      const prev = di.getFactory(codeConfigIdentifier);
      di.override(codeConfigIdentifier, provider => {
        return {
          ...prev?.(provider),
          showLineNumbers: false,
        } satisfies CodeBlockConfig;
      });
    }

    // Disable root level widgets for mobile.
    {
      const rootWidgetViewMapIdentifier =
        WidgetViewMapIdentifier('affine:page');

      const prev = di.getFactory(rootWidgetViewMapIdentifier);

      di.override(rootWidgetViewMapIdentifier, provider => {
        const ignoreWidgets = [
          AFFINE_FORMAT_BAR_WIDGET,
          AFFINE_EMBED_CARD_TOOLBAR_WIDGET,
          AFFINE_SLASH_MENU_WIDGET,
        ];

        const newMap = { ...prev?.(provider) };

        ignoreWidgets.forEach(widget => {
          if (widget in newMap) delete newMap[widget];
        });

        return newMap;
      });
    }

    // Disable block level toolbar widgets for mobile.
    {
      di.override(
        WidgetViewMapIdentifier('affine:code'),
        (): WidgetViewMapType => ({})
      );

      di.override(
        WidgetViewMapIdentifier('affine:image'),
        (): WidgetViewMapType => ({})
      );

      di.override(
        WidgetViewMapIdentifier('affine:surface-ref'),
        (): WidgetViewMapType => ({})
      );
    }
  }

  override mounted() {
    // remove slash placeholder for mobile: `type / ...`
    {
      const paragraphService = this.std.getService('affine:paragraph');
      if (!paragraphService) return;

      paragraphService.placeholderGenerator = model => {
        const placeholders = {
          text: '',
          h1: 'Heading 1',
          h2: 'Heading 2',
          h3: 'Heading 3',
          h4: 'Heading 4',
          h5: 'Heading 5',
          h6: 'Heading 6',
          quote: '',
        };
        return placeholders[model.type];
      };
    }
  }
}
