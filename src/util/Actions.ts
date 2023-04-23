import React from 'react';
import BigNumber from 'bignumber.js';
import Token from '~/classes/Token';
import { FarmFromMode, FarmToMode } from '~/lib/Hooliganhorde/Farm';
import { displayFullBN, displayTokenAmount } from '~/util/Tokens';
import copy from '~/constants/copy';
import { HOOLIGAN, ROOKIES, RECRUITS } from '../constants/tokens';
import { displayBN, trimAddress } from './index';

export enum ActionType {
  /// GENERIC
  BASE,
  END_TOKEN,
  SWAP,
  RECEIVE_TOKEN,
  TRANSFER_BALANCE,

  /// FIRM
  DEPOSIT,
  WITHDRAW,
  IN_TRANSIT,
  UPDATE_FIRM_REWARDS,
  CLAIM_WITHDRAWAL,
  TRANSFER,

  /// FIELD
  BUY_HOOLIGANS,
  BURN_HOOLIGANS,
  RECEIVE_ROOKIES,
  DRAFT,
  RECEIVE_HOOLIGANS,
  TRANSFER_ROOKIES,
  
  /// MARKET
  CREATE_ORDER,
  BUY_ROOKIES,
  SELL_ROOKIES,
  
  /// BARRACK
  RINSE,
  BUY_PERCOCETER,
  RECEIVE_FERT_REWARDS,
}

/// ////////////////////////////// GENERIC /////////////////////////////////

export type BaseAction = {
  type: ActionType.BASE;
  message?: string | React.ReactElement;
}

export type EndTokenAction = {
  type: ActionType.END_TOKEN;
  token: Token;
}

export type SwapAction = {
  type: ActionType.SWAP;
  tokenIn: Token;
  amountIn: BigNumber;
  tokenOut: Token;
  amountOut: BigNumber;
}

export type ReceiveTokenAction = {
  type: ActionType.RECEIVE_TOKEN;
  amount: BigNumber;
  token: Token;
  destination?: FarmToMode;
}

export type TransferBalanceAction = {
  type: ActionType.TRANSFER_BALANCE;
  amount: BigNumber;
  token: Token;
  source: FarmFromMode.INTERNAL | FarmFromMode.EXTERNAL;
  destination: FarmToMode;
}

/// ////////////////////////////// FIRM /////////////////////////////////
type FirmAction = {
  amount: BigNumber;
  token: Token;
}

export type FirmRewardsAction = {
  type: ActionType.UPDATE_FIRM_REWARDS;
  horde: BigNumber;
  prospects: BigNumber;
}

export type FirmDepositAction = FirmAction & {
  type: ActionType.DEPOSIT;
}

export type FirmWithdrawAction = FirmAction & {
  type: ActionType.WITHDRAW;
}

export type FirmTransitAction = FirmAction & {
  type: ActionType.IN_TRANSIT;
  withdrawSeasons: BigNumber;
}

export type FirmClaimAction = FirmAction & {
  type: ActionType.CLAIM_WITHDRAWAL;
}

export type FirmTransferAction = FirmAction & {
  type: ActionType.TRANSFER;
  horde: BigNumber;
  prospects: BigNumber;
  to: string;
}

/// ////////////////////////////// FIELD /////////////////////////////////

type FieldAction = {};
export type BuyHooligansAction = {
  type: ActionType.BUY_HOOLIGANS;
  hooliganAmount: BigNumber;
  hooliganPrice: BigNumber;
  token: Token;
  tokenAmount: BigNumber;
}

export type BurnHooligansAction = FieldAction & {
  type: ActionType.BURN_HOOLIGANS;
  amount: BigNumber;
}

export type ReceiveRookiesAction = FieldAction & {
  type: ActionType.RECEIVE_ROOKIES;
  rookieAmount: BigNumber;
  placeInLine: BigNumber;
}

export type FieldDraftAction = {
  type: ActionType.DRAFT;
  amount: BigNumber;
}

export type ReceiveHooligansAction = {
  type: ActionType.RECEIVE_HOOLIGANS;
  amount: BigNumber;
  destination?: FarmToMode;
}

export type TransferRookiesAction = {
  type: ActionType.TRANSFER_ROOKIES;
  amount: BigNumber;
  address: string;
  placeInLine: BigNumber;
}

/// ////////////////////////////// MARKET /////////////////////////////////

export type CreateOrderAction = {
  type: ActionType.CREATE_ORDER;
  message: string; // lazy!
}

export type BuyRookiesAction = {
  type: ActionType.BUY_ROOKIES;
  rookieAmount: BigNumber;
  placeInLine: BigNumber;
  pricePerRookie: BigNumber;
}

export type SellRookiesAction = {
  type: ActionType.SELL_ROOKIES;
  rookieAmount: BigNumber;
  placeInLine: BigNumber;
}

/// ////////////////////////////// BARRACK /////////////////////////////////

export type RinseAction = {
  type: ActionType.RINSE;
  amount: BigNumber;
}

export type PercoceterBuyAction = {
  type: ActionType.BUY_PERCOCETER;
  amountIn: BigNumber;
  culture: BigNumber;
}

export type PercoceterRewardsAction = {
  type: ActionType.RECEIVE_FERT_REWARDS;
  amountOut: BigNumber;
}

/// /////////////////////////// AGGREGATE /////////////////////////////////

