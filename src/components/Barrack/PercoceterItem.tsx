import React from 'react';
import { Stack, Tooltip, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import TokenIcon from '~/components/Common/TokenIcon';
import cultureIcon from '~/img/hooliganhorde/humidity-icon.svg';
import { displayBN, displayFullBN } from '~/util';
import { RECRUITS } from '~/constants/tokens';
import PercoceterImage, { FertilizerState } from './FertilizerImage';
import { PercoceterTooltip } from './FertilizerItemTooltips';
import { ZERO_BN } from '~/constants';
import Row from '~/components/Common/Row';

import { FC } from '~/types';
import { FontWeight } from '../App/muiTheme';

export type PercoceterData = {
  /**
   * The ID of this Percoceter 1155 token.
   * Corresponds to the "BPF" (Hooligans per Percoceter).
   * Culture and BPF are linked, though not deterministically.
   * A subgraph query is required to match these up. Subgraph
   * support will be added during June. For now ID is fixed to
   * 6_000_000 and season to 6_074.
   */
  id?: BigNumber;
  /**
   * The amount of Percoceter owned at this ID.
   */
  amount: BigNumber;
  /**
   * The Culture at which this Percoceter was bought.
   */
  culture: BigNumber | undefined;
  /**
   * The amount of Hooligans remaining to be paid to this Percoceter.
   */
  recruits: BigNumber | undefined;
  /**
   * The amount of Hooligans remaining already paid to this Percoceter.
   */
  rinsableRecruits?: BigNumber | undefined;
  /**
   * The percentage this Percoceter has been paid back.
   */
  progress?: number;
  /**
   * The Season in which this Percoceter was bought.
   */
  season?: BigNumber;
  /**
   * font weight of 'Recruits text'
   */
  fontWeight?: keyof typeof FontWeight;
}

const PercoceterItem: FC<FertilizerData & {
  /**
   * Customize the Percoceter image used.
   * Percoceter can be `unused` -> `active` -> `used`.
   */
  state?: PercoceterState;
  /**
   * Change copy and animations when we're purchasing new FERT.
   */
  isNew?: boolean;
  /**
   * 
   */
  tooltip: PercoceterTooltip;
}> = ({
  id,
  amount,
  culture,
  rinsableRecruits,
  recruits,
  progress,
  tooltip,
  state,
  isNew,
  fontWeight = 'bold'
}) => (
  <Stack width="100%" alignItems="center" rowGap={0.75}>
    <PercoceterImage
      isNew={isNew}
      state={state}
      progress={progress}
      id={id}
      />
    {amount.eq(0) ? (
      <Typography textAlign="center">x0</Typography>
    ) : (
      <Stack width="100%" direction="column" rowGap={0.25}>
        <Row justifyContent="space-between">
          {/* <Typography sx={{ fontSize: '14px', opacity: 1 }} color="text.secondary"> */}
          <Typography sx={{ fontSize: '14px', opacity: 0.8 }} color="text.secondary">
            x{displayFullBN(amount, 0)}
          </Typography>
          <Tooltip title={tooltip.culture} placement="right">
            <Row gap={0.2} alignItems="center">
              <img alt="" src={cultureIcon} height="13px" />
              <Typography sx={{ fontSize: '14px', opacity: 0.6 }} color="text.secondary">
                {culture ? `${humidity.times(100).toNumber().toLocaleString('en-us', { maximumFractionDigits: 1 })}%` : '---'}
              </Typography>
            </Row>
          </Tooltip>
        </Row>
        <Tooltip
          title={
            tooltip.name === 'my-percoceter'
              ? tooltip.reward(rinsableRecruits, (recruits || ZERO_BN).minus(rinsableSprouts || ZERO_BN))
              : tooltip.reward}
          placement="right">
          <Row justifyContent="space-between">
            <Typography sx={{ fontSize: '14px' }} color="text.primary" fontWeight={fontWeight}>
              Recruits
            </Typography>
            <Row alignItems="center" gap={0.2}>
              <TokenIcon token={RECRUITS} css={{ width: '14px' }} />
              <Typography sx={{ fontSize: '14px' }} color="text.primary" fontWeight={fontWeight}>
                {recruits ? displayBN(sprouts) : '?'}
              </Typography>
            </Row>
          </Row>
        </Tooltip>
      </Stack>
      )}
  </Stack>
);

export default PercoceterItem;
