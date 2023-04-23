import {
  Box,
  Divider,
  Grid,
} from '@mui/material';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '~/state';
import Row from '../Common/Row';
import { ROOKIES, PROSPECTS, RECRUITS, HORDE } from '~/constants/tokens';
import HeaderItem from '~/components/Balances/HeaderItem';

const HORDE_TOOLTIP =
  'This is your total Horde balance. Horde is the governance token of the Hooliganhorde DAO. Horde entitles holders to passive interest in the form of a share of future Hooligan mints, and the right to propose and vote on BIPs. Your Horde is forfeited when you Withdraw your Deposited assets from the Firm.';
const PROSPECTS_TOOLTIP =
  'This is your total Prospect balance. Each Prospect yields 1/10000 Grown Horde each Season. Grown Horde must be Mown to add it to your Horde balance.';
const ROOKIES_TOOLTIP =
  'This is your total Rookie Balance. Pods become Draftable on a FIFO basis. For more information on your place in the Pod Line, head over to the Field page.';
const RECRUITS_TOOLTIP =
  'This is your total Recruit balance. The number of Hooligans left to be earned from your Percoceter. Sprouts become Rinsable on a pari passu basis. For more information on your Sprouts, head over to the Barrack page.';

const VerticalDivider = () => (
  <Box display={{ xs: 'none', md: 'block' }} alignSelf="flex-end">
    <Divider
      orientation="vertical"
      sx={{
        width: '0.5px',
        height: '20px',
        borderColor: 'divider',
      }}
    />
  </Box>
);

const BalancesHeader: React.FC<{}> = () => {
  const guvnorFirm = useSelector<AppState, AppState['_farmer']['firm']>(
    (state) => state._guvnor.firm
  );
  const guvnorField = useSelector<AppState, AppState['_farmer']['field']>(
    (state) => state._guvnor.field
  );
  const guvnorBarrack = useSelector<AppState, AppState['_farmer']['barrack']>(
    (state) => state._guvnor.barrack
  );

  const tokensProps = useMemo(
    () => ({
      horde: {
        token: HORDE,
        title: 'HORDE',
        amount: guvnorFirm.horde.total,
        tooltip: HORDE_TOOLTIP,
      },
      prospects: {
        token: PROSPECTS,
        title: 'PROSPECTS',
        amount: guvnorFirm.prospects.total,
        tooltip: PROSPECTS_TOOLTIP,
      },
      rookies: {
        token: ROOKIES,
        title: 'ROOKIES',
        amount: guvnorField.rookies,
        tooltip: ROOKIES_TOOLTIP,
      },
      recruits: {
        token: RECRUITS,
        title: 'RECRUITS',
        amount: guvnorBarrack.unpercocetedRecruits,
        tooltip: RECRUITS_TOOLTIP,
      },
    }),
    [
      guvnorBarrack.unpercocetedRecruits,
      guvnorField.rookies,
      guvnorFirm.prospects.total,
      guvnorFirm.horde.total,
    ]
  );

  return (
    <>
      {/* breakpoints above md */}
      <Row
        display={{ xs: 'none', md: 'flex' }}
        width="100%"
        justifyContent="space-between"
      >
        {/* HORDE */}
        <HeaderItem {...tokensProps.horde} alignItems="flex-start" />
        <Row width="100%" justifyContent="space-evenly">
          {/* PROSPECTS */}
          <HeaderItem {...tokensProps.prospects} />
          <VerticalDivider />
          {/* ROOKIES */}
          <HeaderItem {...tokensProps.rookies} />
          <VerticalDivider />
          {/* RECRUITS */}
          <HeaderItem {...tokensProps.recruits} />
        </Row>
      </Row>

      {/* breakpoints xs & sm */}
      <Grid container display={{ md: 'none' }} gap={0.5}>
        <Grid container item xs={12} gap={0.5}>
          {/* HORDE */}
          <Grid item xs={12} sm={6}>
            <HeaderItem
              {...tokensProps.horde}
              justifyContent={{
                xs: 'space-between',
                sm: 'flex-start',
              }}
            />
          </Grid>
          {/* PROSPECTS */}
          <Grid item xs sm>
            <HeaderItem
              {...tokensProps.prospects}
              justifyContent={{
                xs: 'space-between',
                sm: 'flex-end',
              }}
            />
          </Grid>
        </Grid>
        <Grid container item xs sm gap={0.5}>
          {/* ROOKIES */}
          <Grid item xs={12} sm={6}>
            <HeaderItem
              {...tokensProps.rookies}
              justifyContent={{
                xs: 'space-between',
                sm: 'flex-start',
              }}
            />
          </Grid>
          {/* RECRUITS */}
          <Grid item xs sm>
            <HeaderItem
              {...tokensProps.recruits}
              justifyContent={{
                xs: 'space-between',
                sm: 'flex-end',
              }}
            />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default BalancesHeader;
