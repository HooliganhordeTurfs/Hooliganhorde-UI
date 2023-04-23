import { Accordion, AccordionDetails, Alert, Box, Divider, Link, Stack, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useProvider } from 'wagmi';
import toast from 'react-hot-toast';
import TransactionToast from '~/components/Common/TxnToast';
import { TokenSelectMode } from '~/components/Common/Form/TokenSelectDialog';
import {
  FormState,
  SettingInput,
  SlippageSettingsFragment,
  SmartSubmitButton,
  TokenOutputField,
  TokenQuoteProvider,
  TokenSelectDialog,
  TxnPreview,
  TxnSeparator,
  TxnSettings
} from '~/components/Common/Form';
import Token, { ERC20Token, NativeToken } from '~/classes/Token';
import { Hooliganhorde } from '~/generated/index';
import useToggle from '~/hooks/display/useToggle';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import useGuvnorBalances from '~/hooks/guvnor/useFarmerBalances';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import usePreferredToken, { PreferredToken } from '~/hooks/guvnor/usePreferredToken';
import { QuoteHandler } from '~/hooks/ledger/useQuote';
import useTokenMap from '~/hooks/chain/useTokenMap';
import Farm, { ChainableFunction, FarmFromMode, FarmToMode } from '~/lib/Hooliganhorde/Farm';
import { displayBN, displayFullBN, MinBN, parseError, toStringBaseUnitBN, toTokenUnitsBN } from '~/util';
import { useSigner } from '~/hooks/ledger/useSigner';
import usePrice from '~/hooks/hooliganhorde/usePrice';
import { optimizeFromMode } from '~/util/Farm';
import { useFetchGuvnorField } from '~/state/guvnor/field/updater';
import { useFetchGuvnorBalances } from '~/state/guvnor/balances/updater';
import { useFetchHooliganhordeField } from '~/state/hooliganhorde/field/updater';
import { useFetchPools } from '~/state/hooligan/pools/updater';
import { AppState } from '~/state';
import { HOOLIGAN, ETH, ROOKIES, WETH } from '~/constants/tokens';
import { ZERO_BN } from '~/constants';
import StyledAccordionSummary from '~/components/Common/Accordion/AccordionSummary';
import { ActionType } from '~/util/Actions';
import { IconSize } from '~/components/App/muiTheme';
import IconWrapper from '~/components/Common/IconWrapper';
import TokenIcon from '~/components/Common/TokenIcon';
import Row from '~/components/Common/Row';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

type SowFormValues = FormState & {
  settings: SlippageSettingsFragment;
  maxAmountIn: BigNumber | undefined;
};

const SowForm : FC<
  FormikProps<SowFormValues>
  & {
    handleQuote: QuoteHandler;
    balances: ReturnType<typeof useGuvnorBalances>;
    hooliganhorde: Hooliganhorde;
    weather: BigNumber;
    rage: BigNumber;
    farm: Farm;
  }
