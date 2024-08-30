import type { WidgetViewMapType } from '../spec/type.js';
import type { ExtensionType } from './extension.js';

import { WidgetViewMapIdentifier } from '../identifier.js';

export function WidgetViewMapExtension(
  flavour: BlockSuite.Flavour,
  widgetViewMap: WidgetViewMapType
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(WidgetViewMapIdentifier(flavour), () => widgetViewMap);
    },
  };
}
