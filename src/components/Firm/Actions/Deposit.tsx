import React, { useCallback, useMemo } from 'react';
import { Accordion, AccordionDetails, Box, Stack } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { Token } from '~/classes';
import { HOOLIGAN, CRV3, DAI, ETH, PROSPECTS, HORDE, UNRIPE_HOOLIGAN, UNRIPE_HOOLIGAN_CRV3, USDC, USDT, WETH } from '~/constants/tokens';
import TokenSelectDialog, { TokenSelectMode } from '~/components/Common/Form/TokenSelectDialog';
import TokenOutputField from '~/components/Common/Form/TokenOutputField';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import { FormState, SettingInput, TxnSettings } from '~/components/Common/Form';
import TokenQuoteProvider from '~/components/Common/Form/TokenQuoteProvider';
import TxnPreview from '~/components/Common/Form/TxnPreview';
import HooliganhordeSDK from '~/lib/Hooliganhorde';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import useGuvnorBalances from '~/hooks/guvnor/useFarmerBalances';
import { Balance, GuvnorBalances } from '~/state/guvnor/balances';
import { displayFullBN, toStringBaseUnitBN, toTokenUnitsBN } from '~/util/Tokens';
import TransactionToast from '~/components/Common/TxnToast';
import { Hooliganhorde } from '~/generated/index';
import { QuoteHandler } from '~/hooks/ledger/useQuote';
import { ZERO_BN } from '~/constants';
import { ERC20Token, NativeToken } from '~/classes/Token';
import Pool from '~/classes/Pool';
import SmartSubmitButton from '~/components/Common/Form/SmartSubmitButton';
import Farm, { FarmFromMode, FarmToMode } from '~/lib/Hooliganhorde/Farm';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import TxnSeparator from '~/components/Common/Form/TxnSeparator';
import useToggle from '~/hooks/display/useToggle';
import { combineBalances, optimizeFromMode } from '~/util/Farm';
import usePreferredToken from '~/hooks/guvnor/usePreferredToken';
import useTokenMap from '~/hooks/chain/useTokenMap';
import { useSigner } from '~/hooks/ledger/useSigner';
import { useFetchGuvnorFirm } from '~/state/guvnor/firm/updater';
import { parseError } from '~/util';
import { useFetchGuvnorBalances } from '~/state/guvnor/balances/updater';
import { AppState } from '~/state';
import { useFetchPools } from '~/state/hooligan/pools/updater';
import { useFetchHooliganhordeFirm } from '~/state/hooliganhorde/firm/updater';
import useFarm from '~/hooks/sdk/useFarm';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

// -----------------------------------------------------------------------

type DepositFormValues = FormState & {
  settings: {
    slippage: number;
  }
};

// -----------------------------------------------------------------------

const DepositForm : FC<
  FormikProps<DepositFormValues> & {
    tokenList: (ERC20Token | NativeToken)[];
    whitelistedToken: ERC20Token | NativeToken;
    amountToBdv: (amount: BigNumber) => BigNumber;
    balances: GuvnorBalances;
    contract: ethers.Contract;
    handleQuote: QuoteHandler;
  }
