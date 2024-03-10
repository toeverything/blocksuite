import { assertExists, assertNotExists } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/store';

import type { RootBlockComponent } from '../../types.js';
import type { IPieMenuSchema } from './base.js';

/**
 *  A static class for managing pie menus
 */
export class PieManager {
  private static schemas: Set<IPieMenuSchema> = new Set();

  public static abortController = new AbortController();

  // If somebody wants to invoke a menu with a button without using the trigger key we can use this with open function
  private static registeredSchemas: Record<string, IPieMenuSchema> = {};

  public static slots = {
    openPie: new Slot<IPieMenuSchema>(),
    closePie: new Slot(),
  };

  public static add(schema: IPieMenuSchema) {
    return this.schemas.add(schema);
  }

  public static remove(schema: IPieMenuSchema) {
    return this.schemas.delete(schema);
  }

  public static setup({ rootElement }: { rootElement: RootBlockComponent }) {
    this.schemas.forEach(s => this._register(s, rootElement));
    this._setupTriggers(rootElement);
  }

  public static dispose() {
    this.registeredSchemas = {};
  }

  private static open(id: string) {
    this.slots.openPie.emit(this._getSchema(id));
  }

  private static _setupTriggers(rootElement: RootBlockComponent) {
    Object.values(this.registeredSchemas).forEach(schema => {
      const { trigger } = schema;

      rootElement.handleEvent(
        'keyDown',
        ctx => {
          const ev = ctx.get('keyboardState');

          if (trigger({ keyEvent: ev.raw, rootElement }) && !ev.raw.repeat) {
            this.open(schema.id);
          }
        },
        { global: true }
      );
    });
  }

  private static _register(
    schema: IPieMenuSchema,
    rootElement: RootBlockComponent
  ) {
    if (!this._checkScope(schema, rootElement)) return;

    const { id } = schema;

    assertNotExists(
      this.registeredSchemas[id],
      `Menu with id '${id}' already exists. Please provide a unique id`
    );

    this.registeredSchemas[id] = schema;
  }

  private static _checkScope(
    schema: IPieMenuSchema,
    rootElement: RootBlockComponent
  ) {
    const edgeless = !!schema.scope.edgeless;
    const page = !!schema.scope.page;
    return (
      (edgeless && rootElement.tagName === 'AFFINE-EDGELESS-ROOT') ||
      (page && rootElement.tagName === 'AFFINE-PAGE-ROOT')
    );
  }

  private static _getSchema(id: string) {
    const schema = this.registeredSchemas[id];
    assertExists(schema);
    return schema;
  }
}
