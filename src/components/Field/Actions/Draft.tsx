import React, { useCallback, useMemo } from 'react';
import { Accordion, AccordionDetails, Box, Stack, Typography } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import BigNumber from 'bignumber.js';
import { useAccount as useWagmiAccount, useProvider } from 'wagmi';
import toast from 'react-hot-toast';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import {
  SmartSubmitButton, TokenInputField, TokenOutputField,
  TxnPreview,
  TxnSeparator
} from '~/components/Common/Form';
import { useSigner } from '~/hooks/ledger/useSigner';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import { ActionType } from '~/util/Actions';
import Farm, { FarmToMode } from '~/lib/Hooliganhorde/Farm';
import {
  displayFullBN,
  parseError,
  toStringBaseUnitBN
} from '~/util';
import useGuvnorField from '~/hooks/guvnor/useFarmerField';
import { useFetchGuvnorField } from '~/state/guvnor/field/updater';
import { useFetchGuvnorBalances } from '~/state/guvnor/balances/updater';
import { HOOLIGAN, ROOKIES } from '~/constants/tokens';
import copy from '~/constants/copy';
import FarmModeField from '~/components/Common/Form/FarmModeField';
import TransactionToast from '~/components/Common/TxnToast';
import { ZERO_BN } from '~/constants';
import TokenAdornment from '~/components/Common/Form/TokenAdornment';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';
import Row from '~/components/Common/Row';
import TokenIcon from '~/components/Common/TokenIcon';

// -----------------------------------------------------------------------

type DraftFormValues = {
  amount: BigNumber;
  destination: FarmToMode | undefined;
}

type Props = FormikProps<DraftFormValues> & {
  draftableRookies: BigNumber;
  farm: Farm;
}

const QuickDraftForm: FC<Props> = ({
  // Custom
  draftableRookies,
  // Formike
  values,
  isSubmitting
}) => {
    /// Derived
    const amount = draftableRookies;
    const isSubmittable = (
      amount
      && amount.gt(0)
      && values.destination !== undefined
    );

    return (
      <Form autoComplete="off" noValidate>
        <Stack gap={1}>
          <Stack px={0.5} spacing={0.5}>
            <Row justifyContent="space-between">
              <Typography color="primary">
                Draftable Rookies
              </Typography>
              <Row gap={0.5}>
                <TokenIcon token={ROOKIES} />
                <Typography variant="h3">
                  {displayFullBN(amount, 0)}
                </Typography>
              </Row>
            </Row>
            <FarmModeField name="destination" />
          </Stack>
          <SmartSubmitButton
            loading={isSubmitting}
            disabled={!isSubmittable || isSubmitting}
            type="submit"
            variant="contained"
            color="primary"
            size="medium"
            tokens={[]}
            mode="auto"
        >
            Draft
          </SmartSubmitButton>
        </Stack>
      </Form>
    );
};

// -----------------------------------------------------------------------

const DraftForm: FC<Props> = ({
  // Custom
  draftableRookies,
  // Formik
  values,
  isSubmitting,
}) => {
  /// Derived
  const amount = draftableRookies;
  const isSubmittable = (
    amount
    && amount.gt(0)
    && values.destination !== undefined
  );

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        {/* Claimable Token */}
        <TokenInputField
          name="amount"
          balance={amount}
          balanceLabel="Draftable Balance"
          disabled
          InputProps={{
            endAdornment: (
              <TokenAdornment
                token={ROOKIES}
              />
            )
          }}
        />
        {/* Transaction Details */}
        {values.amount?.gt(0) ? (
          <>
            {/* Setting: Destination */}
            <FarmModeField
              name="destination"
            />
            <TxnSeparator mt={-1} />
            <TokenOutputField
              token={HOOLIGAN[1]}
              amount={values.amount || ZERO_BN}
            />
            {/* <Box>
              <Alert
                color="warning"
                icon={
                  <IconWrapper boxSize={IconSize.medium}><WarningAmberIcon
                    sx={{ fontSize: IconSize.small }} />
                  </IconWrapper>
                }
              >
                You can Draft your Rookies and Deposit Hooligans into the Firm in one transaction on the&nbsp;
                <Link href={`/#/firm/${hooligan.address}`}>Hooligan</Link> or <Link href={`/#/firm/${lp.address}`}>LP</Link> Deposit
                page.
              </Alert>
            </Box> */}
            <Box>
              <Accordion variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      {
                        type: ActionType.DRAFT,
                        amount: amount
                      },
                      {
                        type: ActionType.RECEIVE_HOOLIGANS,
                        amount: amount,
                        destination: values.destination,
                      },
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          </>
        ) : null}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isSubmittable || isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          tokens={[]}
          mode="auto"
        >
          Draft
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

const Draft: FC<{ quick?: boolean }> = ({ quick }) => {
  ///
  const account = useWagmiAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const hooliganhorde = useHooliganhordeContract(signer);

  /// Farm
  const farm = useMemo(() => new Farm(provider), [provider]);

  /// Guvnor
  const guvnorField = useGuvnorField();
  const [refetchGuvnorField] = useFetchFarmerField();
  const [refetchGuvnorBalances] = useFetchFarmerBalances();

  /// Form
  const middleware = useFormMiddleware();
  const initialValues: DraftFormValues = useMemo(() => ({
    amount: guvnorField.draftableRookies || null,
    destination: undefined,
  }), [guvnorField.draftableRookies]);

  /// Handlers
  const onSubmit = useCallback(
    async (
      values: DraftFormValues,
      formActions: FormikHelpers<DraftFormValues>
    ) => {
      let txToast;
      try {
        middleware.before();
        if (!guvnorField.draftableRookies.gt(0)) throw new Error('No Draftable Pods.');
        if (!guvnorField.draftablePlots) throw new Error('No Draftable Plots.');
        if (!account?.address) throw new Error('Connect a wallet first.');
        if (!values.destination) throw new Error('No destination set.');

        txToast = new TransactionToast({
          loading: `Drafting ${displayFullBN(guvnorField.draftableRookies, ROOKIES.displayDecimals)} Pods.`,
          success: `Draft successful. Added ${displayFullBN(guvnorField.draftableRookies, ROOKIES.displayDecimals)} Hooligans to your ${copy.MODES[values.destination]}.`,
        });

        const txn = await hooliganhorde.draft(
          Object.keys(guvnorField.draftablePlots).map((draftIndex) =>
            toStringBaseUnitBN(draftIndex, 6)
          ),
          values.destination
        );
        txToast.confirming(txn);

        const receipt = await txn.wait();
        await Promise.all([
          refetchGuvnorField(),
          refetchGuvnorBalances()
        ]);
        txToast.success(receipt);
        formActions.resetForm();
      } catch (err) {
        txToast ? txToast.error(err) : toast.error(parseError(err));
        formActions.setSubmitting(false);
      }
    },
    [
      account?.address,
      hooliganhorde,
      guvnorField.draftablePlots,
      guvnorField.draftableRookies,
      refetchGuvnorBalances,
      refetchGuvnorField,
      middleware,
    ]
  );

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formikProps) => (
        <Stack spacing={1}>
          {quick ? (
            <QuickDraftForm 
              draftableRookies={guvnorField.draftablePods}
              farm={farm}
              {...formikProps}
            />
          ) : (
            <DraftForm
              draftableRookies={guvnorField.draftablePods}
              farm={farm}
              {...formikProps}
          />
          )}
        </Stack>
      )}
    </Formik>
  );
};

export default Draft;
