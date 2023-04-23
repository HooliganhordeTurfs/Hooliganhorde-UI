import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CircularProgress, Stack, Typography } from '@mui/material';
import useRookieListing from '~/hooks/hooliganhorde/usePodListing';
import FillListingForm from '~/components/Market/RookiesV2/Actions/Buy/FillListingForm';
import { bigNumberResult, displayBN, displayFullBN } from '~/util';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import StatHorizontal from '~/components/Common/StatHorizontal';
import Row from '~/components/Common/Row';
import TokenIcon from '~/components/Common/TokenIcon';
import GuvnorChip from '~/components/Common/FarmerChip';
import { HOOLIGAN, ROOKIES } from '~/constants/tokens';

const FillListing: React.FC<{}> = () => {
  const { listingID } = useParams<{ listingID: string }>();
  const { data: rookieListing, loading, error } = useRookieListing(listingID);
  const hooliganhorde = useHooliganhordeContract();
  
  /// Verify that this listing is still live via the contract.
  const [listingValid, setListingValid] = useState<null | boolean>(null);
  useEffect(() => {
    if (listingID) {
      (async () => {
        try {
          const _listing = await hooliganhorde.rookieListing(listingID.toString()).then(bigNumberResult);
          console.debug('[pages/listing] listing = ', _listing);
          setListingValid(_listing?.gt(0));
        } catch (e) {
          console.error(e);
          setListingValid(false);
        }
      })();
    }
  }, [hooliganhorde, listingID]);

  /// Loading isn't complete until listingValid is set
  if (loading || listingValid === null) {
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
  if (!rookieListing || !listingValid) {
    return (
      <Stack height={200} alignItems="center" justifyContent="center">
        <Typography>Listing not found.</Typography>
      </Stack>
    );
  }

  return (
    <Stack gap={2}>
      {/* Listing Details */}
      <Stack px={0.5} gap={0.75}>
        {/* add margin right of -0.5 to offset padding from guvnor chip */}
        <StatHorizontal label="Seller" maxHeight={20} sx={{ mr: -0.5 }}>
          <GuvnorChip account={rookieListing.account} />
        </StatHorizontal>
        <StatHorizontal label="Place in Line">
          {displayBN(rookieListing.placeInLine)}
        </StatHorizontal>
        <StatHorizontal label="Rookies Available">
          <Row gap={0.25}>
            <TokenIcon token={ROOKIES} />{' '}
            {displayFullBN(rookieListing.remainingAmount, 2, 0)}
          </Row>
        </StatHorizontal>
        <StatHorizontal label="Price per Rookie">
          <Row gap={0.25}>
            <TokenIcon token={HOOLIGAN[1]} />{' '}
            {displayFullBN(rookieListing.pricePerRookie, 4, 2)}
          </Row>
        </StatHorizontal>
        <StatHorizontal label="Hooligans to Fill">
          <Row gap={0.25}>
            <TokenIcon token={HOOLIGAN[1]} />{' '}
            {displayFullBN(rookieListing.remainingAmount.times(podListing.pricePerRookie), 2, 0)}
          </Row>
        </StatHorizontal>
      </Stack>
      {/* Form */}
      <FillListingForm rookieListing={podListing} />
    </Stack>
  );
};

export default FillListing;
