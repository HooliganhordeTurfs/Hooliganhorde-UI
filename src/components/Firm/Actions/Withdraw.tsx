import React, { useCallback, useMemo } from 'react';
import { Accordion, AccordionDetails, Alert, Box, Divider, Stack } from '@mui/material';
import BigNumber from 'bignumber.js';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Token } from '~/classes';
import { PROSPECTS, HORDE } from '~/constants/tokens';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import {
  FormState,
  TxnPreview,
  TokenOutputField,
  TokenInputField,
  TokenAdornment,
  TxnSeparator,
  SmartSubmitButton
} from '~/components/Common/Form';
import HooliganhordeSDK from '~/lib/Hooliganhorde';
import useSeason from '~/hooks/hooliganhorde/useSeason';
import { GuvnorFirm } from '~/state/guvnor/firm';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import { displayFullBN, parseError, toStringBaseUnitBN } from '~/util';
import TransactionToast from '~/components/Common/TxnToast';
import { useSigner } from '~/hooks/ledger/useSigner';
import { ERC20Token } from '~/classes/Token';
import { AppState } from '~/state';
import { ActionType } from '~/util/Actions';
import { ZERO_BN } from '~/constants';
import { useFetchGuvnorFirm } from '~/state/guvnor/firm/updater';
import { useFetchHooliganhordeFirm } from '~/state/hooliganhorde/firm/updater';
import IconWrapper from '../../Common/IconWrapper';
import { IconSize } from '../../App/muiTheme';
import useGuvnorFirm from '~/hooks/guvnor/useFarmerFirm';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

// -----------------------------------------------------------------------

type WithdrawFormValues = FormState;

const WithdrawForm : FC<
  FormikProps<WithdrawFormValues> & {
    token: Token;
    firmBalances: GuvnorFirm['balances'];
    depositedBalance: BigNumber;
    withdrawSeasons: BigNumber;
    season: BigNumber;
  }
