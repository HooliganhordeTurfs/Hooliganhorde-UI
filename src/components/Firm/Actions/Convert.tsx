import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionDetails, Alert, Box, Stack, Typography } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import BigNumber from 'bignumber.js';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import TokenOutputField from '~/components/Common/Form/TokenOutputField';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import { FormState, SettingInput, SmartSubmitButton, TxnSettings } from '~/components/Common/Form';
import TokenQuoteProvider from '~/components/Common/Form/TokenQuoteProvider';
import TxnPreview from '~/components/Common/Form/TxnPreview';
import Token, { ERC20Token, NativeToken } from '~/classes/Token';
import Pool from '~/classes/Pool';
import TxnSeparator from '~/components/Common/Form/TxnSeparator';
import PillRow from '~/components/Common/Form/PillRow';
import TokenSelectDialog, { TokenSelectMode } from '~/components/Common/Form/TokenSelectDialog';
import { HOOLIGAN, HOOLIGAN_CRV3_LP, PROSPECTS, HORDE, UNRIPE_HOOLIGAN, UNRIPE_HOOLIGAN_CRV3 } from '~/constants/tokens';
import HooliganhordeSDK from '~/lib/Hooliganhorde';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import { displayFullBN, MaxBN, MinBN, toStringBaseUnitBN } from '~/util/Tokens';
import { Hooliganhorde } from '~/generated/index';
import { QuoteHandler } from '~/hooks/ledger/useQuote';
import { ZERO_BN } from '~/constants';
import Farm from '~/lib/Hooliganhorde/Farm';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import useToggle from '~/hooks/display/useToggle';
import { useSigner } from '~/hooks/ledger/useSigner';
import { useFetchGuvnorFirm } from '~/state/guvnor/firm/updater';
import { tokenResult, parseError } from '~/util';
import { GuvnorFirm } from '~/state/guvnor/firm';
import useSeason from '~/hooks/hooliganhorde/useSeason';
import { convert, Encoder as ConvertEncoder } from '~/lib/Hooliganhorde/Firm/Convert';
import TransactionToast from '~/components/Common/TxnToast';
import useBDV from '~/hooks/hooliganhorde/useBDV';
import TokenIcon from '~/components/Common/TokenIcon';
import { useFetchPools } from '~/state/hooligan/pools/updater';
import { ActionType } from '~/util/Actions';
import { IconSize } from '~/components/App/muiTheme';
import IconWrapper from '~/components/Common/IconWrapper';
import useGuvnorFirm from '~/hooks/guvnor/useFarmerFirm';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

// -----------------------------------------------------------------------

type ConvertFormValues = FormState & {
  settings: {
    slippage: number;
  };
  maxAmountIn: BigNumber | undefined;
  tokenOut: Token | undefined;
};

// -----------------------------------------------------------------------

const INIT_CONVERSION = {
  amount: ZERO_BN,
  bdv:    ZERO_BN,
  horde:  ZERO_BN,
  prospects:  ZERO_BN,
  actions: []
};

const ConvertForm : FC<
  FormikProps<ConvertFormValues> & {
    /** List of tokens that can be converted to. */
    tokenList: (ERC20Token | NativeToken)[];
    /** Guvnor's firm balances */
    firmBalances: GuvnorFirm['balances'];
    hooliganhorde: Hooliganhorde;
    handleQuote: QuoteHandler;
    currentSeason: BigNumber;
  }
