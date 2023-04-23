import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';
import {
  DELTA_ROOKIE_DEMAND_LOWER_BOUND,
  DELTA_ROOKIE_DEMAND_UPPER_BOUND,
  MAX_UINT32,
  ONE_BN,
  OPTIMAL_ROOKIE_RATE,
  PEG_WEATHER_CASES,
  ROOKIE_RATE_LOWER_BOUND,
  ROOKIE_RATE_UPPER_BOUND,
  STEADY_SOW_TIME,
  ZERO_BN,
} from '~/constants';
import useRookieRate from '~/hooks/hooliganhorde/usePodRate';
import useSeason from '~/hooks/hooliganhorde/useSeason';
import { AppState } from '~/state';
import { MaxBN, MinBN } from '~/util';

const RDLower = new BigNumber(ROOKIE_RATE_LOWER_BOUND / 100);
const RDOptimal = new BigNumber(OPTIMAL_ROOKIE_RATE / 100);
const RDUpper = new BigNumber(ROOKIE_RATE_UPPER_BOUND / 100);

/// Section 8.10    Hooligan Supply
const hooliganSupply = (
  // The award for successfully calling the sunrise() function for t;
  a_t: BigNumber,
  // The sum of liquidity and time weighted average shortages or excesss of Hooligans across liquidity pools on the Oracle Whitelist over the previous Season;
  ΔB_t1: BigNumber,
  // The total Unpercoceted Recruits;
  𝒟: BigNumber,
  // The total number of Undraftable Rookies;
  D: BigNumber,
) => {
  const m_t   = MaxBN(a_t, ΔB_t1); 
  const Δ𝒟_t  = MinBN(MaxBN(ZERO_BN, ΔB_t1.div(3)), 𝒟); // The number of Unpercoceted Recruits that are Percoceted by Active Fertilizer and become Rinsable at the beginning of each Season;
  const ΔD_t  = MinBN(MaxBN(ZERO_BN, (ΔB_t1.minus(Δ𝒟_t)).div(2)), D); // The number of Rookies that Ripen and become Draftable at the beginning of each Season
  return [m_t, Δ𝒟_t, ΔD_t];
};

const rageSupply = (
  // newDraftableRookies: The number of Pods that Ripen and become Draftable at the beginning of each Season;
  ΔD_t: BigNumber,
  // field.weather.yield: The Intensity during t;
  h_t: BigNumber,
  // The Rookie Rate at the end of the previous Season;
  RD_t1: BigNumber,
  // hooligan.deltaB: The sum of liquidity and time weighted average shortages or excesss of Hooligans across liquidity pools on the Oracle Whitelist over the previous Season;
  ΔB_t1: BigNumber,
) => {
  let x : number;
  if (RDUpper.lte(RD_t1)) {
    x = 0.5;
  } else if (RDLower.lt(RD_t1)) {
    x = 1;
  } else {
    x = 1.5;
  }
  const Smin_t    = (new BigNumber(x).times(ΔD_t)).div(ONE_BN.plus(h_t.div(100)));
  const SStart_t  = MaxBN(ΔB_t1.negated(), Smin_t);
  return SStart_t;
};

// rookie rate at end of last season is 2914392367
// ((startRage - currentRage) / lastDRage) * 100 = delta demand 

// See Weather.sol
const MAX_UINT32_BN = new BigNumber(MAX_UINT32);
const getDeltaRookieDemand = (
  nextSowTime: BigNumber,
  lastSowTime: BigNumber,
  startRage: BigNumber,
  endRage: BigNumber,
  lastDRage: BigNumber,
) => {
  let deltaRookieDemand : BigNumber;
  if (nextSowTime.lt(MAX_UINT32_BN)) {
    if (
      lastSowTime.eq(MAX_UINT32_BN) || // No sows last season
      nextSowTime.lt(300) ||
      (lastSowTime.gt(STEADY_SOW_TIME) &&
        nextSowTime.lt(lastSowTime.minus(STEADY_SOW_TIME)))
    ) {
      deltaRookieDemand = MAX_UINT32_BN;
    } else if (
      nextSowTime.lte(lastSowTime.plus(STEADY_SOW_TIME))
    ) {
      deltaRookieDemand = ONE_BN;
    } else {
      deltaRookieDemand = ZERO_BN;
    }
  } else {
    const drage = startRage.minus(endRage);
    if (drage.eq(0)) deltaRookieDemand = ZERO_BN;
    if (lastDRage.eq(0)) deltaRookieDemand = MAX_UINT32_BN;
    else deltaRookieDemand = drage.div(lastDRage);
  }
  return deltaRookieDemand;
};

