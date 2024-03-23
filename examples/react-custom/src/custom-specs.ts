import { BlockSpec } from '@blocksuite/block-std';
import { AffineReference, ParagraphService } from '@blocksuite/blocks';
import { ElementOrFactory } from '@blocksuite/react';
import type { TemplateResult } from 'lit';
import { CustomPageReference } from './custom-page-reference';
import React from 'react';

type PageReferenceRenderer = (reference: AffineReference) => React.ReactElement;

function patchSpecsWithReferenceRenderer(
  specs: BlockSpec<string>[],
  pageReferenceRenderer: PageReferenceRenderer,
  toLitTemplate: (element: ElementOrFactory) => TemplateResult
) {
  const renderer = (reference: AffineReference) => {
    const node = pageReferenceRenderer(reference);
    return toLitTemplate(node);
  };
  return specs.map(spec => {
    if (
      ['affine:paragraph', 'affine:list', 'affine:database'].includes(
        spec.schema.model.flavour
      )
    ) {
      // todo: remove these type assertions
      spec.service = class extends (spec.service as typeof ParagraphService) {
        override mounted() {
          super.mounted();
          this.referenceNodeConfig.setCustomContent(renderer);
        }
      };
    }

    return spec;
  });
}

export function patchSpecs(
  specs: BlockSpec<string>[],
  toLitTemplate: (element: ElementOrFactory) => TemplateResult
) {
  let newSpecs = specs;
  newSpecs = patchSpecsWithReferenceRenderer(
    newSpecs,
    (reference: AffineReference) =>
      React.createElement(CustomPageReference, {
        reference,
      }),
    toLitTemplate
  );
  return newSpecs;
}
