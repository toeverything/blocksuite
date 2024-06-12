import { assertExists, assertNotExists } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/store';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { PieMenuId } from '../../types.js';
import type { PieMenuSchema } from './base.js';

/**
 *   Static class for managing pie menus
 */

export class PieManager {
  private static schemas = new Set<PieMenuSchema>();

  private static registeredSchemas: Record<string, PieMenuSchema> = {};

  static settings = {
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

    /**
     * Distance from the center of the active node to start focusing a child node
     */
    ACTIVATE_THRESHOLD_MIN: 60,

    /**
     * Time delay to open submenu after hovering a submenu node
     */
    SUBMENU_OPEN_TIMEOUT: 200,

    EXPANDABLE_ACTION_NODE_TIMEOUT: 300,
  };

  static slots = {
    open: new Slot<PieMenuSchema>(),
  };

  private static _setupTriggers(rootElement: EdgelessRootBlockComponent) {
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

  private static _register(schema: PieMenuSchema) {
    const { id } = schema;

    assertNotExists(
      this.registeredSchemas[id],
      `Menu with id '${id}' already exists. Please provide a unique id`
    );

    this.registeredSchemas[id] = schema;
  }

  private static _getSchema(id: string) {
    const schema = this.registeredSchemas[id];
    assertExists(schema);
    return schema;
  }

  static add(schema: PieMenuSchema) {
    return this.schemas.add(schema);
  }

  static remove(schema: PieMenuSchema) {
    return this.schemas.delete(schema);
  }

  static setup({ rootElement }: { rootElement: EdgelessRootBlockComponent }) {
    this.schemas.forEach(schema => this._register(schema));
    this._setupTriggers(rootElement);
  }

  static dispose() {
    this.registeredSchemas = {};
  }

  static open(id: PieMenuId) {
    this.slots.open.emit(this._getSchema(id));
  }
}
