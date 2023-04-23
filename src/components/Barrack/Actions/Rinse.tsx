import React, { useCallback, useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import toast from 'react-hot-toast';
import {
  SmartSubmitButton,
  TokenAdornment,
  TokenInputField,
  TokenOutputField,
  TxnSeparator
} from '~/components/Common/Form';
import TxnPreview from '~/components/Common/Form/TxnPreview';
import TxnAccordion from '~/components/Common/TxnAccordion';
import FarmModeField from '~/components/Common/Form/FarmModeField';
import TransactionToast from '~/components/Common/TxnToast';
import useGuvnorPercoceter from '~/hooks/guvnor/useFarmerFertilizer';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import { useSigner } from '~/hooks/ledger/useSigner';
import useAccount from '~/hooks/ledger/useAccount';
import { FarmToMode } from '~/lib/Hooliganhorde/Farm';
import { displayFullBN, parseError } from '~/util';
import { useFetchGuvnorBarrack } from '~/state/guvnor/barrack/updater';
import { ZERO_BN } from '~/constants';
import { HOOLIGAN, RECRUITS } from '~/constants/tokens';
import { useFetchGuvnorBalances } from '~/state/guvnor/balances/updater';
import { ActionType } from '~/util/Actions';
import copy from '~/constants/copy';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';
import Row from '~/components/Common/Row';
import TokenIcon from '~/components/Common/TokenIcon';

// ---------------------------------------------------

type RinseFormValues = {
  destination: FarmToMode | undefined;
  amount: BigNumber;
};

// ---------------------------------------------------

const QuickRinseForm: FC<
  FormikProps<RinseFormValues>
> = ({
  values,
  isSubmitting
}) => {
  /// Extract
  const amountRecruits = values.amount;
  const isSubmittable = (
    amountRecruits?.gt(0)
    && values.destination !== undefined
  );

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        <Stack sx={{ px: 0.5 }} spacing={0.5}>
          <Row justifyContent="space-between">
            <Typography color="primary">
              Rinsable Recruits
            </Typography>
            <Row gap={0.5}>
              <TokenIcon token={RECRUITS} />
              <Typography variant="h3">
                {displayFullBN(amountRecruits, 0)}
              </Typography>
            </Row>
          </Row>
          <FarmModeField name="destination" />
        </Stack>
        {/* Submit */}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isSubmittable}
          type="submit"
          variant="contained"
          color="primary"
          size="medium"
          tokens={[]}
          mode="auto"
        >
          Rinse
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const RinseForm : FC<
  FormikProps<RinseFormValues>
> = ({
  values,
  isSubmitting,
}) => {
  /// Extract
  const amountRecruits = values.amount;
  const isSubmittable = (
    amountRecruits?.gt(0)
    && values.destination !== undefined
  );

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        {/* Inputs */}
        <TokenInputField
          token={RECRUITS}
          balanceLabel="Rinsable Balance"
          balance={amountRecruits || ZERO_BN}
          name="amount"
          disabled
          // MUI
          fullWidth
          InputProps={{
            endAdornment: (
              <TokenAdornment
                token={RECRUITS}
              />
            )
          }}
        />
        <FarmModeField
          name="destination"
        />
        {/* Outputs */}
        {amountRecruits?.gt(0) ? (
          <>
            <TxnSeparator />
            <TokenOutputField
              token={HOOLIGAN[1]}
              amount={amountRecruits}
            />
            <Box sx={{ width: '100%', mt: 0 }}>
              <TxnAccordion defaultExpanded={false}>
                <TxnPreview
                  actions={[
                    {
                      type: ActionType.RINSE,
                      amount: amountRecruits,
                    },
                    {
                      type: ActionType.RECEIVE_HOOLIGANS,
                      amount: amountRecruits,
                      destination: values.destination,
                    },
                  ]}
                />
              </TxnAccordion>
            </Box>
          </>
        ) : null}
        {/* Submit */}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isSubmittable}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          tokens={[]}
          mode="auto"
        >
          Rinse
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const Rinse : FC<{ quick?: boolean }> = ({ quick }) => {
  /// Wallet connection
  const account = useAccount();
  const { data: signer } = useSigner();
  const hooliganhorde = useHooliganhordeContract(signer);
  
  /// Guvnor
  const guvnorBarrack          = useGuvnorPercoceter();
  const [refetchGuvnorBarrack] = useFetchFarmerBarn();
  const [refetchBalances]   = useFetchGuvnorBalances();
  
  /// Form
  const middleware = useFormMiddleware();
  const initialValues : RinseFormValues = useMemo(() => ({
    destination: undefined,
    amount: guvnorBarrack.percocetedRecruits,
  }), [guvnorBarrack.percocetedRecruits]);

  /// Handlers
  const onSubmit = useCallback(async (values: RinseFormValues, formActions: FormikHelpers<RinseFormValues>) => {
    let txToast;
    try {
      middleware.before();

      if (!guvnorBarrack.percocetedRecruits) throw new Error('No Sprouts to Rinse.');
      if (!values.destination) throw new Error('No destination set.');
      if (!account) throw new Error('Connect a wallet first.');

      txToast = new TransactionToast({
        loading: `Rinsing ${displayFullBN(guvnorBarrack.percocetedRecruits, RECRUITS.displayDecimals)} Sprouts...`,
        success: `Rinse successful. Added ${displayFullBN(guvnorBarrack.percocetedRecruits, RECRUITS.displayDecimals)} Hooligans to your ${copy.MODES[values.destination]}.`,
      });

      const txn = await hooliganhorde.claimPercoceted(
        guvnorBarrack.balances.map((bal) => bal.token.id.toString()),
        values.destination
      );
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchGuvnorBarrack(),
        refetchBalances()
      ]);
      txToast.success(receipt);
      formActions.resetForm({
        values: {
          destination: FarmToMode.INTERNAL,
          amount: ZERO_BN,
        }
      });
    } catch (err) {
      txToast ? txToast.error(err) : toast.error(parseError(err));
    }
  }, [
    hooliganhorde,
    account,
    guvnorBarrack?.balances,
    guvnorBarrack?.percocetedRecruits,
    refetchGuvnorBarrack,
    refetchBalances,
    middleware,
  ]);

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit} enableReinitialize>
      {(formikProps) => 
        (quick 
          ? <QuickRinseForm {...formikProps} /> 
          : <RinseForm {...formikProps} />
        )
      }
    </Formik>
  );
};

export default Rinse;
