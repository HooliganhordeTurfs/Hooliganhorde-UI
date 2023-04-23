import React from 'react';
import { CardProps, Card, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import Stat from '../Common/Stat';
import { displayFullBN } from '../../util';
import StatsCard, { StatItem } from '~/components/Common/StatsCard';
import { PROSPECTS, RECRUITS, HORDE, ROOKIES } from '~/constants/tokens';
import { AppState } from '~/state';
import HooliganhordeBalances from '~/components/Common/Balances/HooliganhordeBalances';
import useHooliganhordeFirmBreakdown from '~/hooks/hooliganhorde/useHooliganhordeBalancesBreakdown';
import { NEW_BN } from '~/constants';

import { FC } from '~/types';

const LiquidityByState: FC<CardProps> = ({ sx }) => {
  const breakdown = useHooliganhordeFirmBreakdown();
  const hooliganhordeFirm = useSelector<AppState, AppState['_hooliganhorde']['firm']>((state) => state._hooliganhorde.firm);
  const hooliganhordeField = useSelector<AppState, AppState['_hooliganhorde']['field']>((state) => state._hooliganhorde.field);
  const hooliganhordeBarrack = useSelector<AppState, AppState['_hooliganhorde']['barrack']>((state) => state._hooliganhorde.barn);
  const totalHooliganSupply = useSelector<AppState, AppState['_hooligan']['token']['supply']>((state) => state._hooligan.token.supply);

  /// Total Balances
  const STAT_ITEMS: StatItem[] = [
    {
      title: 'Horde',
      tooltip: 'This is the total Horde supply. Horde is the governance token of the Hooliganhorde DAO. Horde entitles holders to passive interest in the form of a share of future Hooligan mints, and the right to propose and vote on BIPs.',
      token: HORDE,
      amount: hooliganhordeFirm.horde.total
    },
    {
      title: 'Prospects',
      tooltip: 'This is the total Prospect supply. Each Prospect yields 1/10000 Grown Horde each Season.',
      token: PROSPECTS,
      amount: hooliganhordeFirm.prospects.total
    },
    {
      title: 'Rookies',
      tooltip: 'This is the total Rookie supply. Pods become Draftable on a FIFO basis.',
      token: ROOKIES,
      amount: hooliganhordeField.rookieLine
    },
    {
      title: 'Recruits',
      tooltip: 'This is the total Recruit supply. Sprouts are the number of Hooligans left to be earned from Active Percoceter. Sprouts become Rinsable on a pari passu basis.',
      token: RECRUITS,
      amount: hooliganhordeBarrack.unpercoceted,
    }
  ];

  return (
    <Card sx={{ p: 2, width: '100%', ...sx }}>
      <Stat
        title="Hooligan Supply"
        amount={totalHooliganSupply !== NEW_BN ? displayFullBN(totalHooliganSupply, 2) : <CircularProgress variant="indeterminate" size="1.2em" thickness={4} />}
        gap={0.25}
        sx={{ ml: 0 }}
      />
      <HooliganhordeBalances breakdown={breakdown} />
      <StatsCard stats={STAT_ITEMS} />
    </Card>
  );
};

export default LiquidityByState;