> = ({
  // Custom
  tokenList,
  whitelistedToken,
  amountToBdv,
  balances,
  contract,
  handleQuote,
  // Formik
  values,
  isSubmitting,
  setFieldValue,
}) => {
  const [isTokenSelectVisible, showTokenSelect, hideTokenSelect] = useToggle();
  const { amount, bdv, horde, prospects, actions } = HooliganhordeSDK.Firm.Deposit.deposit(
    whitelistedToken,
    values.tokens,
    amountToBdv,
  );

  /// Derived
  const isReady = bdv.gt(0);

  ///
  const handleSelectTokens = useCallback((_tokens: Set<Token>) => {
    // If the user has typed some existing values in,
    // save them. Add new tokens to the end of the list.
    // FIXME: match sorting of erc20TokenList
    const copy = new Set(_tokens);
    const newValue = values.tokens.filter((x) => {
      copy.delete(x.token);
      return _tokens.has(x.token);
    });
    setFieldValue('tokens', [
      ...newValue,
      ...Array.from(copy).map((_token) => ({
        token: _token,
        amount: undefined
      })),
    ]);
  }, [values.tokens, setFieldValue]);

  return (
    <Form noValidate autoComplete="off">
      <TokenSelectDialog
        open={isTokenSelectVisible}
        handleClose={hideTokenSelect}
        handleSubmit={handleSelectTokens}
        selected={values.tokens}
        balances={balances}
        tokenList={tokenList}
        mode={TokenSelectMode.SINGLE}
      />
      <Stack gap={1}>
        {values.tokens.map((tokenState, index) => (
          <TokenQuoteProvider
            key={`tokens.${index}`}
            name={`tokens.${index}`}
            tokenOut={whitelistedToken}
            balance={balances[tokenState.token.address] || ZERO_BN}
            state={tokenState}
            showTokenSelect={showTokenSelect}
            handleQuote={handleQuote}
          />
        ))}
        {isReady ? (
          <>
            <TxnSeparator />
            <TokenOutputField
              token={whitelistedToken}
              amount={amount}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="center">
              <Box sx={{ flex: 1 }}>
                <TokenOutputField
                  token={HORDE}
                  amount={horde}
                  amountTooltip={(
                    <>
                      1 {whitelistedToken.symbol} = {displayFullBN(amountToBdv(new BigNumber(1)))} BDV<br />
                      1 BDV &rarr; {whitelistedToken.getHorde().toString()} HORDE
                      {/* {displayFullBN(bdv, HOOLIGAN[1].displayDecimals)} BDV &rarr; {displayFullBN(horde, HORDE.displayDecimals)} HORDE */}
                    </>
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TokenOutputField
                  token={PROSPECTS}
                  amount={prospects}
                  amountTooltip={(
                    <>
                      1 {whitelistedToken.symbol} = {displayFullBN(amountToBdv(new BigNumber(1)))} BDV<br />
                      1 BDV &rarr; {whitelistedToken.getProspects().toString()} PROSPECTS
                      {/* {displayFullBN(bdv, HOOLIGAN[1].displayDecimals)} BDV &rarr; {displayFullBN(prospects, PROSPECTS.displayDecimals)} PROSPECT */}
                    </>
                  )}
                />
              </Box>
            </Stack>
            <Box>
              <Accordion variant="outlined">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={actions}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          </>
        ) : null}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={isSubmitting || amount.lte(0)}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          contract={contract}
          tokens={values.tokens}
          mode="auto"
        >
          Deposit
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

// -----------------------------------------------------------------------

const Deposit : FC<{
  pool: Pool;
  token: ERC20Token | NativeToken;
}> = ({
  pool,
  token: whitelistedToken
}) => {
  /// Chain Constants
  const getChainToken = useGetChainToken();
  const Hooligan          = getChainToken(HOOLIGAN);
  const Eth           = getChainToken(ETH);
  const Weth          = getChainToken(WETH);
  const urHooligan        = getChainToken(UNRIPE_HOOLIGAN);
  const urHooliganCrv3    = getChainToken(UNRIPE_HOOLIGAN_CRV3);

  /// FIXME: name
  /// FIXME: finish deposit functionality for other tokens
  const middleware = useFormMiddleware();
  const initTokenList = useMemo(() => (whitelistedToken === Hooligan ? [
    HOOLIGAN,
    ETH,
  ] : [
    HOOLIGAN,
    ETH,
    whitelistedToken,
    CRV3,
    DAI,
    USDC,
    USDT
  ]), [Hooligan, whitelistedToken]);
  const allAvailableTokens = useTokenMap(initTokenList);

  /// Derived
  const isUnripe = (
    whitelistedToken === urHooligan || 
    whitelistedToken === urHooliganCrv3
  );

  /// Token List
  const [tokenList, preferredTokens] = useMemo(() => {
    // Exception: if page is Depositing Unripe assets
    // then constrain the token list to only unripe.
    if (isUnripe) {
      return [
        [whitelistedToken],
        [{ token: whitelistedToken }]
      ];
    } 

    const _tokenList = Object.values(allAvailableTokens);
    return [
      _tokenList,
      _tokenList.map((t) => ({ token: t })),
    ];
  }, [
    isUnripe,
    whitelistedToken,
    allAvailableTokens,
  ]);
  const baseToken = usePreferredToken(preferredTokens, 'use-best') as (ERC20Token | NativeToken);

  /// Hooliganhorde
  const bdvPerToken = useSelector<AppState, AppState['_hooliganhorde']['firm']['balances'][string]['bdvPerToken'] | BigNumber>(
    (state) => state._hooliganhorde.firm.balances[whitelistedToken.address]?.bdvPerToken || ZERO_BN
  );
  const amountToBdv = useCallback((amount: BigNumber) => bdvPerToken.times(amount), [bdvPerToken]);

  /// Guvnor
  const balances                = useGuvnorBalances();
  const [refetchGuvnorFirm]     = useFetchFarmerFirm();
  const [refetchGuvnorBalances] = useFetchFarmerBalances();
  const [refetchPools]          = useFetchPools();
  const [refetchFirm]           = useFetchHooliganhordeFirm();

  /// Network
  const { data: signer } = useSigner();
  const hooliganhorde = useHooliganhordeContract(signer);

  /// Farm
  const farm = useFarm();

  /// Form setup
  const initialValues : DepositFormValues = useMemo(() => ({
    settings: {
      slippage: 0.1,
    },
    tokens: [
      {
        token: baseToken,
        amount: undefined,
        quoting: false,
        amountOut: undefined,
      },
    ],
  }), [baseToken]);

  /// Handlers
  // This handler does not run when _tokenIn = _tokenOut (direct deposit)
  const handleQuote = useCallback<QuoteHandler>(
    async (_tokenIn, _amountIn, _tokenOut) => {
      const tokenIn  : ERC20Token = _tokenIn  instanceof NativeToken ? Weth : _tokenIn;
      const tokenOut : ERC20Token = _tokenOut instanceof NativeToken ? Weth : _tokenOut;
      const amountIn = ethers.BigNumber.from(toStringBaseUnitBN(_amountIn, tokenIn.decimals));
      const balanceIn : Balance   = _tokenIn  instanceof NativeToken 
        ? combineBalances(balances[Weth.address], balances[ETH[1].address])
        : balances[_tokenIn.address];

      //
      let estimate;

      // Depositing HOOLIGAN
      if (tokenOut === getChainToken(HOOLIGAN)) {
        if (tokenIn === Weth) {
          estimate = await Farm.estimate(
            farm.buyHooligans(), // this assumes we're coming from WETH
            [amountIn]
          );
        }
      } 
      
      // Depositing LP Tokens
      else {
        if (!pool) throw new Error(`Depositing to ${tokenOut.symbol} but no corresponding pool data found.`);
        
        // This is a Curve MetaPool...
        const isMetapool = true;
        if (isMetapool) {
          // ...and we're depositing one of the underlying pool tokens.
          // Ex. for HOOLIGAN:3CRV this could be [HOOLIGAN, (DAI, USDC, USDT)].
          // pool.tokens      = [HOOLIGAN, CRV3]
          // pool.underlying  = [HOOLIGAN, DAI, USDC, USDT] 
          const tokenIndex = pool.tokens.indexOf(tokenIn);
          const underlyingTokenIndex = pool.underlying.indexOf(tokenIn);
          console.debug('[Deposit] LP Deposit', {
            pool,
            tokenIn,
            tokenIndex,
            underlyingTokenIndex,
          });
          
          // This is X or CRV3
          if (tokenIndex > -1) {
            const indices = [0, 0];
            indices[tokenIndex] = 1; // becomes [0, 1] or [1, 0]
            console.debug('[Deposit] LP Deposit: indices=', indices);
            estimate = await Farm.estimate([
              farm.addLiquidity(
                pool.address,
                // FIXME: hooligan:lusd was a plain pool, hooligan:eth on curve would be a crypto pool
                // perhaps the Curve pool instance needs to track a registry
                farm.contracts.curve.registries.metaFactory.address,
                // FIXME: find a better way to define this above
                indices as [number, number],
                optimizeFromMode(_amountIn, balanceIn) // use the BN version here
              ),
            ], [amountIn]);
          }

          // This is a CRV3-underlying stable (DAI/USDC/USDT etc)
          else if (underlyingTokenIndex > -1) {
            if (underlyingTokenIndex === 0) throw new Error('Malformatted pool.tokens / pool.underlying');
            const indices = [0, 0, 0];
            indices[underlyingTokenIndex - 1] = 1;
            console.debug('[Deposit] LP Deposit: indices=', indices);
            estimate = await Farm.estimate([
              // Deposit token into 3pool for 3CRV
              farm.addLiquidity(
                farm.contracts.curve.pools.pool3.address,
                farm.contracts.curve.registries.poolRegistry.address,
                indices as [number, number, number], // [DAI, USDC, USDT] use Tether from previous call
                optimizeFromMode(_amountIn, balanceIn) // use the BN version here
              ),
              farm.addLiquidity(
                pool.address,
                farm.contracts.curve.registries.metaFactory.address,
                // adding the 3CRV side of liquidity
                // FIXME: assuming that 3CRV is the second index (X:3CRV)
                // not sure if this is always the case
                [0, 1]
              ),
            ], [amountIn]);
          }

          // This is ETH or WETH
          else if (tokenIn === Weth) {
            estimate = await Farm.estimate([
              // FIXME: this assumes the best route from
              // WETH to [DAI, USDC, USDT] is via tricrypto2
              // swapping to USDT. we should use routing logic here to
              // find the best pool and output token.
              // --------------------------------------------------
              // WETH -> USDT
              farm.exchange(
                farm.contracts.curve.pools.tricrypto2.address,
                farm.contracts.curve.registries.cryptoFactory.address,
                Weth.address,
                getChainToken(USDT).address,
                // The prior step is a ETH->WETH "swap", from which
                // we should expect to get an exact amount of WETH.
                FarmFromMode.INTERNAL,
              ),
              // USDT -> deposit into pool3 for CRV3
              // FIXME: assumes USDT is the third index
              farm.addLiquidity(
                farm.contracts.curve.pools.pool3.address,
                farm.contracts.curve.registries.poolRegistry.address,
                [0, 0, 1], // [DAI, USDC, USDT]; use Tether from previous call
              ),
              // CRV3 -> deposit into right side of X:CRV3
              // FIXME: assumes CRV3 is the second index
              farm.addLiquidity(
                pool.address,
                farm.contracts.curve.registries.metaFactory.address,
                [0, 1],    // [HOOLIGAN, CRV3] use CRV3 from previous call
              ),
            ], [amountIn]);
          }
        }
      }

      if (!estimate) {
        throw new Error(`Depositing ${tokenOut.symbol} to the Firm via ${tokenIn.symbol} is currently unsupported.`);
      }

      console.debug('[chain] estimate = ', estimate);

      return {
        amountOut: toTokenUnitsBN(estimate.amountOut.toString(), tokenOut.decimals),
        steps: estimate.steps,
      };
    },
    [
      farm,
      pool,
      getChainToken,
      Weth,
      balances,
    ]
  );

  const onSubmit = useCallback(async (values: DepositFormValues, formActions: FormikHelpers<DepositFormValues>) => {
    let txToast;
    try {
      middleware.before();
      if (!values.settings.slippage) throw new Error('No slippage value set');
      const formData = values.tokens[0];
      if (values.tokens.length > 1) throw new Error('Only one token supported at this time');
      if (!formData?.amount || formData.amount.eq(0)) throw new Error('Enter an amount to deposit');

      // FIXME: getting BDV per amount here
      const { amount } = HooliganhordeSDK.Firm.Deposit.deposit(
        whitelistedToken,
        values.tokens,
        amountToBdv,
      );

      txToast = new TransactionToast({
        loading: `Depositing ${displayFullBN(amount.abs(), whitelistedToken.displayDecimals, whitelistedToken.displayDecimals)} ${whitelistedToken.name} into the Firm...`,
        success: 'Deposit successful.',
      });

      // TEMP: recast as Hooliganhorde 
      const b = ((hooliganhorde as unknown) as Hooliganhorde);
      const data : string[] = [];
      const inputToken = formData.token;
      let value = ZERO_BN;
      let depositAmount;
      let depositFrom;

      // Direct Deposit
      if (inputToken === whitelistedToken) {
        // TODO: verify we have approval for `inputToken`
        depositAmount = formData.amount; // implicit: amount = amountOut since the tokens are the same
        depositFrom   = FarmFromMode.INTERNAL_EXTERNAL;
      }
      
      // Swap and Deposit
      else {
        // Require a quote
        if (!formData.steps || !formData.amountOut) throw new Error(`No quote available for ${formData.token.symbol}`);

        // Wrap ETH to WETH
        if (inputToken === Eth) {
          value = value.plus(formData.amount); 
          data.push(b.interface.encodeFunctionData('wrapEth', [
            toStringBaseUnitBN(value, Eth.decimals),
            FarmToMode.INTERNAL, // to
          ]));
        }
        
        // `amountOut` of `firmToken` is received when swapping for 
        // `amount` of `inputToken`. this may include multiple swaps.
        // using "tolerant" mode allows for slippage during swaps.
        depositAmount = formData.amountOut;
        depositFrom   = FarmFromMode.INTERNAL_TOLERANT;

        // Encode steps to get from token i to firmToken
        const encoded = Farm.encodeStepsWithSlippage(
          formData.steps,
          values.settings.slippage / 100,
        );
        data.push(...encoded);
        encoded.forEach((_data, index) => 
          console.debug(`[Deposit] step ${index}:`, formData.steps?.[index]?.decode(_data).map((elem) => (elem instanceof ethers.BigNumber ? elem.toString() : elem)))
        );
      } 

      // Deposit step
      data.push(
        b.interface.encodeFunctionData('deposit', [
          whitelistedToken.address,
          toStringBaseUnitBN(depositAmount, whitelistedToken.decimals),  // expected amountOut from all steps
          depositFrom,
        ])
      );
    
      const txn = await b.farm(data, { value: toStringBaseUnitBN(value, Eth.decimals) });
      txToast.confirming(txn);

      const receipt = await txn.wait();
      await Promise.all([
        refetchGuvnorFirm(),
        refetchGuvnorBalances(),
        refetchPools(),
        refetchFirm(),
      ]);
      txToast.success(receipt);
      formActions.resetForm();
    } catch (err) {
      txToast ? txToast.error(err) : toast.error(parseError(err));
      formActions.setSubmitting(false);
    }
  }, [
    Eth,
    hooliganhorde,
    whitelistedToken,
    amountToBdv,
    refetchGuvnorFirm,
    refetchGuvnorBalances,
    refetchPools,
    refetchFirm,
    middleware,
  ]);

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formikProps) => (
        <>
          <TxnSettings placement="form-top-right">
            <SettingInput name="settings.slippage" label="Slippage Tolerance" endAdornment="%" />
          </TxnSettings>
          <DepositForm
            handleQuote={handleQuote}
            amountToBdv={amountToBdv}
            tokenList={tokenList as (ERC20Token | NativeToken)[]}
            whitelistedToken={whitelistedToken}
            balances={balances}
            contract={hooliganhorde}
            {...formikProps}
          />
        </>
      )}
    </Formik>
  );
};

export default Deposit;
