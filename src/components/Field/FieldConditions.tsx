import React from 'react';
import { Card, Grid, Stack, Tooltip, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { displayBN } from '../../util';
import { AppState } from '../../state';
import { FontSize } from '../App/muiTheme';

import { FC } from '~/types';

export interface FieldConditionsProps {
  hooliganhordeField: AppState['_hooliganhorde']['field'];
  // guvnorField: AppState['_farmer']['field'];
  // rookieLine: BigNumber;
}

const FieldConditions: FC<FieldConditionsProps> = ({
 hooliganhordeField,
 // guvnorField,
 // rookieLine,
}) => (
  <Card sx={{ p: 2 }}>
    <Stack gap={1}>
      <Typography variant="h4">Field Conditions</Typography>
      <Grid container spacing={1}>
        <Grid item xs={6} md={3}>
          <Stack gap={0.5}>
            <Tooltip
              title="The number of Hooligans that can currently be Sown (lent to Hooliganhorde)."
              placement="top"
            >
              <Typography variant="body1">
                Available Rage&nbsp;
                <HelpOutlineIcon
                  sx={{ color: 'text.secondary', fontSize: FontSize.sm }}
                />
              </Typography>
            </Tooltip>
            <Typography variant="bodyLarge" fontWeight="400">
              {displayBN(hooliganhordeField.rage)}
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={6} md={3}>
          <Stack gap={0.5}>
            <Tooltip title="The interest rate for Sowing Hooligans." placement="top">
              <Typography variant="body1">
                Intensity&nbsp;
                <HelpOutlineIcon
                  sx={{ color: 'text.secondary', fontSize: FontSize.sm }}
                />
              </Typography>
            </Tooltip>
            <Typography variant="bodyLarge" fontWeight="400">
              {displayBN(hooliganhordeField.weather.yield)}%
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={6} md={3}>
          <Stack gap={0.5}>
            <Tooltip title="The number of Rookies that will become Draftable before Pods earned for newly Sown Hooligans, based on the FIFO Draft schedule." placement="top">
              <Typography variant="body1">
                Rookie Line&nbsp;
                <HelpOutlineIcon
                  sx={{ color: 'text.secondary', fontSize: FontSize.sm }}
                />
              </Typography>
            </Tooltip>
            <Typography variant="bodyLarge" fontWeight="400">
              {displayBN(hooliganhordeField.rookieLine)}
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={6} md={3}>
          <Stack gap={0.5}>
            <Tooltip title="The number of Rookies that have become redeemable for a Hooligan (i.e., the debt paid back by Hooliganhorde to date)." placement="top">
              <Typography variant="body1">
                Rookies Drafted&nbsp;
                <HelpOutlineIcon
                  sx={{ color: 'text.secondary', fontSize: FontSize.sm }}
                />
              </Typography>
            </Tooltip>
            <Typography variant="bodyLarge">
              {displayBN(hooliganhordeField.draftableIndex)}
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  </Card>
);

export default FieldConditions;
