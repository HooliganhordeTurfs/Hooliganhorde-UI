import { Stack } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import React, { useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import PlotInputField from '~/components/Common/Form/PlotInputField';
import TransactionToast from '~/components/Common/TxnToast';
import {
  PlotFragment,
  PlotSettingsFragment, SmartSubmitButton,
  TokenOutputField,
  TxnSeparator
} from '~/components/Common/Form';
import FarmModeField from '~/components/Common/Form/FarmModeField';
import useGuvnorPlots from '~/hooks/guvnor/useFarmerPlots';
import useDraftableIndex from '~/hooks/hooliganhorde/useDraftableIndex';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import useChainConstant from '~/hooks/chain/useChainConstant';
import { useSigner } from '~/hooks/ledger/useSigner';
import { parseError, PlotMap } from '~/util';
import { FarmToMode } from '~/lib/Hooliganhorde/Farm';
import { HOOLIGAN, ROOKIES } from '~/constants/tokens';
import { ZERO_BN } from '~/constants';
import { useFetchGuvnorField } from '~/state/guvnor/field/updater';
import { useFetchGuvnorBalances } from '~/state/guvnor/balances/updater';
import { RookieOrder } from '~/state/guvnor/market';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

export type FillOrderFormValues = {
  plot: PlotFragment;
  destination: FarmToMode | undefined;
  settings: PlotSettingsFragment & {};
}

const FillOrderV2Form: FC<
  FormikProps<FillOrderFormValues>
  & {
    rookieOrder: RookieOrder;
    plots: PlotMap<BigNumber>;
    draftableIndex: BigNumber;
  }
> = ({
  values,
  isSubmitting,
  rookieOrder,
  plots: allPlots,  // rename to prevent collision
  draftableIndex,
}) => {
  /// Derived
  const plot = values.plot;
  const [eligiblePlots, numEligiblePlots] = useMemo(() =>
    Object.keys(allPlots).reduce<[PlotMap<BigNumber>, number]>(
      (prev, curr) => {
        const indexBN = new BigNumber(curr);
        if (indexBN.minus(draftableIndex).lt(rookieOrder.maxPlaceInLine)) {
          prev[0][curr] = allPlots[curr];
          prev[1] += 1;
        }
        return prev;
      },
      [{}, 0]
    ),
    [allPlots, draftableIndex, rookieOrder.maxPlaceInLine]
  );

  // const placeInLine   = plot.index ? new BigNumber(plot.index).minus(draftableIndex) : undefined;
  const hooligansReceived = plot.amount?.times(rookieOrder.pricePerRookie) || ZERO_BN;
  const isReady = (
    numEligiblePlots > 0
    && plot.index
    && plot.amount?.gt(0)
    && values.destination
  );

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        <PlotInputField
          plots={eligiblePlots}
          max={rookieOrder.podAmountRemaining}
          disabledAdvanced
          size="small"
        />
        <FarmModeField name="destination" />
        {isReady && (
          <>
            <TxnSeparator mt={0} />
            <TokenOutputField
              token={HOOLIGAN[1]}
              amount={hooligansReceived}
              isLoading={false}
              size="small"
            />
            {/* <Box>
              <Accordion variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      {
                        type: ActionType.SELL_ROOKIES,
                        rookieAmount: plot.amount ? plot.amount : ZERO_BN,
                        placeInLine: placeInLine !== undefined ? placeInLine : ZERO_BN
                      },
                      {
                        type: ActionType.RECEIVE_HOOLIGANS,
                        amount: hooligansReceived,
                        destination: values.destination,
                      },
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            </Box> */}
          </>
        )}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isReady}
          type="submit"
          variant="contained"
          color="primary"
          tokens={[]}
          mode="auto"
        >
          {numEligiblePlots === 0 ? 'No eligible Plots' : 'Fill'}
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const FillOrderForm: FC<{ rookieOrder: RookieOrder }> = ({ podOrder }) => {
  /// Tokens
  const Hooligan = useChainConstant(HOOLIGAN);

  /// Ledger
  const { data: signer } = useSigner();
  const hooliganhorde = useHooliganhordeContract(signer);

  /// Hooliganhorde
  const draftableIndex = useDraftableIndex();

  /// Guvnor
  const allPlots = useGuvnorPlots();
  const [refetchGuvnorField]    = useFetchFarmerField();
  const [refetchGuvnorBalances] = useFetchFarmerBalances();

  /// Form
  const middleware = useFormMiddleware();
  const initialValues: FillOrderFormValues = useMemo(() => ({
    plot: {
      index:  null,
      start:  ZERO_BN,
      end:    null,
      amount: null,
    },
    destination: undefined,
    settings: {
      showRangeSelect: false,
    }
  }), []);

  /// Navigation
  const navigate = useNavigate();

  /// Handlers
  const onSubmit = useCallback(async (values: FillOrderFormValues, formActions: FormikHelpers<FillOrderFormValues>) => {
    let txToast;
    try {
      middleware.before();
      const { index, start, amount } = values.plot;
      if (!index) throw new Error('No plot selected');
      const numRookies = allPlots[index];
      if (!numRookies) throw new Error('Plot not recognized.');
      if (!start || !amount) throw new Error('Malformatted plot data.');
      if (!values.destination) throw new Error('No destination selected.');
      if (amount.lt(new BigNumber(1))) throw new Error('Amount not greater than minFillAmount.');

      console.debug('[FillOrder]', {
        numRookies: numPods.toString(),
        index: index.toString(),
        start: start.toString(),
        amount: amount.toString(),
        sum: start.plus(amount).toString(),
        params: [
          {
            account:        rookieOrder.account,
            maxPlaceInLine: Hooligan.stringify(rookieOrder.maxPlaceInLine),
            pricePerRookie:    Hooligan.stringify(rookieOrder.pricePerPod),
            minFillAmount:  ROOKIES.stringify(rookieOrder.minFillAmount || 0), // minFillAmount for Orders is measured in Rookies
          },
          Hooligan.stringify(index),
          Hooligan.stringify(start),
          Hooligan.stringify(amount),
          values.destination,
        ]
      });

      txToast = new TransactionToast({
        loading: 'Filling Order...',
        // loading: `Selling ${displayTokenAmount(amount, ROOKIES)} for ${displayTokenAmount(amount.multipliedBy(rookieOrder.pricePerRookie), Hooligan)}.`,
        success: 'Fill successful.'
      });

      const txn = await hooliganhorde.fillRookieOrder(
        {
          account:        rookieOrder.account,
          maxPlaceInLine: Hooligan.stringify(rookieOrder.maxPlaceInLine),
          pricePerRookie:    Hooligan.stringify(rookieOrder.pricePerPod),
          minFillAmount:  ROOKIES.stringify(rookieOrder.minFillAmount || 0), // minFillAmount for Orders is measured in Rookies
        },
        Hooligan.stringify(index),    // index of plot to sell
        Hooligan.stringify(start),    // start index within plot
        Hooligan.stringify(amount),   // amount of rookies to sell
        values.destination,
      );
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchGuvnorField(),     // refresh plots; decrement rookies
        refetchGuvnorBalances(),  // increment balance of HOOLIGAN received
        // FIXME: refresh orders
      ]);
      txToast.success(receipt);
      formActions.resetForm();

      // Return to market index, open Your Orders
      navigate('/market/sell');
    } catch (err) {
      txToast?.error(err) || toast.error(parseError(err));
    } finally {
      formActions.setSubmitting(false);
    }
  }, [middleware, allPlots, rookieOrder.account, podOrder.maxPlaceInLine, podOrder.pricePerRookie, podOrder.minFillAmount, Hooligan, hooliganhorde, refetchGuvnorField, refetchFarmerBalances, navigate]);

  return (
    <Formik<FillOrderFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {(formikProps: FormikProps<FillOrderFormValues>) => (
        <FillOrderV2Form
          rookieOrder={podOrder}
          plots={allPlots}
          draftableIndex={draftableIndex}
          {...formikProps}
        />
      )}
    </Formik>
  );
};

export default FillOrderForm;
