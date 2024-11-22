import type { ConnectorElementModel } from '@blocksuite/affine-model';
import type { SurfaceBlockProps } from '@blocksuite/block-std/gfx';

import { SurfaceBlockModel as BaseSurfaceModel } from '@blocksuite/block-std/gfx';
import { DisposableGroup } from '@blocksuite/global/utils';
import { defineBlockSchema, DocCollection } from '@blocksuite/store';

import { elementsCtorMap } from './element-model/index.js';
import { SurfaceBlockTransformer } from './surface-transformer.js';
import { connectorWatcher } from './watchers/connector.js';
import { groupRelationWatcher } from './watchers/group.js';

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  props: (internalPrimitives): SurfaceBlockProps => ({
    elements: internalPrimitives.Boxed(new DocCollection.Y.Map()),
  }),
  metadata: {
    version: 5,
    role: 'hub',
    parent: ['affine:page'],
    children: [
      'affine:frame',
      'affine:image',
      'affine:bookmark',
      'affine:attachment',
      'affine:embed-*',
      'affine:edgeless-text',
    ],
  },
  transformer: () => new SurfaceBlockTransformer(),
  toModel: () => new SurfaceBlockModel(),
});

export type SurfaceMiddleware = (surface: SurfaceBlockModel) => () => void;

export class SurfaceBlockModel extends BaseSurfaceModel {
  private _disposables: DisposableGroup = new DisposableGroup();

  override _init() {
    this._extendElement(elementsCtorMap);
    super._init();
    [connectorWatcher(this), groupRelationWatcher(this)].forEach(disposable =>
      this._disposables.add(disposable)
    );
  }

  getConnectors(id: string) {
    const connectors = this.getElementsByType(
      'connector'
    ) as unknown[] as ConnectorElementModel[];

    return connectors.filter(
      connector => connector.source?.id === id || connector.target?.id === id
    );
  }

  override getElementsByType<K extends keyof BlockSuite.SurfaceElementModelMap>(
    type: K
  ): BlockSuite.SurfaceElementModelMap[K][] {
    return super.getElementsByType(
      type
    ) as BlockSuite.SurfaceElementModelMap[K][];
  }
}
