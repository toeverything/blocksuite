import type { DenseMenuBuilder } from '../common/type.js';

import {
  ConnectorCWithArrowIcon,
  ConnectorIcon,
  ConnectorLWithArrowIcon,
  ConnectorXWithArrowIcon,
} from '../../../../../_common/icons/edgeless.js';
import { ConnectorMode } from '../../../../../surface-block/index.js';

export const buildConnectorDenseMenu: DenseMenuBuilder = edgeless => {
  const prevMode =
    edgeless.service.editPropsStore.getLastProps('connector').mode ??
    ConnectorMode.Curve;

  const isSelected = edgeless.tools.edgelessTool.type === 'connector';

  const createSelect =
    (mode: ConnectorMode, record = true) =>
    () => {
      edgeless.tools.setEdgelessTool({ mode, type: 'connector' });
      record &&
        edgeless.service.editPropsStore.recordLastProps('connector', { mode });
    };

  return {
    icon: ConnectorIcon,
    isSelected,
    name: 'Connector',
    options: {
      items: [
        {
          icon: ConnectorCWithArrowIcon,
          isSelected: isSelected && prevMode === ConnectorMode.Curve,
          name: 'Curve',
          select: createSelect(ConnectorMode.Curve),
          type: 'action',
        },
        {
          icon: ConnectorXWithArrowIcon,
          isSelected: isSelected && prevMode === ConnectorMode.Orthogonal,
          name: 'Elbowed',
          select: createSelect(ConnectorMode.Orthogonal),
          type: 'action',
        },
        {
          icon: ConnectorLWithArrowIcon,
          isSelected: isSelected && prevMode === ConnectorMode.Straight,
          name: 'Straight',
          select: createSelect(ConnectorMode.Straight),
          type: 'action',
        },
      ],
    },
    select: createSelect(prevMode, false),
    type: 'sub-menu',
  };
};
