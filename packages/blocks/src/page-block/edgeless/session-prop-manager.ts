// import { assertExists, Slot } from '@blocksuite/global/utils';

// import type { EdgelessElementType } from '../../surface-block/edgeless-types.js';
// import type { SurfaceBlockComponent } from '../../surface-block/surface-block.js';
// import { isTopLevelBlock } from './utils/query.js';

// export class SessionPropManager {
//   private _propPath = new Map<EdgelessElementType, string[]>();
//   private _props: Partial<
//     Record<EdgelessElementType, Record<string, unknown>>
//   > = {};

//   slots = {
//     propsChanged: new Slot<{
//       type: EdgelessElementType;
//       props: Record<string, unknown>;
//     }>(),
//   };

//   constructor(
//     private _surface: SurfaceBlockComponent,
//     defaultProps: Partial<
//       Record<EdgelessElementType, Record<string, unknown>>
//     > = {}
//   ) {
//     this._tryLoadProps(defaultProps);

//     this._surface.edgeless.slots.elementUpdated.on(({ id, props = {} }) => {
//       const element = this._surface.pickById(id);
//       assertExists(element, 'element must exist');
//       this.recordProps(
//         (isTopLevelBlock(element)
//           ? element.flavour
//           : element.type) as EdgelessElementType,
//         props
//       );
//     });
//   }

// }