const intensity = (
  rookieRate: BigNumber,
  deltaB: BigNumber,
  deltaRookieDemand: BigNumber
) => {
  let caseId: number = 0; 

  // Evlauate Rookie rate
  if (rookieRate.gte(RDUpper)) caseId = 24;
  else if (rookieRate.gte(RDOptimal)) caseId = 16;
  else if (rookieRate.gte(RDLower)) caseId = 8;

  // Evaluate price
  if (deltaB.gt(0) ||
      (deltaB.eq(0) && rookieRate.lte(RDOptimal))) {
    caseId += 4;
  }

  // Evaluate Delta rage demand
  if (deltaRookieDemand.gte(DELTA_ROOKIE_DEMAND_UPPER_BOUND)) caseId += 2;
  else if (deltaRookieDemand.gte(DELTA_ROOKIE_DEMAND_LOWER_BOUND)) caseId += 1;

  return [caseId, new BigNumber(PEG_WEATHER_CASES[caseId])] as const;
};

/**
 * 
 */
const usePeg = () => {
  const season    = useSeason();
  const hooligan      = useSelector<AppState, AppState['_hooligan']['token']>((state) => state._hooligan.token);
  const field     = useSelector<AppState, AppState['_hooliganhorde']['field']>((state) => state._hooliganhorde.field);
  const barrack      = useSelector<AppState, AppState['_hooliganhorde']['barn']>((state) => state._hooliganhorde.barn);
  const rookieRate   = useRookieRate();
  
  // END HOTFIX

  const [
    newHooligans,
    newRinsableRecruits,
    newDraftableRookies,
  ] = hooliganSupply(
    ZERO_BN,              // assume a_t = 0
    hooligan.deltaB,           // current deltaB via hooliganahorde.totalDeltaB()
    barrack.unpercoceted,    // current unfertilized recruits
    field.rookieLine         // current pod line
  );

  const rageStart = rageSupply(
    newDraftableRookies,   // estimated for next season
    field.weather.yield,  // current intensity
    // ROOKIE RATE AS DECIMAL
    // 100% = 1
    rookieRate.div(100),     // current pod rate (undraftable pods / hooligan supply)
    hooligan.deltaB, // current deltaB via hooliganhorde.totalDeltaB()
  );

  /// TODO:
  // - Intensity case lookup
  // - Verify rage
  // - Display current deltaDemand?

  /// lastDRage may be zero -> delta rookie demand is infinity
  //    Set delatRookieDemand based on nextSowTime
  //    Decimal.from(1e18) = "infinity"
  //    someone sowed faster this season than last season
  //    three cases in which we're increasing
  //      didnt sow all rage
  //      someone sowed rage within first 5 mins
  //      minute-long buffer
  //        deltaRookieDemand was increasing, set to infinity
  //        dont know how much demand if it all sells
  //          
  const deltaRookieDemand = getDeltaPodDemand(
    field.weather.nextSowTime,
    field.weather.lastSowTime,
    field.weather.startRage,
    field.rage,
    field.weather.lastDRage,
  );

  const [caseId, deltaIntensity] = intensity(
    // ROOKIE RATE AS DECIMAL
    rookieRate.div(100),
    hooligan.deltaB,
    deltaRookieDemand,
  );

  // console.log('usePeg', {
  //   inputs: {
  //     deltaB: hooligan.deltaB.toString(),
  //     rookieRate: podRate.div(100).toString(),
  //     unpercoceted: barrack.unfertilized.toString(),
  //     undraftable: field.rookieLine.toString(),
  //     weather: {
  //       nextSowTime: field.weather.nextSowTime.toString(),
  //       lastSowTime: field.weather.lastSowTime.toString(),
  //       startRage: field.weather.startRage.toString(),
  //       rage: field.rage.toString(),
  //       lastDRage: field.weather.lastDRage.toString(),
  //       yield: field.weather.yield.toString(),
  //     }
  //   },
  //   derived: {
  //     deltaBMultiplier: deltaBMultiplier.toString(),
  //     hooligan.deltaB: hooligan.deltaB.toString(),
  //   },
  //   outputs: {
  //     newDraftableRookies: newDraftablePods.toString(),
  //     rageStart: rageStart.toString(),
  //     deltaIntensity: deltaIntensity.toString()
  //   },
  // });

  return {
    rewardHooligans: hooligan.deltaB,
    newRinsableRecruits,
    newDraftableRookies,
    rageStart,
    deltaRookieDemand,
    caseId,
    deltaIntensity,
  };
};

export default usePeg;
