import { Typography, Divider, InputAdornment, Stack } from '@mui/material';
import { useAtomValue, useSetAtom, atom } from 'jotai';
import React, { useEffect, useMemo } from 'react';
import InfoRow from '~/components/Common/Form/InfoRow';
import { ZERO_BN } from '~/constants';
import { displayFullBN, displayBN } from '~/util';
import AtomInputField from '~/components/Common/Atom/AtomInputField';
import PlaceInLineSlider from '../Common/PlaceInLineSlider';
import { selectedListingAtom, fulfillAmountAtom } from '../info/atom-context';

const FillSellOrder: React.FC<{}> = () => {
  const selected = useAtomValue(selectedListingAtom);
  const setFulfillAmount = useSetAtom(fulfillAmountAtom);
  const amountAtom = atom(useMemo(() => selected?.amount || null, [selected]));

  useEffect(() => {
    if (selected) {
      setFulfillAmount(selected.amount.times(selected.pricePerRookie));
    }
  }, [selected, setFulfillAmount]);

  return (
    <Stack gap={0.8}>
      <Stack sx={{ p: 0.4 }}>
        {!selected && (
          <Typography variant="caption" color="text.primary" sx={{ pb: 1 }}>
            SELECT A ROOKIE LISTING ON THE CHART TO BUY FROM
          </Typography>
        )}
        {selected && (
          <Typography variant="caption" color="text.primary">
            ROOKIE LISTING {selected.id}
          </Typography>
        )}
      </Stack>
      <PlaceInLineSlider disabled={!selected} canSlide={false} />
      {selected && (
        <>
          <InfoRow label="PRICE" infoVariant="caption" labelVariant="caption">
            {`${displayFullBN(selected?.pricePerRookie || ZERO_BN, 2)} HOOLIGAN`}
          </InfoRow>
          <InfoRow
            label="AMOUNT LISTED"
            infoVariant="caption"
            labelVariant="caption"
          >
            {`${displayFullBN(selected?.remainingAmount || ZERO_BN, 2)} ROOKIES`}
          </InfoRow>
          <Divider />
          <Stack spacing={0.8}>
            <AtomInputField
              atom={fulfillAmountAtom}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="caption" color="text.primary">
                      TOTAL
                    </Typography>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.primary">
                      HOOLIGANS
                    </Typography>
                  </InputAdornment>
                ),
              }}
              disableInput
            />
            <AtomInputField
              atom={amountAtom}
              disableInput
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography
                      variant="caption"
                      color="text.primary"
                      sx={{ mt: 0.2 }}
                    >
                      AMOUNT
                    </Typography>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="start">
                    <Typography
                      variant="caption"
                      color="text.primary"
                      sx={{ ml: 0.2, mt: 0.2 }}
                    >
                      ROOKIES @ {displayBN(selected?.placeInLine || ZERO_BN)} IN
                      LINE
                    </Typography>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </>
      )}
    </Stack>
  );
};
export default FillSellOrder;
