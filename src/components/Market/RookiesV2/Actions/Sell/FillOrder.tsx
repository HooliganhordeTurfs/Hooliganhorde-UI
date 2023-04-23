import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { bigNumberResult, displayBN, displayFullBN } from '~/util';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import useRookieOrder from '~/hooks/hooliganhorde/usePodOrder';
import FillOrderForm from '~/components/Market/RookiesV2/Actions/Sell/FillOrderForm';
import StatHorizontal from '~/components/Common/StatHorizontal';
import Row from '~/components/Common/Row';
import TokenIcon from '~/components/Common/TokenIcon';
import GuvnorChip from '~/components/Common/FarmerChip';
import { HOOLIGAN, ROOKIES } from '~/constants/tokens';

const FillOrder: React.FC<{}> = () => {
  const { orderID } = useParams<{ orderID?: string }>();
  const { data: rookieOrder, source, loading, error } = useRookieOrder(orderID);
  const hooliganhorde = useHooliganhordeContract();

  /// Verify that this order is still live via the contract.
  const [orderValid, setOrderValid] = useState<null | boolean>(null);
  useEffect(() => {
    if (orderID) {
      (async () => {
        try {
          const _order = await hooliganhorde.rookieOrderById(orderID.toString()).then(bigNumberResult);
          console.debug('[pages/order] order = ', _order);
          setOrderValid(_order?.gt(0));
        } catch (e) {
          console.error(e);
          setOrderValid(false);
        }
      })();
    }
  }, [hooliganhorde, orderID]);

  /// Loading isn't complete until orderValid is set
  if (loading || orderValid === null) {
    return (
      <Stack height={200} alignItems="center" justifyContent="center">
        <CircularProgress color="primary" />
      </Stack>
    );
  }
  if (error) {
    return (
      <Stack height={200} alignItems="center" justifyContent="center">
        <Typography>{error.message.toString()}</Typography>
      </Stack>
    );
  }
  if (!rookieOrder || !orderValid) {
    return (
      <Stack height={200} alignItems="center" justifyContent="center">
        <Typography>Order not found.</Typography>
      </Stack>
    );
  }

  return (
    <Stack gap={2}>
      {/* Listing Details */}
      <Box px={0.5}>
        <Stack gap={0.75}>
          {/* add mr of -0.5 to offset padding of guvnor chip */}
          <StatHorizontal label="Buyer" maxHeight={20} sx={{ mr: -0.5 }}>
            <GuvnorChip account={rookieOrder.account} />
          </StatHorizontal>
          <StatHorizontal label="Place in Line">
            0 - {displayBN(rookieOrder.maxPlaceInLine)}
          </StatHorizontal>
          <StatHorizontal label="Rookies Requested">
            <Row gap={0.25}>
              <TokenIcon token={ROOKIES} />{' '}
              {displayFullBN(rookieOrder.podAmountRemaining, 2, 0)}
            </Row>
          </StatHorizontal>
          <StatHorizontal label="Price per Rookie">
            <Row gap={0.25}>
              <TokenIcon token={HOOLIGAN[1]} />{' '}
              {displayFullBN(rookieOrder.pricePerRookie, 4, 2)}
            </Row>
          </StatHorizontal>
          <StatHorizontal label="Hooligans Remaining">
            <Row gap={0.25}>
              <TokenIcon token={HOOLIGAN[1]} />{' '}
              {displayFullBN(rookieOrder.podAmountRemaining.times(podOrder.pricePerRookie), 2, 0)}
            </Row>
          </StatHorizontal>
        </Stack>
      </Box>
      <FillOrderForm rookieOrder={podOrder} />
    </Stack>
  );
};

export default FillOrder;
