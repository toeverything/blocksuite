import {
  ConnectorCWithArrowIcon,
  ConnectorIcon,
  ConnectorLWithArrowIcon,
  ConnectorXWithArrowIcon,
} from '../../../../../_common/icons/edgeless.js';
import { ConnectorMode } from '../../../../../surface-block/index.js';
import type { DenseMenuBuilder } from '../common/type.js';

export const buildConnectorDenseMenu: DenseMenuBuilder = edgeless => {
  const prevMode =
    edgeless.service.editPropsStore.getLastProps('connector').mode ??
    ConnectorMode.Curve;

  const isSelected = edgeless.tools.edgelessTool.type === 'connector';

  const createSelect =
    (mode: ConnectorMode, record = true) =>
    () => {
      edgeless.tools.setEdgelessTool({ type: 'connector', mode });
      record &&
        edgeless.service.editPropsStore.recordLastProps('connector', { mode });
    };

  return {
    type: 'sub-menu',
    name: 'Connector',
    icon: ConnectorIcon,
    select: createSelect(prevMode, false),
    isSelected,
    options: {
      items: [
        {
          type: 'action',
          name: 'Curve',
          icon: ConnectorCWithArrowIcon,
          select: createSelect(ConnectorMode.Curve),
          isSelected: isSelected && prevMode === ConnectorMode.Curve,
        },
        {
          type: 'action',
          name: 'Elbowed',
          icon: ConnectorXWithArrowIcon,
          select: createSelect(ConnectorMode.Orthogonal),
          isSelected: isSelected && prevMode === ConnectorMode.Orthogonal,
        },
        {
          type: 'action',
          name: 'Straight',
          icon: ConnectorLWithArrowIcon,
          select: createSelect(ConnectorMode.Straight),
          isSelected: isSelected && prevMode === ConnectorMode.Straight,
        },
      ],
    },
  };
};
