import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { useAccount as useWagmiAccount } from 'wagmi';
import { Typography } from '@mui/material';
import { GridColumns } from '@mui/x-data-grid';
import { Token } from '~/classes';
import { GuvnorFirmBalance, WithdrawalCrate } from '~/state/guvnor/firm';
import { displayFullBN, displayUSD } from '~/util';
import useSeason from '~/hooks/hooliganhorde/useSeason';
import { ZERO_BN } from '~/constants';
import useFirmTokenToFiat from '~/hooks/hooliganhorde/useFirmTokenToFiat';
import TableCard from '../../Common/TableCard';

import { FC } from '~/types';

type RowData = WithdrawalCrate & { id: BigNumber };

const Withdrawals : FC<{
  token: Token;
  firmBalance: GuvnorFirmBalance | undefined;
}> = ({
  token,
  firmBalance,
}) => {
  const getUSD = useFirmTokenToFiat();
  const currentSeason = useSeason();
  const account = useWagmiAccount();

  const rows : RowData[] = useMemo(() => {
    const data : RowData[] = [];
    if (firmBalance) {
      if (firmBalance.claimable.amount.gt(0)) {
        data.push({
          id: currentSeason,
          amount: firmBalance.claimable.amount,
          season: currentSeason,
        });
      }
      if (firmBalance.withdrawn?.crates?.length > 0) {
        data.push(
          ...(firmBalance.withdrawn.crates.map((crate) => ({
            id: crate.season,
            ...crate
          })))
        );
      }
    }
    return data;
  }, [
    firmBalance,
    currentSeason,
  ]);

  const columns = useMemo(() => ([
    {
      field: 'season',
      flex: 2,
      headerName: 'Seasons to Arrival',
      align: 'left',
      headerAlign: 'left',
      valueParser: (value: BigNumber) => value.toNumber(),
      renderCell: (params) => {
        const seasonsToArrival = params.value.minus(currentSeason);
        return seasonsToArrival.lte(0) ? (
          <Typography color="primary">Claimable</Typography>
        ) : (
          <Typography>{seasonsToArrival.toFixed()}</Typography>
        );
      },
      sortable: false,
    },
    {
      field: 'amount',
      flex: 2,
      headerName: 'Withdrawn Amount',
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography>
          {displayFullBN(params.value, token.displayDecimals, token.displayDecimals)} 
          <Typography display={{ xs: 'none', md: 'inline' }} color="text.secondary">
            {' '}(~{displayUSD(getUSD(token, params.row.amount))})
          </Typography>
        </Typography>
      ),
      sortable: false,
    },
  ] as GridColumns), [
    token,
    getUSD,
    currentSeason
  ]);

  const amount = firmBalance?.withdrawn.amount;
  const state = !account ? 'disconnected' : !currentSeason ? 'loading' : 'ready';

  return (
    <TableCard
      title={`${token.name} Withdrawals`}
      rows={rows}
      columns={columns}
      amount={amount}
      value={getUSD(token, amount || ZERO_BN)}
      state={state}
      sort={{ field: 'season', sort: 'asc' }}
      token={token}
    />
  );
};

export default Withdrawals;
