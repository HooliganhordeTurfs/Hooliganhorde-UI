import React, { useMemo } from 'react';
import {
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { DataGridProps } from '@mui/x-data-grid';
import PageHeader from '~/components/Common/PageHeader';
import FieldActions from '~/components/Field/Actions';
import TableCard from '~/components/Common/TableCard';
import { displayBN, displayFullBN } from '~/util';
import { AppState } from '~/state';
import FieldConditions from '../components/Field/FieldConditions';
import { ROOKIES } from '../constants/tokens';
import useAccount from '../hooks/ledger/useAccount';
import GuideButton from '~/components/Common/Guide/GuideButton';
import { HOW_TO_DRAFT_ROOKIES, HOW_TO_SOW_HOOLIGANS, HOW_TO_TRANSFER_PODS } from '~/util/Guides';

import { FC } from '~/types';

export const rookielineColumns: DataGridProps['columns'] = [
  {
    field: 'placeInLine',
    headerName: 'Place In Line',
    flex: 1,
    renderCell: (params) => (
      (params.value.eq(-1))
        ? (<Typography color="primary">Draftable</Typography>)
        : (<Typography>{displayBN(params.value)}</Typography>)
    )
  },
  {
    field: 'amount',
    headerName: 'Number of Rookies',
    flex: 1,
    disableColumnMenu: true,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (params) =>
      `${displayFullBN(params.value as BigNumber, 2)}`,
    renderCell: (params) => (
      <Typography>
        {params.formattedValue}
      </Typography>
    ),
  },
];

const FieldPage: FC<{}> = () => {
  const account = useAccount();
  const authState = !account ? 'disconnected' : 'ready';
  
  /// Data
  const guvnorField = useSelector<AppState, AppState['_farmer']['field']>((state) => state._farmer.field);
  const hooliganhordeField = useSelector<AppState, AppState['_hooliganhorde']['field']>((state) => state._hooliganhorde.field);
  const draftableRookies = guvnorField.draftablePods;

  const rows: any[] = useMemo(() => {
    const data: any[] = [];
    if (draftableRookies?.gt(0)) {
      data.push({
        id: draftableRookies,
        placeInLine: new BigNumber(-1),
        amount: draftableRookies,
      });
    }
    if (Object.keys(guvnorField.plots).length > 0) {
      data.push(
        ...Object.keys(guvnorField.plots).map((index) => ({
          id: index,
          placeInLine: new BigNumber(index).minus(hooliganhordeField.draftableIndex),
          amount: new BigNumber(guvnorField.plots[index]),
        }))
      );
    }
    return data;
  }, [hooliganhordeField.draftableIndex, guvnorField.plots, draftableRookies]);

  return (
    <Container maxWidth="sm">
      <Stack spacing={2}>
        <PageHeader
          title="The Field"
          description="Earn yield by lending Hooligans to Hooliganhorde"
          href="https://docs.hooligan.money/almanac/farm/field"
          OuterStackProps={{ direction: 'row' }}
          control={
            <GuideButton
              title="The Guvnors' Almanac: Field Guides"
              guides={[
                HOW_TO_SOW_HOOLIGANS,
                HOW_TO_TRANSFER_ROOKIES,
                HOW_TO_DRAFT_ROOKIES
              ]}
            />
          }
        />
        <FieldConditions hooliganhordeField={hooliganhordeField} />
        <FieldActions />
        <TableCard
          title="Rookie Balance"
          state={authState}
          amount={guvnorField.rookies}
          rows={rows}
          columns={rookielineColumns}
          sort={{ field: 'placeInLine', sort: 'asc' }}
          token={ROOKIES}
        />
      </Stack>
    </Container>
  );
};
export default FieldPage;