> = ({
  // Formik
  values,
  setFieldValue,
  //
  balances,
  hooliganhorde,
  weather,
  rage,
  farm,
  handleQuote,
}) => {
  const [isTokenSelectVisible, showTokenSelect, hideTokenSelect] = useToggle();

  /// Chain
  const getChainToken = useGetChainToken();
  const Hooligan          = getChainToken(HOOLIGAN);
  const Eth           = getChainToken<NativeToken>(ETH);
  const Weth          = getChainToken<ERC20Token>(WETH);
  const erc20TokenMap = useTokenMap<ERC20Token | NativeToken>([HOOLIGAN, ETH, WETH]);

  ///
  const hooliganPrice      = usePrice();
  const hooliganhordeField = useSelector<AppState, AppState['_hooliganhorde']['field']>((state) => state._hooliganhorde.field);

  /// Derived
  const tokenIn   = values.tokens[0].token;     // converting from token
  const amountIn  = values.tokens[0].amount;    // amount of from token
  const tokenOut  = Hooligan;                       // converting to token
  const amountOut = values.tokens[0].amountOut; // amount of to token
  const maxAmountIn    = values.maxAmountIn;
  const tokenInBalance = balances[tokenIn.address];

  /// Calculations
  const hasRage = rage.gt(0);
  const hooligans   = (tokenIn === Hooligan)
    ? amountIn  || ZERO_BN
    : amountOut || ZERO_BN;
  const isSubmittable = hasRage && hooligans?.gt(0);
  const numRookies       = hooligans.multipliedBy(weather.div(100).plus(1));
  const rookieLineLength = hooliganhordeField.podIndex.minus(hooliganhordeField.draftableIndex);

  const maxAmountUsed = (amountIn && maxAmountIn) 
    ? amountIn.div(maxAmountIn) 
    : null;

  /// Token select
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
      ...Array.from(copy).map((_token) => ({ token: _token, amount: undefined })),
    ]);
  }, [values.tokens, setFieldValue]);

  /// FIXME: standardized `maxAmountIn` approach?
  /// When `tokenIn` or `tokenOut` changes, refresh the
  /// max amount that the user can input of `tokenIn`.
  useEffect(() => {
    (async () => {
      if (hasRage) {
        if (tokenIn === Hooligan) {
          /// 1 RAGE is consumed by 1 HOOLIGAN
          setFieldValue('maxAmountIn', rage);
        } else if (tokenIn === Eth || tokenIn === Weth) {
          /// Estimate how many ETH it will take to buy `rage` HOOLIGAN.
          /// TODO: across different forms of `tokenIn`.
          /// This (obviously) only works for Eth and Weth.
          const estimate = await Farm.estimate(
            farm.buyHooligans(),
            [ethers.BigNumber.from(Hooligan.stringify(rage))],
            false, // forward = false -> run the calc backwards
          );
          setFieldValue(
            'maxAmountIn',
            toTokenUnitsBN(
              estimate.amountOut.toString(),
              tokenIn.decimals
            ),
          );
        } else {
          throw new Error(`Unsupported tokenIn: ${tokenIn.symbol}`);
        }
      } else {
        setFieldValue('maxAmountIn', ZERO_BN);
      }
    })();
  }, [Hooligan, Eth, Weth, hooliganhorde, hasRage, farm, setFieldValue, rage, tokenIn, tokenOut]);

  return (
    <Form autoComplete="off">
      <TokenSelectDialog
        open={isTokenSelectVisible}
        handleClose={hideTokenSelect}
        handleSubmit={handleSelectTokens}
        selected={values.tokens}
        balances={balances}
        tokenList={Object.values(erc20TokenMap)}
        mode={TokenSelectMode.SINGLE}
      />
      <Stack gap={1}>
        <TokenQuoteProvider
          key="tokens.0"
          name="tokens.0"
          tokenOut={Hooligan}
          disabled={!hasRage || !values.maxAmountIn}
          max={MinBN(
            values.maxAmountIn || ZERO_BN,
            tokenInBalance?.total || ZERO_BN
          )}
          balance={tokenInBalance || undefined}
          state={values.tokens[0]}
          showTokenSelect={showTokenSelect}
          handleQuote={handleQuote}
        />
        {!hasRage ? (
          <Box>
            <Alert color="warning" icon={<IconWrapper boxSize={IconSize.medium}><WarningAmberIcon sx={{ fontSize: IconSize.small }} /></IconWrapper>} sx={{ color: 'black' }}>
              There is currently no Rage. <Link href="https://docs.hooligan.money/almanac/farm/field#rage" target="_blank" rel="noreferrer">Learn more</Link>
            </Alert>
          </Box>
        ) : null}
        {isSubmittable ? (
          <>
            <TxnSeparator />
            <TokenOutputField
              token={ROOKIES}
              amount={numRookies}
              override={(
                <Row gap={0.5}>
                  <TokenIcon
                    token={ROOKIES}
                    css={{
                      height: IconSize.small,
                    }}
                  />
                  <Typography variant="bodyMedium">
                    <Typography display={{ xs: 'none', sm: 'inline' }} variant="bodyMedium">{ROOKIES.symbol} </Typography>@ {displayBN(rookieLineLength)}
                  </Typography>
                </Row>
              )}
            />
            {(maxAmountUsed && maxAmountUsed.gt(0.9)) ? (
              <Box>
                <Alert
                  color="warning"
                  icon={<IconWrapper boxSize={IconSize.medium}><WarningAmberIcon sx={{ fontSize: IconSize.small }} /></IconWrapper>}
                  sx={{ color: 'black' }}
                >
                  If there is less Rage at the time of execution, this transaction will Sow Hooligans into the remaining Rage and send any unused Hooligans to your Farm Balance.
                  {/* You are Sowing {displayFullBN(maxAmountUsed.times(100), 4, 0)}% of remaining Rage.  */}
                </Alert>
              </Box>
            ) : null}
            <Box>
              <Accordion variant="outlined" color="primary">
                <StyledAccordionSummary title="Transaction Details" />
                <AccordionDetails>
                  <TxnPreview
                    actions={[
                      {
                        type: ActionType.BUY_HOOLIGANS,
                        hooliganAmount: hooligans,
                        hooliganPrice: hooliganPrice,
                        token: tokenIn,
                        tokenAmount: amountIn || ZERO_BN
                      },
                      {
                        type: ActionType.BURN_HOOLIGANS,
                        amount: hooligans
                      },
                      {
                        type: ActionType.RECEIVE_ROOKIES,
                        rookieAmount: numRookies,
                        placeInLine: rookieLineLength
                      }
                    ]}
                  />
                  <Divider sx={{ my: 2, opacity: 0.4 }} />
                  <Box pb={1}>
                    <Typography variant="body2" alignItems="center">
                      Rookies become <strong>Draftable</strong> on a first in, first out <Link href="https://docs.hooligan.money/almanac/protocol/glossary#fifo" target="_blank" rel="noreferrer" underline="hover">(FIFO)</Link> basis. Upon <strong>Draft</strong>, each Pod is redeemed for <span><TokenIcon token={HOOLIGAN[1]} css={{ height: IconSize.xs, marginTop: 2.6 }} /></span>1.
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          </>
        ) : null}
        <SmartSubmitButton
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={!isSubmittable}
          contract={hooliganhorde}
          tokens={values.tokens}
          mode="auto"
        >
          Sow
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

// ---------------------------------------------------

const PREFERRED_TOKENS : PreferredToken[] = [
  {
    token: HOOLIGAN,
    minimum: new BigNumber(1),    // $1
  },
  {
    token: ETH,
    minimum: new BigNumber(0.001) // ~$2-4
  },
  {
    token: WETH,
    minimum: new BigNumber(0.001) // ~$2-4
  }
];

const Sow : FC<{}> = () => {
  /// Tokens
  const getChainToken = useGetChainToken();
  const Hooligan          = getChainToken(HOOLIGAN);
  const Eth           = getChainToken(ETH);
  const Weth          = getChainToken(WETH);

  /// Ledger
  const { data: signer } = useSigner();
  const provider  = useProvider();
  const hooliganhorde = useHooliganhordeContract(signer);

  /// Farm
  const farm      = useMemo(() => new Farm(provider), [provider]);

  /// Hooliganhorde
  const weather = useSelector<AppState, AppState['_hooliganhorde']['field']['weather']['yield']>((state) => state._hooliganhorde.field.weather.yield);
  const rage    = useSelector<AppState, AppState['_hooliganhorde']['field']['rage']>((state) => state._hooliganhorde.field.rage);
  
  /// Guvnor
  const balances                = useGuvnorBalances();
  const [refetchHooliganhordeField] = useFetchHooliganhordeField();
  const [refetchPools]          = useFetchPools();
  const [refetchGuvnorField]    = useFetchFarmerField();
  const [refetchGuvnorBalances] = useFetchFarmerBalances();

  /// Form
  const middleware = useFormMiddleware();
  const baseToken = usePreferredToken(PREFERRED_TOKENS, 'use-best');
  const initialValues : SowFormValues = useMemo(() => ({
    settings: {
      slippage: 0.1, // 0.1%
    },
    tokens: [
      {
        token: baseToken as (ERC20Token | NativeToken),
        amount: undefined,
      },
    ],
    maxAmountIn: undefined,
  }), [baseToken]);

  /// Handlers
  // This handler does not run when _tokenIn = _tokenOut
  // _tokenOut === Hooligan 
  const handleQuote = useCallback<QuoteHandler>(
    async (_tokenIn, _amountIn, _tokenOut) => {
      const steps : ChainableFunction[] = [];

      if (_tokenIn === Eth) {
        steps.push(...[
          farm.wrapEth(FarmToMode.INTERNAL),       // wrap ETH to WETH (internal)
          ...farm.buyHooligans(FarmFromMode.INTERNAL)  // buy Hooligans using internal WETH
        ]);
      } else if (_tokenIn === Weth) {
        steps.push(
          ...farm.buyHooligans(
            optimizeFromMode(_amountIn, balances[Weth.address]),
          )
        );
      } else {
        throw new Error(`Sowing via ${_tokenIn.symbol} is not currently supported`);
      }

      const amountIn = ethers.BigNumber.from(toStringBaseUnitBN(_amountIn, _tokenIn.decimals));
      const estimate = await Farm.estimate(
        steps,
        [amountIn]
      );
      
      return {
        amountOut: toTokenUnitsBN(estimate.amountOut.toString(), _tokenOut.decimals),
        value: estimate.value,
        steps: estimate.steps,
      };
    },
    [Weth, Eth, farm, balances]
  );

  const onSubmit = useCallback(async (values: SowFormValues, formActions: FormikHelpers<SowFormValues>) => {
    let txToast;
    try {
      middleware.before();

      const formData = values.tokens[0];
      const tokenIn = formData.token;
      const amountHooligans = tokenIn === Hooligan ? formData.amount : formData.amountOut;
      if (values.tokens.length > 1) throw new Error('Only one token supported at this time');
      if (!amountHooligans || amountHooligans.eq(0)) throw new Error('No amount set');
      
      const data : string[] = [];
      const amountRookies = amountHooligans.times(weather.div(100).plus(1));
      let finalFromMode : FarmFromMode;
      
      txToast = new TransactionToast({
        loading: `Sowing ${displayFullBN(amountHooligans, Hooligan.decimals)} Hooligans for ${displayFullBN(amountRookies, ROOKIES.decimals)} Pods...`,
        success: 'Sow successful.',
      });
      
      /// Sow directly from HOOLIGAN
      if (tokenIn === Hooligan) {
        // No swap occurs, so we know exactly how many hooligans are going in.
        // We can select from INTERNAL, EXTERNAL, INTERNAL_EXTERNAL.
        finalFromMode = optimizeFromMode(amountHooligans, balances[Hooligan.address]);
      }
      
      /// Swap to HOOLIGAN and Sow
      else if (tokenIn === Eth || tokenIn === Weth) {
        // Require a quote
        if (!formData.steps || !formData.amountOut) throw new Error(`No quote available for ${formData.token.symbol}`);

        const encoded = Farm.encodeStepsWithSlippage(
          formData.steps,
          values.settings.slippage / 100,
        ); // 
        data.push(...encoded);

        // At the end of the Swap step, the assets will be in our INTERNAL balance.
        // The Swap decides where to route them from (see handleQuote).
        finalFromMode = FarmFromMode.INTERNAL_TOLERANT;
      } else {
        throw new Error(`Sowing via ${tokenIn.symbol} is not currently supported`);
      }
      
      data.push(
        hooliganhorde.interface.encodeFunctionData('sow', [
          toStringBaseUnitBN(amountHooligans, Hooligan.decimals),
          finalFromMode,
        ])
      );
 
      const overrides = { value: formData.value };
      const txn = await hooliganhorde.farm(data, overrides);
      txToast.confirming(txn);
      
      const receipt = await txn.wait();
      await Promise.all([
        refetchGuvnorField(),     // get guvnor's plots
        refetchGuvnorBalances(),  // get guvnor's token balances
        refetchHooliganhordeField(),  // get hooliganhorde field data (ex. amount of Rage left)
        refetchPools(),           // get price data [TODO: optimize if we bought hooligans]
      ]);  
      txToast.success(receipt);
      formActions.resetForm();
    } catch (err) {
      console.error(err);
      txToast?.error(err) || toast.error(parseError(err));
    } finally {
      formActions.setSubmitting(false);
    }
  }, [
    hooliganhorde,
    weather,
    Hooligan,
    Eth,
    Weth,
    balances,
    refetchGuvnorField,
    refetchGuvnorBalances,
    refetchHooliganhordeField,
    refetchPools,
    middleware,
  ]);

  return (
    <Formik<SowFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {(formikProps: FormikProps<SowFormValues>) => (
        <>
          <TxnSettings placement="form-top-right">
            <SettingInput name="settings.slippage" label="Slippage Tolerance" endAdornment="%" />
          </TxnSettings>
          <SowForm
            handleQuote={handleQuote}
            balances={balances}
            hooliganhorde={hooliganhorde}
            weather={weather}
            rage={rage}
            farm={farm}
            {...formikProps}
          />
        </>
      )}
    </Formik>
  );
};

export default Sow;