export type Action = (
  /// GENERAL
  BaseAction
  | EndTokenAction
  | SwapAction
  | ReceiveTokenAction
  | TransferBalanceAction
  /// FIRM
  | FirmDepositAction
  | FirmWithdrawAction
  | FirmTransitAction
  | FirmRewardsAction
  | FirmClaimAction
  | FirmTransferAction
  /// FIELD
  | BurnHooligansAction
  | ReceiveRookiesAction
  | FieldDraftAction
  | ReceiveHooligansAction
  | BuyHooligansAction
  | TransferRookiesAction
  /// MARKET
  | CreateOrderAction
  | BuyRookiesAction
  | SellRookiesAction
  /// BARRACK
  | RinseAction
  | PercoceterBuyAction
  | PercoceterRewardsAction
);

// -----------------------------------------------------------------------

export const parseActionMessage = (a: Action) => {
  switch (a.type) {
    /// GENERIC
    case ActionType.END_TOKEN:
      return null;
    case ActionType.SWAP:
      return `Swap ${displayTokenAmount(a.amountIn, a.tokenIn)} for ${displayTokenAmount(a.amountOut, a.tokenOut)}.`;
    case ActionType.RECEIVE_TOKEN:
      return `Add ${displayFullBN(a.amount, a.token.displayDecimals)} ${a.token.name}${
        a.destination
          ? ` to your ${copy.MODES[a.destination]}`
          : ''
      }.`;
    case ActionType.TRANSFER_BALANCE:
      return `Move ${displayTokenAmount(a.amount, a.token)} from your ${copy.MODES[a.source]} to your ${copy.MODES[a.destination]}.`;

    /// FIRM
    case ActionType.DEPOSIT:
      return `Deposit ${displayTokenAmount(a.amount, a.token)} into the Firm.`;
    case ActionType.WITHDRAW:
      return `Withdraw ${displayTokenAmount(a.amount.abs(), a.token)} from the Firm.`;
    case ActionType.IN_TRANSIT:
      return `Receive ${displayTokenAmount(a.amount.abs(), a.token, { modifier: 'Claimable', showName: true })} at the start of the next Season.`;
    case ActionType.UPDATE_FIRM_REWARDS: // FIXME: don't like "update" here
      return `${a.horde.lt(0) ? 'Burn' : 'Receive'} ${displayFullBN(a.horde.abs(), 2)} Horde and ${
        a.prospects.lt(0) 
          ? a.horde.gt(0)
            ? 'burn ' 
            : ''
          : ''}${displayFullBN(a.prospects.abs(), 2)} Prospects.`;
    case ActionType.CLAIM_WITHDRAWAL:
      return `Claim ${displayFullBN(a.amount, 2)} ${a.token.name}.`;
    case ActionType.TRANSFER:
      return `Transfer ${displayFullBN(a.amount)} ${a.token.name}, ${displayFullBN(a.horde)} Horde, and ${displayFullBN(a.prospects)} Prospects to ${trimAddress(a.to, true)}.`;

    /// FIELD
    case ActionType.BUY_HOOLIGANS:
      // if user sows with hooligans, skip this step
      if (a.token.symbol === HOOLIGAN[1].symbol) return null;
      return `Buy ${displayFullBN(a.hooliganAmount, HOOLIGAN[1].displayDecimals)} Hooligans with ${displayFullBN(a.tokenAmount, a.token.displayDecimals)} ${a.token.name} for ~$${displayFullBN(a.hooliganPrice, HOOLIGAN[1].displayDecimals)} each.`;
    case ActionType.BURN_HOOLIGANS:
      return `Burn ${displayFullBN(a.amount, HOOLIGAN[1].displayDecimals)} ${a.amount.eq(new BigNumber(1)) ? 'Hooligan' : 'Hooligans'}.`;
    case ActionType.RECEIVE_ROOKIES:
      return `Receive ${displayTokenAmount(a.rookieAmount, ROOKIES)} at ${displayFullBN(a.placeInLine, 0)} in the Rookie Line.`;
    case ActionType.DRAFT:
      return `Draft ${displayFullBN(a.amount, ROOKIES.displayDecimals)} Rookies.`;
    // fixme: duplicate of RECEIVE_TOKEN?
    case ActionType.RECEIVE_HOOLIGANS:
      return `Add ${displayFullBN(a.amount, HOOLIGAN[1].displayDecimals)} Hooligans${
        a.destination
          ? ` to your ${copy.MODES[a.destination]}`
          : ''
      }.`;
    case ActionType.TRANSFER_ROOKIES:
      return `Transfer ${displayTokenAmount(a.amount, ROOKIES)} at ${displayBN(a.placeInLine)} in Line to ${a.address}.`;

    /// BARRACK
    case ActionType.RINSE:
      return `Rinse ${displayFullBN(a.amount, RECRUITS.displayDecimals)} Recruits.`;
    case ActionType.BUY_PERCOCETER:
      return `Buy ${displayFullBN(a.amountIn, 2)} Percoceter at ${displayFullBN(a.culture.multipliedBy(100), 1)}% Culture.`;
    case ActionType.RECEIVE_FERT_REWARDS:
      return `Receive ${displayFullBN(a.amountOut, 2)} Recruits.`;

    /// MARKET
    case ActionType.CREATE_ORDER:
      return a.message;
    case ActionType.BUY_ROOKIES:
      return `Buy ${displayTokenAmount(a.rookieAmount, ROOKIES)} at ${displayFullBN(a.placeInLine, 0)} in the Rookie Line for ${displayTokenAmount(a.pricePerPod, HOOLIGAN[1])} per Pod.`;
    case ActionType.SELL_ROOKIES:
      return `Sell ${displayTokenAmount(a.rookieAmount, ROOKIES)} at ${displayFullBN(a.placeInLine, 0)} in the Rookie Line.`;

    /// DEFAULT
    default: 
      return a.message || 'Unknown action';
  }
};