> = ({
  // Formik
  values,
  isSubmitting,
  submitForm,
  // Custom
  token: whitelistedToken,
  firmBalances,
  depositedBalance,
  withdrawSeasons,
  season,
}) => {
  // Input props
  const InputProps = useMemo(() => ({
    endAdornment: (
      <TokenAdornment token={whitelistedToken} />
    )
  }), [whitelistedToken]);

  // Confirmation dialog
  // const CONFIRM_DELAY = 2000; // ms
  // const [confirming, setConfirming] = useState(false);
  // const [allowConfirm, setAllowConfirm] = useState(false);
  // const [fill, setFill] = useState('');
  // const onClose = useCallback(() => {
  //   setConfirming(false);
  //   setAllowConfirm(false);
  //   setFill('');
  // }, []);
  // const onOpen  = useCallback(() => {
  //   setConfirming(true);
  //   setTimeout(() => {
  //     setFill('fill');
  //   }, 0);
  //   setTimeout(() => {
  //     setAllowConfirm(true);
  //   }, CONFIRM_DELAY);
  // }, []);
  // const onSubmit = useCallback(() => {
  //   submitForm();
  //   onClose();
  // }, [onClose, submitForm]);

  // Results
  const withdrawResult = HooliganhordeSDK.Firm.Withdraw.withdraw(
    whitelistedToken,
    values.tokens,
    firmBalances[whitelistedToken.address]?.deposited.crates || [], // fallback
    season,
  );
  const isReady = (withdrawResult && withdrawResult.amount.lt(0));

  // For the Withdraw form, move this fragment outside of the return
  // statement because it's displayed twice (once in the form and)
  // once in the final popup
  const tokenOutputs = isReady ? (
    <>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="center">
        <Box sx={{ flex: 1 }}>
          <TokenOutputField
            token={HORDE}
            amount={withdrawResult.horde}
            amountTooltip={(
              <>
                <div>Withdrawing from {withdrawResult.deltaCrates.length} Deposit{withdrawResult.deltaCrates.length === 1 ? '' : 's'}:</div>
                <Divider sx={{ opacity: 0.2, my: 1 }} />
                {withdrawResult.deltaCrates.map((_crate, i) => (
                  <div key={i}>
                    Season {_crate.season.toString()}: {displayFullBN(_crate.bdv, whitelistedToken.displayDecimals)} BDV, {displayFullBN(_crate.horde, HORDE.displayDecimals)} HORDE, {displayFullBN(_crate.prospects, PROSPECTS.displayDecimals)} PROSPECTS
                  </div>
                ))}
              </>
            )}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <TokenOutputField
            token={PROSPECTS}
            amount={withdrawResult.prospects}
          />
        </Box>
      </Stack>
      <Alert
        color="warning"
        icon={<IconWrapper boxSize={IconSize.medium}><WarningAmberIcon sx={{ fontSize: IconSize.small }} /></IconWrapper>}
      >
        You can Claim your Withdrawn assets at the start of the next Season.
      </Alert>
    </>
  ) : null;

  return (
    <Form autoComplete="off" noValidate>
      {/* Confirmation Dialog */}
      {/* <StyledDialog open={confirming} onClose={onClose}>
        <StyledDialogTitle onClose={onClose}>Confirm Firm Withdrawal</StyledDialogTitle>
        <StyledDialogContent sx={{ pb: 1 }}>
          <Stack direction="column" gap={1}>
            <Box>
              <Typography variant="body2">
                You will forfeit .0001% ownership of Hooliganhorde. Withdrawing will burn your Grown Horde & Prospects associated with your initial Deposit. 
              </Typography>
            </Box>
            {tokenOutputs}
          </Stack>
        </StyledDialogContent>
        <StyledDialogActions>
          <Button disabled={!allowConfirm} type="submit" onClick={onSubmit} variant="contained" color="warning" size="large" fullWidth sx={{ position: 'relative', overflow: 'hidden' }}>
            <Box
              sx={{
                background: 'rgba(0,0,0,0.03)',
                // display: !allowConfirm ? 'none' : 'block',
                width: '100%',
                transition: `height ${CONFIRM_DELAY}ms linear`,
                height: '0%',
                position: 'absolute',
                left: 0,
                bottom: 0,
                '&.fill': {
                  transition: `height ${CONFIRM_DELAY}ms linear`,
                  height: '100%',
                }
              }}
              className={fill}
            />
            Confirm Withdrawal
          </Button>
        </StyledDialogActions>
      </StyledDialog> */}
      {/* Form Content */}
      <Stack gap={1}>
        <TokenInputField
          name="tokens.0.amount"
          token={whitelistedToken}
          disabled={!depositedBalance || depositedBalance.eq(0)}
          balance={depositedBalance || ZERO_BN}
          balanceLabel="Deposited Balance"
          InputProps={InputProps}
        />
        {isReady ? (
          <Stack direction="column" gap={1}>
            <TxnSeparator />
            {tokenOutputs}
            <Box>
              <Accordion defaultExpanded variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      {
                        type: ActionType.WITHDRAW,
                        amount: withdrawResult.amount,
                        token: whitelistedToken,
                      },
                      {
                        type: ActionType.UPDATE_FIRM_REWARDS,
                        horde: withdrawResult.horde,
                        prospects: withdrawResult.prospects,
                      },
                      {
                        type: ActionType.IN_TRANSIT,
                        amount: withdrawResult.amount,
                        token: whitelistedToken,
                        withdrawSeasons
                      }
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          </Stack>
        ) : null}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isReady || isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          tokens={[]}
          mode="auto"
        >
          Withdraw
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

// -----------------------------------------------------------------------

const Withdraw : FC<{ token: ERC20Token; }> = ({ token }) => {
  /// Ledger
  const { data: signer } = useSigner();
  const hooliganhorde = useHooliganhordeContract(signer);
  
  /// Hooliganhorde
  const season = useSeason();
  const withdrawSeasons = useSelector<AppState, BigNumber>((state) => state._hooliganhorde.firm.withdrawSeasons);

  /// Guvnor
  const guvnorFirm          = useGuvnorFirm();
  const firmBalances        = guvnorFirm.balances;
  const [refetchGuvnorFirm] = useFetchFarmerFirm();
  const [refetchFirm]       = useFetchHooliganhordeFirm();
  
  /// Form
  const middleware = useFormMiddleware();
  const depositedBalance = firmBalances[token.address]?.deposited.amount;
  const initialValues : WithdrawFormValues = useMemo(() => ({
    tokens: [
      {
        token: token,
        amount: undefined,
      },
    ],
  }), [token]);

  /// Handlers
  const onSubmit = useCallback(async (values: WithdrawFormValues, formActions: FormikHelpers<WithdrawFormValues>) => {
    let txToast;
    try {
      middleware.before();

      const withdrawResult = HooliganhordeSDK.Firm.Withdraw.withdraw(
        token,
        values.tokens,
        firmBalances[token.address]?.deposited.crates,
        season,
      );

      if (!withdrawResult) throw new Error('Nothing to Withdraw.');
      
      let call;
      const seasons = withdrawResult.deltaCrates.map((crate) => crate.season.toString());
      const amounts = withdrawResult.deltaCrates.map((crate) => toStringBaseUnitBN(crate.amount.abs(), token.decimals));
      
      console.debug('[firm/withdraw] withdrawing: ', {
        withdrawResult,
        calldata: {
          seasons,
          amounts,
        },
      });
      
      /// Optimize the call used depending on the
      /// number of crates.
      if (seasons.length === 0) {
        throw new Error('Malformatted crates.');
      } else if (seasons.length === 1) {
        if (guvnorFirm.hooligans.earned.gt(0)) {
          console.debug('[firm/withdraw] strategy: plant + withdrawDeposit');
          call = hooliganhorde.farm([
            hooliganhorde.interface.encodeFunctionData('plant'),
            hooliganhorde.interface.encodeFunctionData('withdrawDeposit', [
              token.address,
              seasons[0],
              amounts[0],
            ])
          ]);
        } else {
          console.debug('[firm/withdraw] strategy: withdrawDeposit');
          call = hooliganhorde.withdrawDeposit(
            token.address,
            seasons[0],
            amounts[0],
          );
        }
      } else if (guvnorFirm.hooligans.earned.gt(0)) {
        console.debug('[firm/withdraw] strategy: plant + withdrawDeposits');
        call = hooliganhorde.farm([
          hooliganhorde.interface.encodeFunctionData('plant'),
          hooliganhorde.interface.encodeFunctionData('withdrawDeposits', [
            token.address,
            seasons,
            amounts,
          ])
        ]);
      } else {
        console.debug('[firm/withdraw] strategy: withdrawDeposits');
        call = hooliganhorde.withdrawDeposits(
          token.address,
          seasons,
          amounts,
        );
      }

      txToast = new TransactionToast({
        loading: `Withdrawing ${displayFullBN(withdrawResult.amount.abs(), token.displayDecimals, token.displayDecimals)} ${token.name} from the Firm...`,
        success: `Withdraw successful. Your ${token.name} will be available to Claim at the start of the next Season.`,
      });

      const txn = await call;
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchGuvnorFirm(),
        refetchFirm(),
      ]);
      txToast.success(receipt);
      formActions.resetForm();
    } catch (err) {
      txToast ? txToast.error(err) : toast.error(parseError(err));
      formActions.setSubmitting(false);
    }
  }, [
    firmBalances,
    guvnorFirm.hooligans.earned,
    hooliganhorde,
    token,
    season,
    refetchGuvnorFirm,
    refetchFirm,
    middleware,
  ]);

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formikProps) => (
        <WithdrawForm
          token={token}
          firmBalances={firmBalances}
          depositedBalance={depositedBalance}
          withdrawSeasons={withdrawSeasons}
          season={season}
          {...formikProps}
        />
      )}
    </Formik>
  );
};

export default Withdraw;
