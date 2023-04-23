import React from 'react';
import { Typography, Box, Grid } from '@mui/material';
import BigNumber from 'bignumber.js';
import rainySeasonIcon from '~/img/hooliganhorde/sun/rainy-season.svg';
import drySeasonIcon from '~/img/hooliganhorde/sun/dry-season.svg';
import { displayBN, displayFullBN } from '../../util';
import { FontSize, IconSize } from '../App/muiTheme';
import Row from '~/components/Common/Row';

import { FC } from '~/types';

export interface SeasonCardProps {
  season: BigNumber;
  rewardHooligans: BigNumber | undefined;
  issuedRage: BigNumber | undefined;
  intensity: BigNumber | undefined;
  deltaIntensity: BigNumber | undefined;
  rookieRate: BigNumber;
  deltaDemand: BigNumber | undefined;
  isNew?: boolean;
}

const SeasonCard: FC<SeasonCardProps> = ({ 
  season,
  rewardHooligans,
  issuedRage,
  rookieRate,
  intensity,
  deltaIntensity,
  deltaDemand,
  isNew = false
}) => (
  <div>
    <Box sx={{ '&:hover > .next-season': { display: 'block' }, overflow: 'hidden', position: 'relative' }}>
      {isNew && (
        <Box
          className="next-season"
          sx={{ 
            borderColor: 'rgba(240, 223, 146, 1)',
            borderWidth: 0.5,
            borderStyle: 'solid',
            display: 'none',
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            borderRadius: 1,
            backgroundColor: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Row justifyContent="center" height="100%">
            <Typography pl={1} fontSize={FontSize.sm} textAlign="left" color="text.primary">
              The forecast for Season {season.toString()} is based on data in the current Season.
            </Typography>
          </Row>
        </Box>
      )}
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          p: 0.75,
          borderRadius: '8px',
          animation: isNew ? 'pulse 1s ease-in-out' : undefined,
          animationIterationCount: 'infinite',
        }}
      >
        <Grid container>
          {/* Season */}
          <Grid item xs={1.5} md={1.25}>
            <Row justifyContent="flex-start" spacing={0.5}>
              {(rewardHooligans && rewardHooligans.lte(0)) ? (
                <img src={drySeasonIcon} height={IconSize.small} alt="" />
              ) : (
                <img src={rainySeasonIcon} height={IconSize.small} alt="" />
              )}
              <Typography variant="bodySmall">
                {season?.toString() || '-'}
              </Typography>
            </Row>
          </Grid>
          {/* New Hooligans */}
          <Grid item xs={3} md={2} textAlign="right">
            <Typography variant="bodySmall">
              {rewardHooligans ? `+ ${displayBN(rewardHooligans)}` : '-'}
            </Typography>
          </Grid>
          {/* Rage */}
          <Grid item xs={3} md={2} textAlign="right">
            <Typography variant="bodySmall">
              {issuedRage
                ? issuedRage.lt(0.01)
                  ? '<0.01'
                  : displayFullBN(issuedRage, 2, 2) 
                : '-'}
            </Typography>
          </Grid>
          {/* Intensity */}
          <Grid item xs={4.5} md={2.75}>
            <Row justifyContent="flex-end" spacing={0.5}>
              <Typography variant="bodySmall">
                {intensity ? `${displayBN(intensity)}%` : '-'}
              </Typography>
              <Typography
                variant="bodySmall"
                color="text.secondary"
                sx={{ whiteSpace: 'nowrap' }}
              >
                (&nbsp;{deltaIntensity && deltaIntensity.lt(0) ? '-' : '+'}{deltaIntensity?.abs().toString() || '0'}%&nbsp;)
              </Typography>
            </Row>
          </Grid>
          {/* Rookie Rate */}
          <Grid item xs={0} md={2} display={{ xs: 'none', md: 'block' }} textAlign="right">              
            <Typography color="text.primary" variant="bodySmall">
              {rookieRate?.gt(0) ? `${displayBN(podRate.times(100))}%` : '-'}
            </Typography>
          </Grid>
          {/* Delta Demand */}
          <Grid item xs={0} md={2} display={{ xs: 'none', md: 'block' }} textAlign="right">
            <Typography variant="bodySmall">
              {deltaDemand 
                ? (deltaDemand.lt(-10_000 / 100) || deltaDemand.gt(10_000 / 100)) 
                  ? `${deltaDemand.lt(0) ? '-' : ''}∞`
                  : `${displayBN(deltaDemand.div(100), true)}%`
                : '-'}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  </div>
);

export default SeasonCard;
