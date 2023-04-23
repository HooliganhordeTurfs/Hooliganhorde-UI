import { Accordion, AccordionDetails, Alert, Box, CircularProgress, IconButton, Link, Stack } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import toast from 'react-hot-toast';
import { useConnect } from 'wagmi';
import BigNumber from 'bignumber.js';
import {
  FormApprovingState, FormTokenState,
  SettingInput,
  SlippageSettingsFragment,
  SmartSubmitButton,
  TokenAdornment,
  TokenSelectDialog,
  TxnPreview,
  TxnSettings,
} from '~/components/Common/Form';
import { TokenSelectMode } from '~/components/Common/Form/TokenSelectDialog';
import TokenInputField from '~/components/Common/Form/TokenInputField';
import FarmModeField from '~/components/Common/Form/FarmModeField';
import Token, { ERC20Token, NativeToken } from '~/classes/Token';
import { Hooliganhorde } from '~/generated/index';
import { ZERO_BN } from '~/constants';
import { HOOLIGAN, CRV3, CRV3_UNDERLYING, DAI, ETH, USDC, USDT, WETH } from '~/constants/tokens';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import useGuvnorBalances from '~/hooks/guvnor/useFarmerBalances';
import useTokenMap from '~/hooks/chain/useTokenMap';
import { useSigner } from '~/hooks/ledger/useSigner';
import Farm, { FarmFromMode, FarmToMode } from '~/lib/Hooliganhorde/Farm';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import useQuote, { QuoteHandler } from '~/hooks/ledger/useQuote';
import useFarm from '~/hooks/sdk/useFarm';
import useAccount from '~/hooks/ledger/useAccount';
import { toStringBaseUnitBN, toTokenUnitsBN, parseError, MinBN } from '~/util';
import { IconSize } from '~/components/App/muiTheme';
import TransactionToast from '~/components/Common/TxnToast';
import { useFetchGuvnorBalances } from '~/state/guvnor/balances/updater';
import useChainConstant from '~/hooks/chain/useChainConstant';
import { optimizeFromMode } from '~/util/Farm';
import copy from '~/constants/copy';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import { ActionType } from '~/util/Actions';
import WarningIcon from '~/components/Common/Alert/WarningIcon';
import Row from '~/components/Common/Row';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

/// ---------------------------------------------------------------

type SwapFormValues = {
  /** Multiple tokens can (eventually) be swapped into tokenOut */
  tokensIn:   FormTokenState[];
  modeIn:     FarmFromMode.INTERNAL | FarmFromMode.EXTERNAL;
  /** One output token can be selected */
  tokenOut:   FormTokenState;
  modeOut:    FarmToMode;
  approving?: FormApprovingState;
  /** */
  settings:   SlippageSettingsFragment;
};

type DirectionalQuoteHandler = (
  direction: 'forward' | 'backward',
) => QuoteHandler;

enum Pathway {
  TRANSFER,   // 0
  ETH_WETH,   // 1
  HOOLIGAN_CRV3,  // 2
  HOOLIGAN_ETH,   // 3
  HOOLIGAN_WETH,  // 4; make this HOOLIGAN_TRICRYPTO_UNDERLYING
  HOOLIGAN_CRV3_UNDERLYING, // 5
}

const QUOTE_SETTINGS = {
  ignoreSameToken: false
};

const Quoting = <CircularProgress variant="indeterminate" size="small" sx={{ width: 14, height: 14 }} />;

