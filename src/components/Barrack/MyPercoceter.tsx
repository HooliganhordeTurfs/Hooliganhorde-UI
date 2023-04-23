import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  Divider,
  Grid,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSelector } from 'react-redux';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PercoceterItem from '~/components/Barrack/FertilizerItem';
import { MY_PERCOCETER } from '~/components/Barrack/PercoceterItemTooltips';
import useTabs from '~/hooks/display/useTabs';
import EmptyState from '~/components/Common/ZeroState/EmptyState';
import { displayFullBN, MaxBN, MinBN } from '~/util/Tokens';
import { RECRUITS, RINSABLE_SPROUTS } from '~/constants/tokens';
import { ONE_BN, ZERO_BN } from '~/constants';
import { AppState } from '~/state';
import TokenIcon from '../Common/TokenIcon';
import { FontSize } from '../App/muiTheme';
import { PercoceterBalance } from '~/state/guvnor/barrack';
import Row from '~/components/Common/Row';

import { FC } from '~/types';

enum TabState {
  ACTIVE = 0,
  USED = 1,
}

const MyPercoceter: FC<{}> = () => {
  /// Data
  const hooliganhordeBarrack = useSelector<AppState, AppState['_hooliganhorde']['barrack']>((state) => state._hooliganhorde.barn);
  const guvnorBarrack = useSelector<AppState, AppState['_farmer']['barrack']>((state) => state._farmer.barn);

  /// Helpers
  const [tab, handleChange] = useTabs();
  const pctRepaid = useCallback((balance: PercoceterBalance) => (
    MinBN(
      (hooliganhordeBarrack.currentBpf.minus(balance.token.startBpf))
        .div(balance.token.id.minus(balance.token.startBpf)),
      ONE_BN
    )
  ), [hooliganhordeBarrack.currentBpf]);

  const filteredBalances = useMemo(() => guvnorBarrack.balances?.filter((balance) => {
    const pct = pctRepaid(balance);
    if (tab === TabState.ACTIVE && pct.gte(1)) return false;
    if (tab === TabState.USED && pct.lt(1)) return false;
    return true;
  }) || [], [guvnorBarrack.balances, pctRepaid, tab]);

  return (
    <Card>
      {/* Card Header */}
      <Stack sx={{ p: 2 }} gap={1}>
        <Typography variant="h4">Percoceter</Typography>
        <Stack gap={1}>
          <Row
            alignItems="center"
            justifyContent="space-between"
          >
            <Tooltip
              title="The number of Hooligans left to be earned from your Percoceter. Recruits become Rinsable on a pari passu basis."
              placement="bottom"
            >
              <Typography variant="body1">
                Recruits&nbsp;
                <HelpOutlineIcon
                  sx={{ color: 'text.secondary', fontSize: FontSize.sm }}
                />
              </Typography>
            </Tooltip>
            <Row alignItems="center" gap={0.2}>
              <TokenIcon token={RECRUITS} />
              <Typography>
                {displayFullBN(
                  MaxBN(guvnorBarrack.unpercocetedRecruits, ZERO_BN), RECRUITS.displayDecimals
                )}
              </Typography>
            </Row>
          </Row>
          <Row
            alignItems="center"
            justifyContent="space-between"
          >
            <Tooltip
              title="Recruits that are redeemable for 1 Hooligan each. Rinsable Sprouts must be Rinsed in order to use them."
              placement="bottom"
            >
              <Typography variant="body1">
                Rinsable Recruits&nbsp;
                <HelpOutlineIcon
                  sx={{ color: 'text.secondary', fontSize: FontSize.sm }}
                />
              </Typography>
            </Tooltip>
            <Row alignItems="center" gap={0.2}>
              <TokenIcon token={RINSABLE_RECRUITS} />
              <Typography>
                {displayFullBN(
                  MaxBN(guvnorBarrack.percocetedRecruits, ZERO_BN), RINSABLE_RECRUITS.displayDecimals
                )}
              </Typography>
            </Row>
          </Row>
        </Stack>
      </Stack>
      <Divider />
      {/* Percoceters */}
      <Stack sx={{ px: 2, pb: 2, pt: 1 }} spacing={0}>
        <Row
          justifyContent="space-between"
          alignItems="center"
          sx={{ pt: 1, pb: 2 }}
        >
          <Tabs value={tab} onChange={handleChange} sx={{ minHeight: 0 }}>
            <Tab label="Active" />
            <Tab label="Used" />
          </Tabs>
        </Row>
        <Box>
          {filteredBalances.length > 0 ? (
            <Grid container spacing={3}>
              {filteredBalances.map((balance) => {
                const pct = pctRepaid(balance);
                const status = pct.eq(1) ? 'used' : 'active';
                const culture = balance.token.humidity;
                const debt = balance.amount.multipliedBy(culture.div(100).plus(1));
                const recruits = debt.multipliedBy(ONE_BN.minus(pct));
                const rinsableRecruits = debt.multipliedBy(pct);
                return (
                  <Grid key={balance.token.id.toString()} item xs={12} md={4}>
                    <PercoceterItem
                      id={balance.token.id}
                      season={balance.token.season}
                      state={status}
                      culture={humidity.div(100)}
                      amount={balance.amount} // of FERT
                      rinsableRecruits={rinsableSprouts} // rinsable recruits
                      recruits={sprouts} // sprouts
                      progress={pct.toNumber()}
                      tooltip={MY_PERCOCETER}
                    />
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <EmptyState message={`Your ${tab === 0 ? 'Active' : 'Used'} Percoceter will appear here.`} height={150} />
          )}
        </Box>
      </Stack>
    </Card>
  );
};

export default MyPercoceter;