> = ({
  tokenList,
  firmBalances,
  hooliganhorde,
  handleQuote,
  currentSeason,
  // Formik
  values,
  isSubmitting,
  setFieldValue,
}) => {
  /// Local state
  const [isTokenSelectVisible, showTokenSelect, hideTokenSelect] = useToggle();
  const getBDV = useBDV();

  /// Extract values from form state
  const tokenIn   = values.tokens[0].token;     // converting from token
  const amountIn  = values.tokens[0].amount;    // amount of from token
  const tokenOut  = values.tokenOut;            // converting to token
  const amountOut = values.tokens[0].amountOut; // amount of to token
  const maxAmountIn     = values.maxAmountIn;
  const canConvert      = maxAmountIn?.gt(0) || false;
  const firmBalance     = firmBalances[tokenIn.address]; // FIXME: this is mistyped, may not exist
  const depositedAmount = firmBalance?.deposited.amount || ZERO_BN;
  const isQuoting = values.tokens[0].quoting || false;

  /// Derived form state
  let isReady        = false;
  let buttonLoading  = false;
  let buttonContent  = 'Convert';
  let bdvOut;     // the BDV received after re-depositing `amountOut` of `tokenOut`.
  let bdvIn;
  let deltaBDV : (BigNumber | undefined); // the change in BDV during the convert. should always be >= 0.
  let deltaHorde; // the change in Horde during the convert. should always be >= 0.
  let deltaProspectsPerBDV; // change in prospects per BDV for this pathway. ex: hooligan (2 prospects) -> hooligan:3crv (4 prospects) = +2 prospects.
  let deltaProspects; // the change in prospects during the convert.

  ///
  const [conversion, setConversion] = useState(INIT_CONVERSION);
  const runConversion = useCallback((_amountIn: BigNumber) => {
    if (!tokenOut) {
      setConversion(INIT_CONVERSION);
    } else if (tokenOut && !isQuoting) {
      console.debug('[Convert] setting conversion, ', tokenOut, isQuoting);
      setConversion(
        convert(
          tokenIn,   // from
          tokenOut,  // to
          _amountIn, // amount
          firmBalance?.deposited.crates || [], // depositedCrates
          currentSeason,
        )
      );
    }
  }, [currentSeason, isQuoting, firmBalance?.deposited.crates, tokenIn, tokenOut]);

  /// FIXME: is there a better pattern for this?
  /// we want to refresh the conversion info only
  /// when the quoting is complete and amountOut
  /// has been updated respectively. if runConversion
  /// depends on amountIn it will run every time the user
  /// types something into the input.
  useEffect(() => {
    runConversion(amountIn || ZERO_BN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountOut, runConversion]);

  /// Change button state and prepare outputs
  if (depositedAmount.eq(0)) {
    buttonContent = 'Nothing to Convert';
  } else if (values.maxAmountIn === null) {
    if (values.tokenOut) {
      buttonContent = 'Refreshing convert data...';
      buttonLoading = false;
    } else {
      buttonContent = 'No output selected';
      buttonLoading = false;
    }
  } else if (!canConvert) {
    // buttonContent = 'Pathway unavailable';
  } else  {
    buttonContent = 'Convert';
    if (tokenOut && amountOut?.gt(0)) {
      isReady    = true;
      bdvOut     = getBDV(tokenOut).times(amountOut);
      deltaBDV   = MaxBN(
        bdvOut.minus(conversion.bdv.abs()),
        ZERO_BN
      );
      deltaHorde = MaxBN(
        tokenOut.getHorde(deltaBDV),
        ZERO_BN
      );
      deltaProspectsPerBDV = (
        tokenOut.getProspects()
          .minus(tokenIn.getProspects())
      );
      deltaProspects = (
        tokenOut.getProspects(bdvOut)  // prospects for depositing this token with new BDV
          .minus(conversion.prospects.abs())   // prospects lost when converting
      );
      //
      console.log(`BDV: ${getBDV(tokenOut)}`);
      console.log(`amountOut: ${amountOut}`);
      console.log(`bdvIn: ${conversion.bdv}`);
      console.log(`bdvOut: ${bdvOut}`);
      console.log('Conversion: ', conversion);
    }
  }
  
  /// When a new output token is selected, reset maxAmountIn.
  const handleSelectTokenOut = useCallback(async (_tokens: Set<Token>) => {
    const arr = Array.from(_tokens);
    if (arr.length !== 1) throw new Error();
    const _tokenOut = arr[0];
    /// only reset if the user clicked a different token
    if (tokenOut !== _tokenOut) {
      setFieldValue('tokenOut', _tokenOut);
      setFieldValue('maxAmountIn', null);
    }
  }, [setFieldValue, tokenOut]);

  /// When `tokenIn` or `tokenOut` changes, refresh the
  /// max amount that the user can input of `tokenIn`.
  /// FIXME: flash when clicking convert tab
  useEffect(() => {
    (async () => {
      if (tokenOut) {
        const _maxAmountIn = (
          await hooliganhorde.getMaxAmountIn(
            tokenIn.address,
            tokenOut.address,
          )
          .then(tokenResult(tokenIn))
          .catch(() => ZERO_BN) // if calculation fails, consider this pathway unavailable
        );
        setFieldValue('maxAmountIn', _maxAmountIn);
      }
    })();
  }, [hooliganhorde, setFieldValue, tokenIn, tokenOut]);

  const maxAmountUsed = (amountIn && maxAmountIn) ? amountIn.div(maxAmountIn) : null;

  return (
    <Form noValidate autoComplete="off">
      <TokenSelectDialog
        open={isTokenSelectVisible}
        handleClose={hideTokenSelect}
        handleSubmit={handleSelectTokenOut}
        selected={values.tokens}
        tokenList={tokenList}
        mode={TokenSelectMode.SINGLE}
      />
      <Stack gap={1}>
        {/* Input token */}
        <TokenQuoteProvider
          name="tokens.0"
          tokenOut={(tokenOut || tokenIn) as ERC20Token}
          max={MinBN(values.maxAmountIn || ZERO_BN, depositedAmount)}
          balance={depositedAmount}
          balanceLabel="Deposited Balance"
          state={values.tokens[0]}
          handleQuote={handleQuote}
          displayQuote={(_amountOut) => (
            (_amountOut && deltaBDV) && (
              <Typography variant="body1">
                ~{displayFullBN(conversion.bdv.abs(), 2)} BDV
              </Typography>
            )
          )}
          tokenSelectLabel={tokenIn.symbol}
          disabled={(
            !values.maxAmountIn         // still loading `maxAmountIn`
            || values.maxAmountIn.eq(0) // = 0 means we can't make this conversion
          )}
        />
        {/* Output token */}
        {depositedAmount.gt(0) ? (
          <PillRow
            isOpen={isTokenSelectVisible}
            label="Convert to"
            onClick={showTokenSelect}
          >
            {tokenOut ? <TokenIcon token={tokenOut} /> : null}
            <Typography>{tokenOut?.symbol || 'Select token'}</Typography>
          </PillRow>
        ) : null}
        {(!canConvert && tokenOut) ? (
          <Box>
            <Alert
              color="warning"
              icon={(
                <IconWrapper boxSize={IconSize.medium}>
                  <WarningAmberIcon sx={{ fontSize: IconSize.small, alignItems: 'flex-start' }} />
                </IconWrapper>
              )}
            >
              {tokenIn.symbol} can only be Converted to {tokenOut.symbol} when deltaB {tokenIn.isLP || tokenIn.symbol === 'urHOOLIGAN3CRV' ? '<' : '>'} 0.<br />
              {/* <Typography sx={{ opacity: 0.7 }} fontSize={FontSize.sm}>Press ⌥ + 1 to see deltaB.</Typography> */}
            </Alert>
          </Box>
        ) : null}
        {(amountIn && tokenOut && maxAmountIn && amountOut?.gt(0)) ? (
          <>
            <TxnSeparator mt={-1} />
            <TokenOutputField
              token={tokenOut}
              amount={amountOut || ZERO_BN}
              amountSecondary={bdvOut ? `~${displayFullBN(bdvOut, 2)} BDV` : undefined}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="center">
              <Box sx={{ flex: 1 }}>
                <TokenOutputField
                  token={HORDE}
                  amount={deltaHorde || ZERO_BN}
                  amountTooltip={( 
                    deltaBDV?.gt(0) ? (
                      <>
                        Converting will increase the BDV of your Deposit by {displayFullBN(deltaBDV || ZERO_BN, 6)}{deltaBDV?.gt(0) ? ', resulting in a gain of Horde' : ''}.
                      </>
                    ) : (
                      <>
                        The BDV of your Deposit won&apos;t change with this Convert.
                      </>
                    )
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TokenOutputField
                  token={PROSPECTS}
                  amount={deltaProspects || ZERO_BN}
                  amountTooltip={(
                    <>
                      Converting from {tokenIn.symbol} to {tokenOut.symbol} results in {(
                        (!deltaProspectsPerBDV || deltaProspectsPerBDV.eq(0)) 
                          ? 'no change in PROSPECTS per BDV'
                          : `a ${deltaProspectsPerBDV.gt(0) ? 'gain' : 'loss'} of ${deltaProspectsPerBDV.abs().toString()} Prospects per BDV`
                      )}.
                    </>
                  )}
                />
              </Box>
            </Stack>
            {(maxAmountUsed && maxAmountUsed.gt(0.9)) ? (
              <Box>
                <Alert color="warning" icon={<IconWrapper boxSize={IconSize.medium}><WarningAmberIcon color="warning" sx={{ fontSize: IconSize.small }} /></IconWrapper>}>
                  You are converting {displayFullBN(maxAmountUsed.times(100), 4, 0)}% of the way to the peg. 
                  When Converting all the way to the peg, the Convert may fail due to a small amount of slippage in the direction of the peg.
                </Alert>
              </Box>
            ) : null}
            <Box>
              <Accordion variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      {
                        type: ActionType.BASE,
                        message: `Convert ${displayFullBN(amountIn, tokenIn.displayDecimals)} ${tokenIn.name} to ${displayFullBN(amountOut, tokenIn.displayDecimals)} ${tokenOut.name}.`
                      },
                      {
                        type: ActionType.UPDATE_FIRM_REWARDS,
                        horde: deltaHorde || ZERO_BN,
                        prospects: deltaProspects || ZERO_BN,
                      }
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          </>
        ) : null}
        <SmartSubmitButton
          loading={buttonLoading || isQuoting}
          disabled={!isReady || isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          tokens={[]}
          mode="auto"
        >
          {buttonContent}
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

// -----------------------------------------------------------------------

const Convert : FC<{
  pool: Pool;
  fromToken: ERC20Token | NativeToken;
}> = ({
  pool,
  fromToken
}) => {
  /// Tokens
  const getChainToken = useGetChainToken();
  const Hooligan          = getChainToken(HOOLIGAN);
  const HooliganCrv3      = getChainToken(HOOLIGAN_CRV3_LP);
  const urHooligan        = getChainToken(UNRIPE_HOOLIGAN);
  const urHooliganCrv3    = getChainToken(UNRIPE_HOOLIGAN_CRV3);

  /// Ledger
  const { data: signer }  = useSigner();
  const hooliganhorde         = useHooliganhordeContract(signer);
  
  /// Token List
  const [tokenList, initialTokenOut] = useMemo(() => {
    const allTokens = (fromToken === urHooligan || fromToken === urHooliganCrv3)
      ? [
        urHooligan,
        urHooliganCrv3,
      ]
      : [
        Hooligan,
        HooliganCrv3,
      ];
    const _tokenList = allTokens.filter((_token) => _token !== fromToken);
    return [
      _tokenList,     // all available tokens to convert to
      _tokenList[0],  // tokenOut is the first available token that isn't the fromToken
    ];
  }, [urHooligan, urHooliganCrv3, Hooligan, HooliganCrv3, fromToken]);

  /// Hooliganhorde
  const season = useSeason();

  /// Guvnor
  const guvnorFirm              = useGuvnorFirm();
  const guvnorFirmBalances      = farmerFirm.balances;
  const [refetchGuvnorFirm]     = useFetchFarmerFirm();
  const [refetchPools]          = useFetchPools();

  /// Form
  const middleware    = useFormMiddleware();
  const initialValues : ConvertFormValues = useMemo(() => ({
    // Settings
    settings: {
      slippage: 0.1,
    },
    // Token Inputs
    tokens: [
      {
        token:      fromToken,
        amount:     undefined,
        quoting:    false,
        amountOut:  undefined,
      },
    ],
    // Convert data
    maxAmountIn:    undefined,
    // Token Outputs
    tokenOut:       initialTokenOut,
  }), [fromToken, initialTokenOut]);

  /// Handlers
  // This handler does not run when _tokenIn = _tokenOut (direct deposit)
  const handleQuote = useCallback<QuoteHandler>(
    async (_tokenIn, _amountIn, _tokenOut) => hooliganhorde.getAmountOut(
      _tokenIn.address,
      _tokenOut.address,
      toStringBaseUnitBN(_amountIn, _tokenIn.decimals),
    ).then(tokenResult(_tokenOut)),
    [hooliganhorde]
  );

  const onSubmit = useCallback(async (values: ConvertFormValues, formActions: FormikHelpers<ConvertFormValues>) => {
    let txToast;
    try {
      middleware.before();
      if (!values.settings.slippage) throw new Error('No slippage value set.');
      if (!values.tokenOut) throw new Error('No output token selected');
      if (!values.tokens[0].amount?.gt(0)) throw new Error('No amount input');
      if (!values.tokens[0].amountOut) throw new Error('No quote available.');
      
      const tokenIn   = values.tokens[0].token;     // converting from token
      const amountIn  = values.tokens[0].amount;    // amount of from token
      const tokenOut  = values.tokenOut;            // converting to token
      const amountOut = values.tokens[0].amountOut; // amount of to token
      const amountInStr  = tokenIn.stringify(amountIn);
      const amountOutStr = Farm.slip(
        ethers.BigNumber.from(tokenOut.stringify(amountOut)),
        values.settings.slippage / 100
      ).toString();
      
      const depositedCrates = guvnorFirmBalances[tokenIn.address]?.deposited?.crates;
      if (!depositedCrates) throw new Error('No deposited crates available.');

      const conversion = HooliganhordeSDK.Firm.Convert.convert(
        tokenIn,  // from
        tokenOut, // to
        amountIn,
        depositedCrates,
        season,
      );

      txToast = new TransactionToast({
        loading: 'Converting...',
        success: 'Convert successful.',
      });

      /// FIXME:
      /// Once the number of pathways increases, use a matrix
      /// to calculate available conversions and the respective
      /// encoding strategy. Just gotta get to Replant...
      let convertData;
      if (tokenIn === urHooligan && tokenOut === urHooliganCrv3) {
        convertData = ConvertEncoder.unripeHooligansToLP(
          amountInStr,      // amountHooligans
          amountOutStr,     // minLP
        );
      } else if (tokenIn === urHooliganCrv3 && tokenOut === urHooligan) {
        convertData = ConvertEncoder.unripeLPToHooligans(
          amountInStr,      // amountLP
          amountOutStr,     // minHooligans
        );
      } else if (tokenIn === Hooligan && tokenOut === HooliganCrv3) {
        convertData = ConvertEncoder.hooligansToCurveLP(
          amountInStr,      // amountHooligans
          amountOutStr,     // minLP
          tokenOut.address, // output token address = pool address
        );
      } else if (tokenIn === HooliganCrv3 && tokenOut === Hooligan) {
        convertData = ConvertEncoder.curveLPToHooligans(
          amountInStr,      // amountLP
          amountOutStr,     // minHooligans
          tokenIn.address,  // output token address = pool address
        );
      } else {
        throw new Error('Unknown conversion pathway');
      }

      const crates  = conversion.deltaCrates.map((crate) => crate.season.toString());
      const amounts = conversion.deltaCrates.map((crate) => tokenIn.stringify(crate.amount.abs()));

      /// HOTFIX:
      /// If guvnor has > 0 Earned hooligans, add a plant() call before
      /// convert. Fixes edge case bug where converting all of your
      /// firm assets causes loss of Earned Hooligans.
      let call;
      if (guvnorFirm.hooligans.earned.gt(0)) {
        call = hooliganhorde.farm([
          hooliganhorde.interface.encodeFunctionData('plant'),
          hooliganhorde.interface.encodeFunctionData('convert', [
            convertData,
            crates,
            amounts
          ])
        ]);
      } else {
        call = hooliganhorde.convert(
          convertData,
          crates,
          amounts
        );
      }
      
      console.debug('[Convert] executing', {
        tokenIn,
        amountIn,
        tokenOut,
        amountOut,
        amountInStr,
        amountOutStr,
        depositedCrates,
        conversion,
        convertData,
        crates,
        amounts,
      });

      ///
      const txn = await call;
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchGuvnorFirm(),  // update guvnor firm since we just moved deposits around
        refetchPools(),       // update prices to account for pool conversion
      ]);
      txToast.success(receipt);
      formActions.resetForm({
        values: {
          ...initialValues,
          tokenOut: undefined,
        }
      });
    } catch (err) {
      console.error(err);
      txToast ? txToast.error(err) : toast.error(parseError(err));
      formActions.setSubmitting(false);
    }
  }, [guvnorFirmBalances, farmerFirm.hooligans.earned, season, urHooligan, urHooliganCrv3, Hooligan, HooliganCrv3, hooliganhorde, refetchGuvnorFirm, refetchPools, initialValues, middleware]);

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formikProps) => (
        <>
          <TxnSettings placement="form-top-right">
            <SettingInput name="settings.slippage" label="Slippage Tolerance" endAdornment="%" />
          </TxnSettings>
          <ConvertForm
            handleQuote={handleQuote}
            tokenList={tokenList as (ERC20Token | NativeToken)[]}
            firmBalances={guvnorFirmBalances}
            hooliganhorde={hooliganhorde}
            currentSeason={season}
            {...formikProps}
          />
        </>
      )}
    </Formik>
  );
};

export default Convert;
