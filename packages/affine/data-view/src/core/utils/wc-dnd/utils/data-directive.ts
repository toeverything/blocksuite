import type { AttributePart } from 'lit';
import { Directive, directive, type PartInfo } from 'lit/directive.js';

export type DataName = {
  dataset: string;
  attribute: string;
};
export const createDataDirective = <T extends DataName[]>(...names: T) => {
  return directive(
    class DraggableDirective extends Directive {
      constructor(partInfo: PartInfo) {
        super(partInfo);
      }

      override render(..._ids: { [K in keyof T]: string }): unknown {
        return;
      }

      override update(part: AttributePart, ids: string[]): unknown {
        names.forEach((name, index) => {
          part.element.dataset[name.dataset] = ids[index];
        });
        return;
      }
    }
  );
};
