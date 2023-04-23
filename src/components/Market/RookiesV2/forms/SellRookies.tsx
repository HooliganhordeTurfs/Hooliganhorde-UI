import { Stack, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { RookieOrderType, rookiesOrderTypeAtom } from '../info/atom-context';
import CreateListingV2 from '~/components/Market/RookiesV2/Actions/Sell/CreateListing';
import Soon from '~/components/Common/ZeroState/Soon';
import StatHorizontal from '~/components/Common/StatHorizontal';
import { displayBN, displayFullBN } from '~/util';
import Row from '~/components/Common/Row';
import TokenIcon from '~/components/Common/TokenIcon';
import { HOOLIGAN, ROOKIES } from '~/constants/tokens';
import useRookieOrder from '~/hooks/hooliganhorde/usePodOrder';

const SellRookies: React.FC<{}> = () => {
  const orderType = useAtomValue(rookiesOrderTypeAtom);
  const { orderID } = useParams<{ orderID: string }>();
  const { data: order } = useRookieOrder(orderID);

  return (
    <Stack>
      <Stack p={1} gap={1}>
        {/* buy or sell toggle */}
        {/* <SubActionSelect /> */}
        {order && orderType === RookieOrderType.FILL && (
          <>
            <StatHorizontal
              label="Place in Line"
              labelTooltip="Any Rookie in this range is eligible to sell to this Order."
            >
              0 - {displayBN(order.maxPlaceInLine)}
            </StatHorizontal>
            <StatHorizontal label="Price per Rookie">
              <Row gap={0.25}>
                <TokenIcon token={HOOLIGAN[1]} />{' '}
                {displayFullBN(order.pricePerRookie, 4, 2)}
              </Row>
            </StatHorizontal>
            <StatHorizontal label="Amount">
              <Row gap={0.25}>
                <TokenIcon token={ROOKIES} />{' '}
                {displayFullBN(order.rookieAmountRemaining, 2, 0)}
              </Row>
            </StatHorizontal>
          </>
        )}
        {/* create buy order */}
        {/* {orderType === RookieOrderType.ORDER && <CreateBuyOrder />} */}
        {orderType === RookieOrderType.LIST && <CreateListingV2 />}
        {/* fill sell order */}
        {/* {orderType === RookieOrderType.FILL && <FillBuyListing />} */}
        {orderType === RookieOrderType.FILL && (
          <>
            {orderID ? (
              <Outlet />
            ) : (
              <Soon>
                <Typography textAlign="center" color="gray">
                  Select a rookie order on the chart to sell to.
                </Typography>
              </Soon>
            )}
          </>
        )}
      </Stack>
      {/* <Divider /> */}
      {/* submit buy order */}
      {/* <Stack p={0.8}> */}
      {/*  <SubmitMarketAction /> */}
      {/* </Stack> */}
    </Stack>
  );
};

export default SellRookies;
