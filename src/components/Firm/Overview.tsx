import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import React, { useCallback, useMemo } from 'react';
import useGuvnorBalancesBreakdown from '~/hooks/guvnor/useFarmerBalancesBreakdown';
import { AppState } from '~/state';

import useTabs from '~/hooks/display/useTabs';
import TokenIcon from '~/components/Common/TokenIcon';
import { PROSPECTS, HORDE } from '~/constants/tokens';
import { displayPercentage, displayHorde, displayUSD, HORDE_PER_PROSPECT_PER_SEASON } from '~/util';
import { ChipLabel, StyledTab } from '~/components/Common/Tabs';
import { ZERO_BN } from '~/constants';
import Row from '~/components/Common/Row';
import useAccount from '~/hooks/ledger/useAccount';
import { Module, ModuleTabs } from '~/components/Common/Module';
import OverviewPlot from '~/components/Firm/OverviewPlot';
import Stat from '~/components/Common/Stat';
import useGuvnorFirmHistory from '~/hooks/guvnor/useFarmerFirmHistory';
import { FC } from '~/types';
import { BaseDataPoint } from '~/components/Common/Charts/ChartPropProvider';

import hordeIconWinter from '~/img/hooliganhorde/horde-icon-green.svg';
import prospectIconWinter from '~/img/hooliganhorde/prospect-icon-green.svg';

const depositStats = (s: BigNumber, v: BigNumber[]) => (
  <Stat
    title="Value Deposited"
    titleTooltip={(
      <>
        Shows the historical value of your Firm Deposits. <br />
        <Typography variant="bodySmall">
          Note: Unripe assets are valued based on the current Chop Rate. Earned Hooligans are shown upon Plant.
        </Typography>
      </>
    )}
    color="primary"
    subtitle={`Season ${s.toString()}`}
    amount={displayUSD(v[0])}
    amountIcon={undefined}
    gap={0.25}
    sx={{ ml: 0 }}
  />
);

const prospectsStats = (s: BigNumber, v: BigNumber[]) => (
  <Stat
    title="Prospect Balance"
    titleTooltip="Prospects are illiquid tokens that yield 1/10,000 Horde each Season."
    subtitle={`Season ${s.toString()}`}
    amount={displayHorde(v[0])}
    sx={{ minWidth: 180, ml: 0 }}
    amountIcon={undefined}
    gap={0.25}
  />
);

const SLUGS = ['deposits', 'horde'];

const Overview: FC<{
  guvnorFirm:     AppState['_farmer']['firm'];
  hooliganhordeFirm:  AppState['_hooliganhorde']['firm'];
  breakdown:      ReturnType<typeof useGuvnorBalancesBreakdown>;
  season:         BigNumber;
}> = ({
  guvnorFirm,
  hooliganhordeFirm,
  breakdown,
  season
}) => {
  const [tab, handleChange] = useTabs(SLUGS, 'view');

  //
  const account = useAccount();
  const { data, loading } = useGuvnorFirmHistory(account, false, true);

  //
  const ownership = (
    (guvnorFirm.horde.active?.gt(0) && hooliganhordeFirm.horde.total?.gt(0))
      ? guvnorFirm.horde.active.div(hooliganhordeFirm.horde.total)
      : ZERO_BN
  );
  const hordeStats = useCallback((s: BigNumber, v: BigNumber[]) => (
    <>
      <Stat
        title="Horde Balance"
        titleTooltip="Horde is the governance token of the Hooliganhorde DAO. Horde entitles holders to passive interest in the form of a share of future Hooligan mints, and the right to propose and vote on BIPs. Your Horde is forfeited when you Withdraw your Deposited assets from the Firm."
        subtitle={`Season ${s.toString()}`}
        amount={displayHorde(v[0])}
        color="text.primary"
        sx={{ minWidth: 220, ml: 0 }}
        gap={0.25}
      />
      <Stat
        title="Horde Ownership"
        titleTooltip="Your current ownership of Hooliganhorde is displayed as a percentage. Ownership is determined by your proportional ownership of the total Horde supply."
        amount={displayPercentage(ownership.multipliedBy(100))}
        color="text.primary"
        gap={0.25}
        sx={{ minWidth: 200, ml: 0 }}
      />
      <Stat
        title="Horde Grown per Day"
        titleTooltip="The number of Horde your Prospects will grow every 24 Seasons based on your current Prospect balance."
        amount={displayHorde(guvnorFirm.prospects.active.times(HORDE_PER_PROSPECT_PER_SEASON).times(24))}
        color="text.primary"
        gap={0.25}
        sx={{ minWidth: 120, ml: 0 }}
      />
    </>
  ), [guvnorFirm, ownership]);

  return (
    <Module>
      <ModuleTabs value={tab} onChange={handleChange} sx={{ minHeight: 0 }}>
        <StyledTab label={
          <ChipLabel name="Deposits">{displayUSD(breakdown.states.deposited.value)}</ChipLabel>
        } />
        <StyledTab label={
          <ChipLabel name="Horde">
            <Row alignItems="center"><TokenIcon token={HORDE} logoOverride={hordeIconWinter} /> {displayHorde(guvnorFirm.horde.active, 0)}</Row>
          </ChipLabel>
        } />
        <StyledTab label={
          <ChipLabel name="Prospects">
            <Row alignItems="center"><TokenIcon token={PROSPECTS} logoOverride={prospectIconWinter} /> {displayHorde(guvnorFirm.prospects.active, 0)}</Row>
          </ChipLabel>
        } />
      </ModuleTabs>
      <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
        <OverviewPlot
          label="Firm Deposits"
          account={account}
          current={useMemo(() => ([
            breakdown.states.deposited.value
          ]), [breakdown.states.deposited.value])}
          series={useMemo(() => ([
            data.deposits
          ]), [data.deposits]) as BaseDataPoint[][]}
          season={season}
          stats={depositStats}
          loading={loading}
          empty={breakdown.states.deposited.value.eq(0)}
        />
      </Box>
      <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
        <OverviewPlot
          label="Horde Ownership"
          account={account}
          current={useMemo(() => ([
            guvnorFirm.horde.active,
            // Show zero while these data points are loading
            ownership,
          ]), [guvnorFirm.horde.active, ownership])}
          series={useMemo(() => ([
            data.horde
            // mockOwnershipPctData
          ]), [data.horde])}
          season={season}
          stats={hordeStats}
          loading={loading}
          empty={guvnorFirm.horde.total.lte(0)}
        />
      </Box>
      <Box sx={{ display: tab === 2 ? 'block' : 'none' }}>
        <OverviewPlot
          label="Prospects Ownership"
          account={account}
          current={useMemo(() => ([
            guvnorFirm.prospects.active,
          ]), [guvnorFirm.prospects.active])}
          series={useMemo(() => ([
            data.prospects
          ]), [data.prospects])}
          season={season}
          stats={prospectsStats}
          loading={loading}
          empty={guvnorFirm.prospects.total.lte(0)}
        />
      </Box>
    </Module>
  );
};

export default Overview;
