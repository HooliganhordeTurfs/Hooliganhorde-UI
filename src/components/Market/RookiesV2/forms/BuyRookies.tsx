import { Stack, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { RookieOrderType, rookiesOrderTypeAtom } from '../info/atom-context';
import Soon from '~/components/Common/ZeroState/Soon';
import CreateOrder from '~/components/Market/RookiesV2/Actions/Buy/CreateOrder';
import useRookieListing from '~/hooks/hooliganhorde/usePodListing';
import StatHorizontal from '~/components/Common/StatHorizontal';
import { displayBN, displayFullBN } from '~/util';
import { HOOLIGAN, ROOKIES } from '~/constants/tokens';
import Row from '~/components/Common/Row';
import TokenIcon from '~/components/Common/TokenIcon';

const BuyRookies: React.FC<{}> = () => {
  const orderType = useAtomValue(rookiesOrderTypeAtom);
  const { listingID } = useParams<{ listingID: string }>();
  const { data: listing } = useRookieListing(listingID);

  return (
    <Stack p={1} gap={1}>
      {/* ORDER & FILL / LIST & FILL */}
      {/* <SubActionSelect /> */}
      {/* Stats */}
      {listing && orderType === RookieOrderType.FILL && (
        <div>
          <StatHorizontal label="Place in Line">
            {displayBN(listing.placeInLine)}
          </StatHorizontal>
          <StatHorizontal label="Price per Rookie">
            <Row gap={0.25}>
              <TokenIcon token={HOOLIGAN[1]} />{' '}
              {displayFullBN(listing.pricePerRookie, 4, 2)}
            </Row>
          </StatHorizontal>
          <StatHorizontal label="Amount">
            <Row gap={0.25}>
              <TokenIcon token={ROOKIES} />{' '}
              {displayFullBN(listing.remainingAmount, 2, 0)}
            </Row>
          </StatHorizontal>
        </div>
      )}
      {orderType === RookieOrderType.ORDER && <CreateOrder />}
      {orderType === RookieOrderType.FILL && (
        <>
          {listingID ? (
            <Outlet />
          ) : (
            <Soon>
              <Typography textAlign="center" color="gray">
                Select a Rookie Listing on the chart to buy from.
              </Typography>
            </Soon>
          )}
        </>
      )}
    </Stack>
  );
};

export default BuyRookies;
