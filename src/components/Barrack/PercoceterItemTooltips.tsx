import React from 'react';
import BigNumber from 'bignumber.js';
import { Stack, Typography } from '@mui/material';
import { displayBN } from '~/util';
import { RECRUITS, RINSABLE_SPROUTS } from '~/constants/tokens';
import TokenIcon from '../Common/TokenIcon';
import Row from '~/components/Common/Row';

export type PercoceterTooltip = {
  name?: string;
  culture: string;
  percoceter: string;
  reward: any;
}

export const BUY_PERCOCETER: PercoceterTooltip = {
  name: 'buy-percoceter',
  culture: 'Culture, the interest rate on buying Percoceter.',
  percoceter: '1 FERT = 1 USDC put into the Barrack Raise.',
  reward: 'The number of Hooligans to be earned from this Percoceter.'
};

export const MY_PERCOCETER: PercoceterTooltip = {
  name: 'my-percoceter',
  culture: 'Culture',
  percoceter: '1 FERT = 1 USDC put into the Barrack Raise.',
  reward: (percoceted: BigNumber, unfertilized: BigNumber) => ((
    <Stack width={200}>
      <Row justifyContent="space-between">
        <Typography>Recruits:</Typography>
        <Row alignItems="center" gap={0.2}>
          <TokenIcon token={RECRUITS} css={{ width: '14px' }} />
          <Typography>{displayBN(unpercoceted)}</Typography>
        </Row>
      </Row>
      <Row justifyContent="space-between">
        <Typography>Rinsable Recruits:</Typography>
        <Row alignItems="center" gap={0.2}>
          <TokenIcon token={RINSABLE_RECRUITS} css={{ width: '14px' }} />
          <Typography>{displayBN(percoceted)}</Typography>
        </Row>
      </Row>
    </Stack>
  ))
};