const SwapForm: FC<FormikProps<SwapFormValues> & {
  balances: ReturnType<typeof useGuvnorBalances>;
  hooliganhorde: Hooliganhorde;
  handleQuote: DirectionalQuoteHandler;
  tokenList: (ERC20Token | NativeToken)[];
  getPathway: (tokenIn: Token, tokenOut: Token) => Pathway | false;
  defaultValues: SwapFormValues;
}> = ({
  //
  values,
  setFieldValue,
  handleQuote,
  isSubmitting,
  //
  balances,
  hooliganhorde,
  tokenList,
  getPathway,
  defaultValues
}) => {
  /// Tokens
  const Eth = useChainConstant(ETH);
  const { status } = useConnect();
  const account = useAccount();
  
  /// Derived values
  // Inputs
  const stateIn   = values.tokensIn[0];
  const tokenIn   = stateIn.token;
  const modeIn    = values.modeIn;
  const amountIn  = stateIn.amount;
  // Outputs
  const stateOut  = values.tokenOut;
  const tokenOut  = stateOut.token;
  const modeOut   = values.modeOut;
  const amountOut = stateOut.amount;
  // Other
  const tokensMatch = tokenIn === tokenOut;
  const noBalancesFound = useMemo(() => Object.keys(balances).length === 0, [balances]);
  const [balanceIn, balanceInInput, balanceInMax] = useMemo(() => {
    const _balanceIn = balances[tokenIn.address];
    if (tokensMatch) {
      const _balanceInMax = _balanceIn[
        modeIn === FarmFromMode.INTERNAL 
          ? 'internal'
          : 'external'
      ];
      return [_balanceIn, _balanceInMax, _balanceInMax] as const;
    } 
    return [_balanceIn, _balanceIn, _balanceIn?.total || ZERO_BN] as const;
  }, [balances, modeIn, tokenIn.address, tokensMatch]);
  const pathway   = getPathway(tokenIn, tokenOut);
  const noBalance = !(balanceInMax?.gt(0));
  const expectedFromMode = balanceIn
    ? optimizeFromMode(
      /// Manually set a maximum of `total` to prevent
      /// throwing INTERNAL_EXTERNAL_TOLERANT error.
      MinBN(amountIn || ZERO_BN, balanceIn.total),
      balanceIn
    )
    : FarmFromMode.INTERNAL;
  const shouldApprove = tokensMatch 
    /// If matching tokens, only approve if input token is using EXTERNAL balances.
    ? modeIn === FarmFromMode.EXTERNAL
    /// Otherwise, approve if we expect to use an EXTERNAL baalnce.
    : (
      (expectedFromMode === FarmFromMode.EXTERNAL
      || expectedFromMode === FarmFromMode.INTERNAL_EXTERNAL)
    );

  /// Memoize to prevent infinite loop on useQuote
  const handleBackward = useMemo(() => handleQuote('backward'), [handleQuote]);
  const handleForward  = useMemo(() => handleQuote('forward'),  [handleQuote]);
  const [resultIn,  quotingIn,  getMinAmountIn] = useQuote(tokenIn, handleBackward, QUOTE_SETTINGS);
  const [resultOut, quotingOut, getAmountOut]   = useQuote(tokenOut, handleForward, QUOTE_SETTINGS);
  
  const handleSetDefault = useCallback(() => {
    setFieldValue('modeIn', defaultValues.modeIn);
    setFieldValue('modeOut', defaultValues.modeOut);
    setFieldValue('tokensIn.0', { ...defaultValues.tokensIn[0] });
    setFieldValue('tokenOut', {  ...defaultValues.tokenOut });
  }, [defaultValues, setFieldValue]);
  
  /// reset to default values when user switches wallet addresses or disconnects
  useEffect(() => {
    handleSetDefault();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, status]);

  /// When receiving new results from quote handlers, update
  /// the respective form fields.
  useEffect(() => {
    console.debug('[TokenInput] got new resultIn', resultIn);
    setFieldValue('tokensIn.0.amount', resultIn?.amountOut);
  }, [setFieldValue, resultIn]);
  useEffect(() => {
    console.debug('[TokenInput] got new resultOut', resultOut);
    setFieldValue('tokenOut.amount', resultOut?.amountOut);
  }, [setFieldValue, resultOut]);

  const handleChangeModeIn = useCallback((v: FarmFromMode) => {
    const newModeOut = (
      v === FarmFromMode.INTERNAL
        ? FarmToMode.EXTERNAL
        : FarmToMode.INTERNAL
    );
    setFieldValue('modeOut', newModeOut);
  }, [setFieldValue]);
  const handleChangeModeOut = useCallback((v: FarmToMode) => {
    const newModeIn = (
      v === FarmToMode.INTERNAL
        ? FarmFromMode.EXTERNAL
        : FarmFromMode.INTERNAL
    );
    setFieldValue('modeIn', newModeIn);
  }, [setFieldValue]);
  
  /// When amountIn changes, refresh amountOut
  /// Only refresh if amountIn was changed by user input,
  /// i.e. not by another hook
  const handleChangeAmountIn = useCallback((_amountInClamped: BigNumber | undefined) => {
    console.debug('[TokenInput] handleChangeAmountIn', _amountInClamped);
    if (_amountInClamped) {
      getAmountOut(tokenIn, _amountInClamped);
    } else {
      setFieldValue('tokenOut.amount', undefined);
    }
  }, [tokenIn, getAmountOut, setFieldValue]);
  const handleChangeAmountOut = useCallback((_amountOutClamped: BigNumber | undefined) => {
    console.debug('[TokenInput] handleChangeAmountOut',   _amountOutClamped);
    if (_amountOutClamped) {
      console.debug('[TokenInput] getMinAmountIn', [tokenOut, _amountOutClamped]);
      getMinAmountIn(tokenOut, _amountOutClamped);
    } else {
      setFieldValue('tokensIn.0.amount', undefined);
    }
  }, [tokenOut, getMinAmountIn, setFieldValue]);

  /// Token Select
  const [tokenSelect, setTokenSelect] =  useState<null | 'tokensIn' | 'tokenOut'>(null);
  const selectedTokens = (
    tokenSelect === 'tokenOut' 
      ? [tokenOut] 
      : tokenSelect === 'tokensIn'
      ? values.tokensIn.map((x) => x.token)
      : []
  );
  const handleCloseTokenSelect = useCallback(() => setTokenSelect(null), []);
  const handleShowTokenSelect  = useCallback((which: 'tokensIn' | 'tokenOut') => () => setTokenSelect(which), []);

  const setInitialModes = useCallback(() => {
    /// If user has an INTERNAL balance of the selected token,
    /// or if they have no balance at all, always show INTERNAL->EXTERNAL.
    /// Otherwise show the reverse.
    const [newModeIn, newModeOut] = (
      !balanceIn || balanceIn.internal.gt(0) || balanceIn.total.eq(0)
        ? [FarmFromMode.INTERNAL, FarmToMode.EXTERNAL]
        : [FarmFromMode.EXTERNAL, FarmToMode.INTERNAL]
    );
    setFieldValue('modeIn', newModeIn);
    setFieldValue('modeOut', newModeOut);
  }, [balanceIn, setFieldValue]);
 
  const handleReverse = useCallback(() => {
    if (tokensMatch) {
      /// Flip destinations.
      setFieldValue('modeIn', modeOut);
      setFieldValue('modeOut', modeIn);
    } else {
      setFieldValue('tokensIn.0', {
        token: tokenOut,
        amount: undefined,
      } as SwapFormValues['tokensIn'][number]);
      setFieldValue('tokenOut', {
        token: tokenIn,
        amount: undefined,
      });
    }
  }, [modeIn, modeOut, setFieldValue, tokenIn, tokenOut, tokensMatch]);

  // if tokenIn && tokenOut are equal and no balances are found, reverse positions. 
  // This prevents setting of internal balance of given token when there is none
  const handleTokensEqual = useCallback(() => {
    if (!noBalancesFound) {
      setInitialModes();
      return;
    }
    try {
      handleReverse();
    } catch {
      handleSetDefault();
    }
  }, [noBalancesFound, handleReverse, handleSetDefault, setInitialModes]);

   const handleSubmit = useCallback((_tokens: Set<Token>) => {
    if (tokenSelect === 'tokenOut') {
      const newTokenOut = Array.from(_tokens)[0];
      setFieldValue('tokenOut', {
        token: newTokenOut,
        amount: undefined,
      });
      setFieldValue('tokensIn.0.amount', undefined);
      if (tokenIn === newTokenOut) handleTokensEqual();
    } else if (tokenSelect === 'tokensIn') {
      const newTokenIn = Array.from(_tokens)[0];
      setFieldValue('tokensIn.0', {
        token: newTokenIn,
        amount: undefined
      });
      setFieldValue('tokenOut.amount', undefined);
      if (newTokenIn === tokenOut) handleTokensEqual();
    }
  }, [setFieldValue, handleTokensEqual, tokenSelect, tokenIn, tokenOut]);

  const handleMax = useCallback(() => {
    setFieldValue('tokensIn.0.amount', balanceInMax);
    getAmountOut(tokenIn, balanceInMax);
  }, [balanceInMax, getAmountOut, setFieldValue, tokenIn]);
  
  /// Checks
  const isQuoting = (
    quotingIn
    || quotingOut
  );
  const pathwayCheck = (
    pathway !== false
  );
  const ethModeCheck = (
    /// If ETH is selected as an output, the only possible destination is EXTERNAL.
    tokenOut === Eth
      ? (modeOut === FarmToMode.EXTERNAL)
      : true
  );
  const amountsCheck = (
    amountIn?.gt(0)
    && amountOut?.gt(0)
  );
  const diffModeCheck = (
    tokensMatch
      ? modeIn.valueOf() !== modeOut.valueOf() // compare string enum vals
      : true
  );
  const enoughBalanceCheck = (
    amountIn
      ? amountIn.gt(0) && balanceInMax.gte(amountIn)
      : true
  );
  const isValid = (
    pathwayCheck
    && ethModeCheck
    && amountsCheck
    && diffModeCheck
    && enoughBalanceCheck
  );

  return (
    <Form autoComplete="off">
      <TokenSelectDialog
        title={(
          tokenSelect === 'tokensIn'
            ? 'Select Input Token'
            : 'Select Output Token'
        )}
        open={tokenSelect !== null}   // 'tokensIn' | 'tokensOut'
        handleClose={handleCloseTokenSelect}     //
        handleSubmit={handleSubmit}   //
        selected={selectedTokens}
        balances={balances}
        tokenList={tokenList}
        mode={TokenSelectMode.SINGLE}
      />
      <Stack gap={1}>
        {/* Input */}
        <>
          <TokenInputField
            token={tokenIn}
            name="tokensIn.0.amount"
            // MUI
            fullWidth
            InputProps={{
              endAdornment: (
                <TokenAdornment
                  token={tokenIn}
                  onClick={handleShowTokenSelect('tokensIn')}
                />
              )
            }}
            balanceLabel={
              tokensMatch
                ? copy.MODES[modeIn as (FarmFromMode.INTERNAL | FarmFromMode.EXTERNAL)]
                : undefined
            }
            balance={
              balanceInInput
            }
            disabled={
              quotingIn
              || !pathwayCheck
            }
            quote={
              quotingOut
                ? Quoting 
                : undefined
            }
            onChange={handleChangeAmountIn}
            error={
              !noBalance && !enoughBalanceCheck
            }
          />
          {tokensMatch ? (
            <FarmModeField
              name="modeIn"
              label="Source"
              baseMode={FarmFromMode}
              onChange={handleChangeModeIn}
            />
          ) : null}
        </>
        <Row justifyContent="center" mt={-1}>
          <IconButton onClick={handleReverse} size="small">
            <ExpandMoreIcon color="secondary" width={IconSize.xs} />
          </IconButton>
        </Row>
        {/* Output */}
        <>
          <TokenInputField
            token={tokenOut}
            name="tokenOut.amount"
            // MUI
            fullWidth
            InputProps={{
              endAdornment: (
                <TokenAdornment
                  token={tokenOut}
                  onClick={handleShowTokenSelect('tokenOut')}
                />
              )
            }}
            disabled={
              /// Disable while quoting an `amount` for the output.
              quotingOut
              /// Can't type into the output field if
              /// user has no balance of the input.
              || noBalance
              /// No way to quote for this pathway
              || !pathwayCheck
            }
            quote={
              quotingIn
                ? Quoting 
                : undefined
            }
            onChange={handleChangeAmountOut}
          />
          <FarmModeField
            name="modeOut"
            label="Destination"
            baseMode={FarmToMode}
            onChange={handleChangeModeOut}
          />
        </>
        {/* Warnings */}
        {ethModeCheck === false ? (
          <Alert variant="standard" color="warning" icon={<WarningIcon />}>
            ETH can only be delivered to your Circulating Balance.&nbsp;
            <Link
              onClick={() => {
                setFieldValue('modeOut', FarmToMode.EXTERNAL);
              }}
              sx={{ cursor: 'pointer' }}
              underline="hover"
            >
              Switch &rarr;
            </Link>
          </Alert>
        ) : null}
        {pathwayCheck === false ? (
          <Alert variant="standard" color="warning" icon={<WarningIcon />}>
            Swapping from {tokenIn.symbol} to {tokenOut.symbol} is currently unsupported.
          </Alert>
        ) : null}
        {/**
          * After the upgrade to `handleChangeModeIn` / `handleChangeModeOut`
          * this should never be true. */}
        {diffModeCheck === false ? (
          <Alert variant="standard" color="warning" icon={<WarningIcon />}>
            Please choose a different source or destination.
          </Alert>
        ) : null}
        {/**
          * If the user has some balance of the input token, but derives
          * an `amountIn` that is too high by typing in the second input,
          * show a message and prompt them to use `max`.
          */}
        {(!noBalance && !enoughBalanceCheck) ? (
          <Alert variant="standard" color="warning" icon={<WarningIcon />}>
            Not enough {tokenIn.symbol}{tokensMatch ? ` in your ${copy.MODES[modeIn]}` : ''} to execute this transaction.&nbsp;
            <Link
              onClick={handleMax}
              sx={{ display: 'inline-block', cursor: 'pointer', breakInside: 'avoid' }}
              underline="hover"
            >
              Use max &rarr;
            </Link>
          </Alert>
        ) : null}
        {isValid ? (
          <Box>
            <Accordion variant="outlined">
              <StyledAccordionSummary title="Transaction Details" />
              <AccordionDetails>
                <TxnPreview
                  actions={
                    tokensMatch ? [
                      {
                        type: ActionType.TRANSFER_BALANCE,
                        amount: amountIn!,
                        token: tokenIn,
                        source: modeIn,
                        destination: modeOut,
                      }
                    ] : [
                      {
                        type: ActionType.SWAP,
                        tokenIn: tokenIn,
                        amountIn: amountIn!,
                        amountOut: amountOut!,
                        tokenOut: tokenOut,
                      },
                      {
                        type: ActionType.RECEIVE_TOKEN,
                        amount: amountOut!,
                        token: tokenOut,
                        destination: modeOut,
                      },
                    ]
                  }
                />
              </AccordionDetails>
            </Accordion>
          </Box>
        ) : null}
        <SmartSubmitButton
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          loading={isSubmitting}
          disabled={
            !isValid 
            || isSubmitting
            || isQuoting
          }
          contract={hooliganhorde}
          tokens={
            shouldApprove
              ? values.tokensIn
              : []
          }
          mode="auto"
        >
          {noBalance 
            ? 'Nothing to swap' 
            // : !enoughBalanceCheck
            // ? 'Not enough to swap'
            : 'Swap'}
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

// ---------------------------------------------------

const SUPPORTED_TOKENS = [
  HOOLIGAN,
  ETH,
  WETH,
  CRV3,
  DAI,
  USDC,
  USDT,
];

/**
 * Ensure that both `_tokenIn` and `_tokenOut` are in `_pair`, regardless of order.
 */
const isPair = (_tokenIn : Token, _tokenOut : Token, _pair : [Token, Token]) => {
  const s = new Set(_pair);
  return s.has(_tokenIn) && s.has(_tokenOut);
};

/**
 * SWAP
 * Implementation notes
 * 
 * HOOLIGAN + ETH
 * ---------------
 * HOOLIGAN   -> ETH      exchange_underlying(HOOLIGAN, USDT) => exchange(USDT, WETH) => unwrapEth
 * HOOLIGAN   -> WETH     exchange_underlying(HOOLIGAN, USDT) => exchange(USDT, WETH)
 * ETH    -> HOOLIGAN     wrapEth => exchange(WETH, USDT) => exchange_underlying(USDT, HOOLIGAN)
 * WETH   -> HOOLIGAN     exchange(WETH, USDT) => exchange_underlying(USDT, HOOLIGAN)
 * 
 * HOOLIGAN + Stables
 * ---------------------
 * HOOLIGAN   -> DAI      exchange_underlying(HOOLIGAN, DAI, HOOLIGAN_METAPOOL)
 * HOOLIGAN   -> USDT     exchange_underlying(HOOLIGAN, USDT, HOOLIGAN_METAPOOL)
 * HOOLIGAN   -> USDC     exchange_underlying(HOOLIGAN, USDC, HOOLIGAN_METAPOOL)
 * HOOLIGAN   -> 3CRV     exchange(HOOLIGAN, 3CRV, HOOLIGAN_METAPOOL)
 * DAI    -> HOOLIGAN     exchange_underlying(DAI,  HOOLIGAN, HOOLIGAN_METAPOOL)
 * USDT   -> HOOLIGAN     exchange_underlying(HOOLIGAN, USDT, HOOLIGAN_METAPOOL)
 * USDC   -> HOOLIGAN     exchange_underlying(HOOLIGAN, USDC, HOOLIGAN_METAPOOL)
 * 3CRV   -> HOOLIGAN     exchange(3CRV, HOOLIGAN, HOOLIGAN_METAPOOL)
 * 
 * Internal <-> External
 * ---------------------
 * TOK-i  -> TOK-e    transferToken(TOK, self, amount, INTERNAL, EXTERNAL)
 * TOK-e  -> TOK-i    transferToken(TOK, self, amount, EXTERNAL, INTERNAL)
 * 
 * Stables
 * ---------------------
 * USDC   -> USDT     exchange(USDC, USDT, 3POOL)
 * ...etc
 */

const Swap: FC<{}> = () => {
  /// Ledger
  const { data: signer } = useSigner();
  const hooliganhorde = useHooliganhordeContract(signer);
  const account = useAccount();

  /// Tokens
  const getChainToken = useGetChainToken();
  const Eth           = getChainToken(ETH);
  const Weth          = getChainToken(WETH);
  const Hooligan          = getChainToken(HOOLIGAN);
  const Crv3          = getChainToken(CRV3);
  const crv3Underlying = useMemo(() => new Set(CRV3_UNDERLYING.map(getChainToken)), [getChainToken]);

  /// Token List
  const tokenMap      = useTokenMap<ERC20Token | NativeToken>(SUPPORTED_TOKENS);
  const tokenList     = useMemo(() => Object.values(tokenMap), [tokenMap]);

  /// Farm
  const farm          = useFarm();
  
  /// Guvnor
  const guvnorBalances = useGuvnorBalances();
  const [refetchGuvnorBalances] = useFetchFarmerBalances();

  /// Form
  const middleware = useFormMiddleware();
  const initialValues: SwapFormValues = useMemo(() => ({
    tokensIn: [
      {
        token: Eth,
        amount: undefined,
      }
    ],
    modeIn: FarmFromMode.EXTERNAL,
    tokenOut: {
      token: Hooligan,
      amount: undefined
    },
    modeOut: FarmToMode.EXTERNAL,
    settings: {
      slippage: 0.1,
    }
  }), [Hooligan, Eth]);

  /// Handlers

  const getPathway = useCallback((
    _tokenIn: Token,
    _tokenOut: Token,
  ) => {
    if (_tokenIn === _tokenOut) return Pathway.TRANSFER;
    if (isPair(_tokenIn, _tokenOut, [Eth, Weth]))   return Pathway.ETH_WETH;
    if (isPair(_tokenIn, _tokenOut, [Hooligan, Crv3]))  return Pathway.HOOLIGAN_CRV3;
    if (isPair(_tokenIn, _tokenOut, [Hooligan, Eth]))   return Pathway.HOOLIGAN_ETH;
    if (isPair(_tokenIn, _tokenOut, [Hooligan, Weth]))  return Pathway.HOOLIGAN_WETH;
    if (
      (_tokenIn === Hooligan && crv3Underlying.has(_tokenOut as any))
      || (_tokenOut === Hooligan && crv3Underlying.has(_tokenIn as any))
    ) return Pathway.HOOLIGAN_CRV3_UNDERLYING;
    return false;
  }, [Hooligan, Crv3, Eth, Weth, crv3Underlying]);

  const handleEstimate = useCallback(async (
    forward : boolean,
    amountIn : ethers.BigNumber,
    _account : string,
    _tokenIn : Token,
    _tokenOut : Token,
    _fromMode : FarmFromMode,
    _toMode : FarmToMode,
  ) => {
    console.debug('[handleEstimate]', {
      forward,
      amountIn,
      _account,
      _tokenIn,
      _tokenOut,
      _fromMode,
      _toMode,
    });

    const pathway = getPathway(_tokenIn, _tokenOut);

    console.debug('[handleEstimate] got pathway: ', pathway);

    /// Say I want to buy 1000 HOOLIGAN and I have ETH.
    /// I select ETH as the input token, HOOLIGAN as the output token.
    /// Then I type 1000 into the HOOLIGAN input.
    ///
    /// When this happens, `handleEstimate` is called
    /// with `forward = false` (since we are finding the amount of
    /// ETH needed to buy 1,000 HOOLIGAN, rather than the amount of HOOLIGAN
    /// received for a set amount of ETH). 
    /// 
    /// In this instance, `_tokenIn` is HOOLIGAN and `_tokenOut` is ETH,
    /// since we are quoting from HOOLIGAN to ETH.
    /// 
    /// If forward-quoting, then the user's selected input token (the
    /// first one that appears in the form) is the same as _tokenIn.
    /// If backward-quoting, then we flip things.
    const startToken = forward ? _tokenIn : _tokenOut;

    /// Token <-> Token
    if (pathway === Pathway.TRANSFER) {
      console.debug('[handleEstimate] estimating: transferToken');
      return Farm.estimate(
        [
          farm.transferToken(
            _tokenIn.address,
            _account,
            _fromMode,
            _toMode,
          )
        ],
        [amountIn],
        forward
      );
    } 

    /// ETH <-> WETH
    if (pathway === Pathway.ETH_WETH) {
      console.debug(`[handleEstimate] estimating: ${startToken === Eth ? 'wrap' : 'unwrap'}`);
      return Farm.estimate(
        [
          startToken === Eth
            ? farm.wrapEth(_toMode)
            : farm.unwrapEth(_fromMode)
        ],
        [amountIn],
        forward,
      );
    } 

    /// HOOLIGAN <-> 3CRV
    if (pathway === Pathway.HOOLIGAN_CRV3) {
      console.debug('[handleEstimate] estimating: HOOLIGAN <-> CRV3');
      return Farm.estimate(
        [
          farm.exchange(
            farm.contracts.curve.pools.hooliganCrv3.address,
            farm.contracts.curve.registries.metaFactory.address,
            _tokenIn.address,
            _tokenOut.address,
            _fromMode,
            _toMode
          )
        ],
        [amountIn],
        forward,
      );
    }

    /// HOOLIGAN <-> ETH
    if (pathway === Pathway.HOOLIGAN_ETH) {
      console.debug('[handleEstimate] estimating: HOOLIGAN <-> ETH');
      return Farm.estimate(
        startToken === Eth
         ? [
            farm.wrapEth(
              FarmToMode.INTERNAL
            ),
            ...farm.pair.WETH_HOOLIGAN(
              'WETH',
              FarmFromMode.INTERNAL,
              _toMode,
            ),
         ]
         : [
            ...farm.pair.WETH_HOOLIGAN(
              'HOOLIGAN',
              _fromMode,
              FarmToMode.INTERNAL, // send WETH to INTERNAL
            ), // amountOut is not exact
            farm.unwrapEth(
              FarmFromMode.INTERNAL_TOLERANT  // unwrap WETH from INTERNAL
            ), // always goes to EXTERNAL because ETH is not ERC20 and therefore not circ. bal. compatible
         ],
       [amountIn],
       forward,
     );
    }

    /// HOOLIGAN <-> WETH
    if (pathway === Pathway.HOOLIGAN_WETH) {
      console.debug('[handleEstimate] estimating: HOOLIGAN <-> WETH');
      return Farm.estimate(
        startToken === Weth
          ? farm.pair.WETH_HOOLIGAN(
            'WETH',
            _fromMode,
            _toMode,
          )
          : farm.pair.WETH_HOOLIGAN(
            'HOOLIGAN',
            _fromMode,
            _toMode,
          ),
       [amountIn],
       forward,
     );
    } 

    /// HOOLIGAN <-> CRV3 Underlying
    if (pathway === Pathway.HOOLIGAN_CRV3_UNDERLYING) {
      console.debug('[handleEstimate] estimating: HOOLIGAN <-> 3CRV Underlying');
      return Farm.estimate(
        [
          farm.exchangeUnderlying(
            farm.contracts.curve.pools.hooliganCrv3.address,
            _tokenIn.address,
            _tokenOut.address,
            _fromMode,
            _toMode
          )
        ],
        [amountIn],
        forward,
      );
    }

    throw new Error('Unsupported swap mode.');
  }, [Eth, Weth, farm, getPathway]);

  const handleQuote = useCallback<DirectionalQuoteHandler>(
    (direction) => async (_tokenIn, _amountIn, _tokenOut) => {
      console.debug('[handleQuote] ', {
        direction,
        _tokenIn,
        _amountIn,
        _tokenOut
      }); 
      if (!account) throw new Error('Connect a wallet first.');
      
      const amountIn = ethers.BigNumber.from(toStringBaseUnitBN(_amountIn, _tokenIn.decimals));
      const estimate = await handleEstimate(
        direction === 'forward',
        amountIn,
        account,
        _tokenIn,
        _tokenOut,
        FarmFromMode.INTERNAL_EXTERNAL,
        FarmToMode.EXTERNAL,
      );

      return {
        amountOut: toTokenUnitsBN(
          estimate.amountOut.toString(),
          _tokenOut.decimals
        ),
        steps: estimate.steps,
      };
    },
    [account, handleEstimate]
  );

  const onSubmit = useCallback(
    async (values: SwapFormValues, formActions: FormikHelpers<SwapFormValues>) => {
      let txToast;
      try {
        middleware.before();
        const stateIn = values.tokensIn[0];
        const tokenIn = stateIn.token;
        const modeIn  = values.modeIn;
        const balanceIn = guvnorBalances[tokenIn.address];
        const stateOut = values.tokenOut;
        const tokenOut = stateOut.token;
        const modeOut  = values.modeOut;
        if (!stateIn.amount) throw new Error('No input amount set.');
        if (!account) throw new Error('Connect a wallet first.');
        if (!modeOut) throw new Error('No destination selected.');
        const amountIn = ethers.BigNumber.from(
          stateIn.token.stringify(stateIn.amount)
        );
        const estimate = await handleEstimate(
          true,
          amountIn,
          account,
          tokenIn,
          tokenOut,
          tokenIn === tokenOut
            ? modeIn
            : optimizeFromMode(stateIn.amount || ZERO_BN, balanceIn),
          /// FIXME: no such thing as "internal ETH"
          modeOut, 
        );

        txToast = new TransactionToast({
          loading: 'Swapping...',
          success: 'Swap successful.'
        });
        
        if (!estimate.steps) throw new Error('Unable to generate a transaction sequence');
        const data = Farm.encodeStepsWithSlippage(
          estimate.steps,
          values.settings.slippage / 100,
        );
        const txn = await hooliganhorde.farm(data, { value: estimate.value });
        txToast.confirming(txn);

        const receipt = await txn.wait();
        await Promise.all([
          refetchGuvnorBalances()
        ]);
        txToast.success(receipt);
        // formActions.resetForm();
        formActions.setFieldValue('tokensIn.0', {
          token: tokenIn,
          amount: undefined,
        });
        formActions.setFieldValue('tokenOut', {
          token: tokenOut,
          amount: undefined,
        });
      } catch (err) {
        txToast ? txToast.error(err) : toast.error(parseError(err));
        formActions.setSubmitting(false);
      }
    },
    [account, hooliganhorde, guvnorBalances, handleEstimate, refetchGuvnorBalances, middleware]
  );

  return (
    <Formik<SwapFormValues>
      enableReinitialize
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {(formikProps: FormikProps<SwapFormValues>) => (
        <>
          <TxnSettings placement="form-top-right">
            <SettingInput name="settings.slippage" label="Slippage Tolerance" endAdornment="%" />
          </TxnSettings>
          <SwapForm
            balances={guvnorBalances}
            hooliganhorde={hooliganhorde}
            tokenList={tokenList}
            defaultValues={initialValues}
            handleQuote={handleQuote}
            getPathway={getPathway}
            {...formikProps}
          />
        </>
      )}
    </Formik>
  );
};

export default Swap;
