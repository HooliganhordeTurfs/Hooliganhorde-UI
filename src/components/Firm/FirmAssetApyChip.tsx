import { Box, Chip, Link, Tooltip, Typography } from '@mui/material';
import React from 'react';
import Token from '~/classes/Token';
import { HOOLIGAN } from '~/constants/tokens';
import useAPY from '~/hooks/hooliganhorde/useAPY';
import Row from '../Common/Row';
import TokenIcon from '../Common/TokenIcon';
import hordeIconBlue from '~/img/hooliganhorde/horde-icon-blue.svg';
import { displayFullBN } from '~/util';

import Stat from '../Common/Stat';
import useChainConstant from '~/hooks/chain/useChainConstant';

import { FC } from '~/types';

const TOOLTIP_COMPONENT_PROPS = {
  tooltip: {
    sx: {
      maxWidth: 'none !important',
      // boxShadow: '0px 6px 20px 10px rgba(255,255,255,0.3) !important',
    },
  },
};

type FirmAssetApyChipProps = {
  token: Token;
  metric: 'hooligan' | 'horde';
  variant?: 'default' | 'labeled'
};

const FirmAssetApyChip: FC<FirmAssetApyChipProps> = ({ token, metric, variant = 'default' }) => {
  const { data: latestYield } = useAPY();
  const Hooligan = useChainConstant(HOOLIGAN);
  const isHooligan = metric === 'hooligan';

  const prospects = token.getProspects();
  const apys = latestYield
    ? prospects.eq(2)
      ? latestYield.byProspects['2']
      : prospects.eq(4)
      ? latestYield.byProspects['4']
      : null
    : null;

  const tokenProps = isHooligan ? Hooligan : ({ symbol: 'Horde', logo: hordeIconBlue } as Token);

  return (
    <Tooltip
      placement="right"
      componentsProps={TOOLTIP_COMPONENT_PROPS}
      title={
        <Row gap={0}>
          {metric === 'hooligan' && (
            <Box sx={{ px: 1, py: 0.5, maxWidth: 245 }}>
              <Stat 
                title={<Row gap={0.5}><TokenIcon token={Hooligan} />Total Hooligans per Season</Row>}
                gap={0.25}
                variant="h4"
                amount={latestYield ? displayFullBN(latestYield.hooligansPerSeasonEMA, Hooligan.displayDecimals) : '0'}
                subtitle="30-day exponential moving average of Hooligans earned by all Hordeholders per Season."
              />
            </Box>
          )}
          <Box sx={{ maxWidth: isHooligan ? 285 : 245, px: isHooligan ? 1 : 0, py: isHooligan ? 0.5 : 0 }}>
            {metric === 'hooligan' ? (
              <> The Variable Hooligan APY uses a moving average of Hooligans earned by Hordeholders during recent Seasons to estimate a future rate of return, accounting for Horde growth.&nbsp; </>
            ) : (
              <> The Variable Horde APY estimates the growth in your Horde balance for Depositing {token.name}.&nbsp; </>
            )}
            <Link underline="hover" href="https://docs.hooligan.money/almanac/guides/firm/understand-vapy" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              Learn more
            </Link>
          </Box>
        </Row>
      }
    >
      <Chip
        variant="filled"
        color={metric === 'hooligan' ? 'primary' : 'secondary'}
        label={
          <Typography sx={{ whiteSpace: 'nowrap' }}>
            <Row gap={0.5} flexWrap="nowrap" justifyContent="center">
              {variant === 'labeled' && <><TokenIcon token={tokenProps} /> vAPY:{' '}</>}
              {`${apys ? apys[metric].times(100).toFixed(1) : '0.0'}%`}
            </Row>
          </Typography>
        }
        onClick={undefined}
        size="small"
      />
    </Tooltip>
  );
};

export default FirmAssetApyChip;
