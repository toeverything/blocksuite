import type { IVec } from '@blocksuite/global/utils';

import { EditPropsStore } from '@blocksuite/affine-shared/services';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';

import type { EdgelessTool } from '../../edgeless/types.js';
import type {
  ActionFunction,
  IPieNodeWithAction,
  PieColorNodeModel,
  PieCommandNodeModel,
  PieMenuContext,
  PieNodeModel,
  PieNonRootNode,
  PieRootNodeModel,
  PieSubmenuNodeModel,
} from './base.js';

import { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { ShapeToolController } from '../../edgeless/tools/shape-tool.js';

export function updateShapeOverlay(rootComponent: EdgelessRootBlockComponent) {
  const controller = rootComponent.tools.currentController;
  if (controller instanceof ShapeToolController) {
    controller.createOverlay();
  }
}

export function getActiveShapeColor(type: 'fill' | 'stroke') {
  return ({ rootComponent }: PieMenuContext) => {
    if (rootComponent instanceof EdgelessRootBlockComponent) {
      const props =
        rootComponent.std.get(EditPropsStore).lastProps$.value[
          'shape:roundedRect'
        ];
      const color = type == 'fill' ? props.fillColor : props.strokeColor;
      return ThemeObserver.getColorValue(color);
    }
    return '';
  };
}

export function getActiveConnectorStrokeColor({
  rootComponent,
}: PieMenuContext) {
  if (rootComponent instanceof EdgelessRootBlockComponent) {
    const props =
      rootComponent.std.get(EditPropsStore).lastProps$.value.connector;
    const color = props.stroke;
    return ThemeObserver.getColorValue(color);
  }
  return '';
}

export function setEdgelessToolAction(tool: EdgelessTool): ActionFunction {
  return ({ rootComponent }) => {
    rootComponent.service.tool.setEdgelessTool(tool);
  };
}

export function getPosition(angleRad: number, v: IVec): IVec {
  const x = Math.cos(angleRad) * v[0];
  const y = Math.sin(angleRad) * v[1];
  return [x, y];
}

export function isNodeWithChildren(
  node: PieNodeModel
): node is PieNodeModel & { children: PieNonRootNode[] } {
  return 'children' in node;
}

export function isRootNode(model: PieNodeModel): model is PieRootNodeModel {
  return model.type === 'root';
}

export function isSubmenuNode(
  model: PieNodeModel
): model is PieSubmenuNodeModel {
  return model.type === 'submenu';
}

export function isCommandNode(
  model: PieNodeModel
): model is PieCommandNodeModel {
  return model.type === 'command';
}

export function isColorNode(model: PieNodeModel): model is PieColorNodeModel {
  return model.type === 'color';
}

export function isNodeWithAction(
  node: PieNodeModel
): node is IPieNodeWithAction {
  return 'action' in node && typeof node.action === 'function';
}

//------------------------------------------------------------------------------------
// credits: https://github.com/kando-menu/kando/blob/main/src/renderer/math/index.ts
//------------------------------------------------------------------------------------
export function calcNodeAngles(
  node: { angle?: number }[],
  parentAngle?: number
): number[] {
  const nodeAngles: number[] = [];

  // Shouldn't happen, but who knows...
  if (node.length == 0) {
    return nodeAngles;
  }

  // We begin by storing all fixed angles.
  const fixedAngles: { angle: number; index: number }[] = [];
  node.forEach((item, index) => {
    if (item.angle && item.angle >= 0) {
      fixedAngles.push({ angle: item.angle, index: index });
    }
  });

  // Make sure that the parent link does not collide with a fixed item. For now, we
  // just move the fixed angle a tiny bit. This is somewhat error-prone as it may
  // collide with another fixed angle now. Maybe this could be solved in a better way?
  // Maybe some global minimum angular spacing of items?
  if (parentAngle != undefined) {
    for (let i = 0; i < fixedAngles.length; i++) {
      if (Math.abs(fixedAngles[i].angle - parentAngle) < 0.0001) {
        fixedAngles[i].angle += 0.1;
      }
    }
  }

  // Make sure that the fixed angles are between 0° and 360°.
  for (let i = 0; i < fixedAngles.length; i++) {
    fixedAngles[i].angle = fixedAngles[i].angle % 360;
  }

  // Make sure that the fixed angles increase monotonically. If a fixed angle is larger
  // than the next one, the next one will be ignored.
  for (let i = 0; i < fixedAngles.length - 1; ) {
    if (fixedAngles[i].angle > fixedAngles[i + 1].angle) {
      fixedAngles.splice(i + 1, 1);
    } else {
      ++i;
    }
  }

  // If no item has a fixed angle, we assign one to the first item. If there is no
  // parent item, this is on the top (0°). Else, the angular space will be evenly
  // distributed to all child items and the first item will be at the first possible
  // location with an angle > 0.
  if (fixedAngles.length == 0) {
    let firstAngle = 0;
    if (parentAngle != undefined) {
      const wedgeSize = 360 / (node.length + 1);
      let minAngle = 360;
      for (let i = 0; i < node.length; i++) {
        minAngle = Math.min(
          minAngle,
          (parentAngle + (i + 1) * wedgeSize) % 360
        );
      }
      firstAngle = minAngle;
    }
    fixedAngles.push({ angle: firstAngle, index: 0 });
    nodeAngles[0] = firstAngle;
  }

  // Now we iterate through the fixed angles, always considering wedges between
  // consecutive pairs of fixed angles. If there is only one fixed angle, there is also
  // only one 360°-wedge.
  for (let i = 0; i < fixedAngles.length; i++) {
    const wedgeBeginIndex = fixedAngles[i].index;
    const wedgeBeginAngle = fixedAngles[i].angle;
    const wedgeEndIndex = fixedAngles[(i + 1) % fixedAngles.length].index;
    let wedgeEndAngle = fixedAngles[(i + 1) % fixedAngles.length].angle;

    // The fixed angle can be stored in our output.
    nodeAngles[wedgeBeginIndex] = wedgeBeginAngle;

    // Make sure we loop around.
    if (wedgeEndAngle <= wedgeBeginAngle) {
      wedgeEndAngle += 360;
    }

    // Calculate the number of items between the begin and end indices.
    let wedgeItemCount =
      (wedgeEndIndex - wedgeBeginIndex - 1 + node.length) % node.length;

    // We have one item more if the parent link is inside our wedge.
    let parentInWedge = false;

    if (parentAngle != undefined) {
      // It can be that the parent link is inside the current wedge, but it's angle is
      // one full turn off.
      if (parentAngle < wedgeBeginAngle) {
        parentAngle += 360;
      }

      parentInWedge =
        parentAngle > wedgeBeginAngle && parentAngle < wedgeEndAngle;
      if (parentInWedge) {
        wedgeItemCount += 1;
      }
    }

    // Calculate the angular difference between consecutive items in the current wedge.
    const wedgeItemGap =
      (wedgeEndAngle - wedgeBeginAngle) / (wedgeItemCount + 1);

    // Now we assign an angle to each item between the begin and end indices.
    let index = (wedgeBeginIndex + 1) % node.length;
    let count = 1;
    let parentGapRequired = parentInWedge;

    while (index != wedgeEndIndex) {
      let itemAngle = wedgeBeginAngle + wedgeItemGap * count;

      // Insert gap for parent link if required. for connector
      if (
        parentGapRequired &&
        itemAngle + wedgeItemGap / 2 - (parentAngle ?? 0) > 0
      ) {
        count += 1;
        itemAngle = wedgeBeginAngle + wedgeItemGap * count;
        parentGapRequired = false;
      }

      nodeAngles[index] = itemAngle % 360;

      index = (index + 1) % node.length;
      count += 1;
    }
  }

  return nodeAngles;
}

export function calcNodeWedges(
  nodeAngles: number[],
  parentAngle?: number
): { start: number; end: number }[] {
  // This should never happen, but who knows...
  if (nodeAngles.length === 0 && parentAngle === undefined) {
    return [];
  }

  // If the node has a single child but no parent (e.g. it's the root node), we can
  // simply return a full circle.
  if (nodeAngles.length === 1 && parentAngle === undefined) {
    return [{ start: 0, end: 360 }];
  }

  // If the node has a single child and a parent, we can set the start and end
  // angles to the center angles.
  if (nodeAngles.length === 1 && parentAngle !== undefined) {
    let start = parentAngle;
    let center = nodeAngles[0];
    let end = parentAngle + 360;

    [start, center, end] = normalizeConsecutiveAngles(start, center, end);
    [start, end] = scaleWedge(start, center, end, 0.5);

    return [{ start: start, end: end }];
  }

  // In all other cases, we loop through the items and compute the wedges. If the parent
  // angle happens to be inside a wedge, we crop the wedge accordingly.
  const wedges: { start: number; end: number }[] = [];

  for (let i = 0; i < nodeAngles.length; i++) {
    let start = nodeAngles[(i + nodeAngles.length - 1) % nodeAngles.length];
    let center = nodeAngles[i];
    let end = nodeAngles[(i + 1) % nodeAngles.length];

    [start, center, end] = normalizeConsecutiveAngles(start, center, end);

    if (parentAngle !== undefined) {
      [start, end] = cropWedge(start, center, end, parentAngle);
      [start, center, end] = normalizeConsecutiveAngles(start, center, end);
    }

    [start, end] = scaleWedge(start, center, end, 0.5);

    wedges.push({ start: start, end: end });
  }

  return wedges;
}
export function isAngleBetween(
  angle: number,
  start: number,
  end: number
): boolean {
  return (
    (angle > start && angle <= end) ||
    (angle - 360 > start && angle - 360 <= end) ||
    (angle + 360 > start && angle + 360 <= end)
  );
}

function normalizeConsecutiveAngles(
  start: number,
  center: number,
  end: number
) {
  while (center < start) {
    center += 360;
  }

  while (end < center) {
    end += 360;
  }

  while (center >= 360) {
    start -= 360;
    center -= 360;
    end -= 360;
  }

  return [start, center, end];
}

function cropWedge(
  start: number,
  center: number,
  end: number,
  cropAngle: number
) {
  if (isAngleBetween(cropAngle, start, center)) {
    start = cropAngle;
  }

  if (isAngleBetween(cropAngle, center, end)) {
    end = cropAngle;
  }

  return [start, end];
}
function scaleWedge(start: number, center: number, end: number, scale: number) {
  start = center - (center - start) * scale;
  end = center + (end - center) * scale;

  return [start, end];
}
