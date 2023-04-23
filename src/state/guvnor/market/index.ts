import BigNumber from 'bignumber.js';
import { ZERO_BN } from '~/constants';
import { HOOLIGAN, ROOKIES } from '~/constants/tokens';
import {
  MarketStatus,
  RookieListingFragment,
  RookieOrderFragment,
} from '~/generated/graphql';
import { FarmToMode } from '~/lib/Hooliganhorde/Farm';
import { toTokenUnitsBN } from '~/util';

export enum PricingType {
  FIXED = 0,
  DYNAMIC = 1,
}

export type PricingTypes = PricingType | null;
export type PricingFunctions = string | null;

/**
 * Cast a Rookie Listing from Subgraph form -> Redux form.
 * @param listing The RookieListing as returned by the subgraph.
 * @returns Redux form of RookieListing.
 */
export const castRookieListing = (
  listing: RookieListingFragment,
  draftableIndex: BigNumber
): RookieListing => {
  const [account, id] = listing.id.split('-'); // Subgraph returns a conjoined ID
  const index = toTokenUnitsBN(id, HOOLIGAN[1].decimals);
  const maxDraftableIndex = toTokenUnitsBN(listing.maxDraftableIndex, HOOLIGAN[1].decimals);

  return {
    // Identifiers
    id: id,
    account: listing.guvnor.id || account,
    
    // Configuration
    index: index,
    start: toTokenUnitsBN(listing.start, HOOLIGAN[1].decimals),
    mode: listing.mode.toString() as FarmToMode, // FIXME: use numbers instead?
    
    // Constraints
    maxDraftableIndex: maxDraftableIndex,
    minFillAmount: toTokenUnitsBN(listing.minFillAmount || ZERO_BN, HOOLIGAN[1].decimals), // default to zero for backwards compat
    
    // Pricing
    pricingType: (listing?.pricingType as PricingType) || null,
    pricePerRookie: toTokenUnitsBN(listing.pricePerPod, HOOLIGAN[1].decimals), // if pricingTyped == null | 0
    pricingFunction: listing?.pricingFunction ?? null, // if pricingType == 1
    
    // Amounts [Relative to Original]
    originalIndex: toTokenUnitsBN(listing.originalIndex, HOOLIGAN[1].decimals),
    originalAmount: toTokenUnitsBN(listing.originalAmount, HOOLIGAN[1].decimals),
    filled: toTokenUnitsBN(listing.filled, HOOLIGAN[1].decimals),
    
    // Amounts [Relative to Child]
    amount: toTokenUnitsBN(listing.amount, HOOLIGAN[1].decimals),
    remainingAmount: toTokenUnitsBN(listing.remainingAmount, HOOLIGAN[1].decimals),
    filledAmount: toTokenUnitsBN(listing.filledAmount, HOOLIGAN[1].decimals),
    
    // Computed
    placeInLine: index.minus(draftableIndex),
    expiry: maxDraftableIndex.minus(draftableIndex),

    // Metadata
    status: listing.status as MarketStatus,
    createdAt: listing?.createdAt || null,
    creationHash: listing.creationHash,
  };
};

/**
 * Cast a Rookie Order from Subgraph form -> Redux form.
 * @param order The RookieOrder as returned by the subgraph.
 * @returns Redux form of RookieOrder.
 */
export const castRookieOrder = (order: PodOrderFragment): PodOrder => {
  const rookieAmount = toTokenUnitsBN(order.podAmount, HOOLIGAN[1].decimals);
  const hooliganAmount = toTokenUnitsBN(order.hooliganAmount, HOOLIGAN[1].decimals);
  const rookieAmountFilled = toTokenUnitsBN(order.podAmountFilled, HOOLIGAN[1].decimals);
  const hooliganAmountFilled = toTokenUnitsBN(order.hooliganAmountFilled, HOOLIGAN[1].decimals);

  return {
    // Identifiers
    id: order.id,
    account: order.guvnor.id,

    // Pricing
    pricingType: (order.pricingType as PricingType) || null,
    pricePerRookie: toTokenUnitsBN(order.pricePerPod, HOOLIGAN[1].decimals),  // if pricingTyped == null | 0
    pricingFunction: order?.pricingFunction ?? null, // if pricingType == 1

    // Constraints
    maxPlaceInLine: toTokenUnitsBN(order.maxPlaceInLine, HOOLIGAN[1].decimals),
    minFillAmount: toTokenUnitsBN(order.minFillAmount || ZERO_BN, ROOKIES.decimals), // default to zero for backwards compat

    // Amounts
    rookieAmount: podAmount,
    rookieAmountFilled: podAmountFilled,
    hooliganAmount: hooliganAmount,
    hooliganAmountFilled: hooliganAmountFilled,

    // Computed
    rookieAmountRemaining: podAmount.minus(podAmountFilled),
    hooliganAmountRemaining: hooliganAmount.minus(hooliganAmountFilled),

    // Metadata
    status: order.status as MarketStatus,
    createdAt: order.createdAt,
    creationHash: order.creationHash,
  };
};

/**
 * Unless otherwise specified, values here match the value returned by the subgraph
 * in BigNumber form with the appropriate number of decimals.
 * 
 * See Hooliganhorde-Subgraph/schema.graphql for details.
 */
export type RookieListing = {
  /// ///////////// Identifiers ////////////////

  id: string;
  account: string;

  /// ///////////// Configuration ////////////////

  index: BigNumber;
  start: BigNumber;
  mode: FarmToMode;

  /// ///////////// Constraints ////////////////

  maxDraftableIndex: BigNumber;
  minFillAmount: BigNumber;

  /// ///////////// Pricing ////////////////

  pricingType: PricingTypes;
  pricePerRookie: BigNumber; // Hooligans per Pod
  pricingFunction: PricingFunctions;

  /// ///////////// Amounts [Relative to Original] ////////////////

  originalIndex: BigNumber;
  originalAmount: BigNumber;
  filled: BigNumber;

  /// ///////////// Amounts [Relative to Child] ////////////////

  amount: BigNumber;
  remainingAmount: BigNumber;
  filledAmount: BigNumber;

  /// ///////////// Computed ////////////////

  placeInLine: BigNumber;
  expiry: BigNumber;

  /// ///////////// Metadata ////////////////

  status: MarketStatus;
  createdAt: string;
  creationHash: string;
};

/**
 * Unless otherwise specified, values here match the value returned by the subgraph
 * in BigNumber form with the appropriate number of decimals.
 * 
 * See Hooliganhorde-Subgraph/schema.graphql for details.
 */
export type RookieOrder = {
  /// ///////////// Identifiers ////////////////

  id: string;
  account: string;

  /// ///////////// Constraints ////////////////

  maxPlaceInLine: BigNumber;
  minFillAmount: BigNumber;

  /// ///////////// Pricing ////////////////

  pricingType: PricingTypes;
  pricePerRookie: BigNumber; // Hooligans per Pod
  pricingFunction: PricingFunctions;

  /// ///////////// Amounts ////////////////

  rookieAmount: BigNumber;
  rookieAmountFilled: BigNumber;
  hooliganAmount: BigNumber;
  hooliganAmountFilled: BigNumber;
  
  /// ///////////// Computed ////////////////

  rookieAmountRemaining: BigNumber;
  hooliganAmountRemaining: BigNumber;

  /// ///////////// Metadata ////////////////

  status: MarketStatus;
  createdAt: string;
  creationHash: string;
};

export type GuvnorMarket = {
  listings: {
    [plotIndex: string]: RookieListing;
  };
  orders: {
    [id: string]: RookieOrder;
  };
};
