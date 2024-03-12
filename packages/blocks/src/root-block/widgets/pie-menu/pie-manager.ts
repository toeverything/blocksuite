import { assertExists, assertNotExists } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/store';

import type { RootBlockComponent } from '../../types.js';
import type { IPieMenuSchema } from './base.js';
import type { AffinePieMenuWidget } from './index.js';
import { PieMenu } from './menu.js';

/**
 *  A static class for managing pie menus
 */

export type PieMenuCreateOptions = {
  x: number;
  y: number;
  widgetElement: AffinePieMenuWidget;
};

export class PieManager {
  private static schemas: Set<IPieMenuSchema> = new Set();
  // If somebody wants to invoke a menu with a button without using the trigger key we can use this with open function
  private static registeredSchemas: Record<string, IPieMenuSchema> = {};

  public static abortController = new AbortController();
  public static settings = {
    /**
     * Specifies the distance between the root-node and the child-nodes
     */
    PIE_RADIUS: 150,
    /**
     * After the specified time if trigger is released the menu will select the currently hovered node\
     * If released before the time the pie menu will stay open and you can select with mouse or the trigger key\
     * Time is in `milliseconds`
     * @default 150
     */
    SELECT_ON_RELEASE_TIMEOUT: 150,
  };

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

  public static open(id: string) {
    this.slots.openPie.emit(this._getSchema(id));
  }

  public static close() {
    this.abortController.abort();
  }

  public static createMenu(
    schema: IPieMenuSchema,
    { x, y, widgetElement }: PieMenuCreateOptions
  ) {
    const menu = new PieMenu();
    menu.id = schema.id;
    menu.schema = schema;
    menu.position = [x, y];
    menu.rootElement = widgetElement.rootElement;
    menu.widgetElement = widgetElement;
    menu.abortController.signal.addEventListener('abort', () => {
      this.slots.closePie.emit();
    });

    this.abortController = menu.abortController;
    return menu;
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
