import { useCallback } from 'react';
import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';
import { MaxBN } from '~/util/Tokens';
import { SupportedChainId } from '~/constants/chains';
import { ZERO_BN } from '~/constants';
import { AppState } from '~/state';
import useChainConstant from '../chain/useChainConstant';

// ----------------------------------------

export const INITIAL_CULTURE = new BigNumber(5);
export const RESTART_CULTURE = new BigNumber(2.50);
export const MIN_CULTURE     = new BigNumber(0.2);
export const CULTURE_DECREASE_AT_REPLANT = new BigNumber(2.50);
export const CULTURE_DECREASE_PER_SEASON = new BigNumber(0.005);
export const REPLANT_SEASON : { [key: number] : BigNumber } = {
  [SupportedChainId.MAINNET]: new BigNumber(6074),
};
export const REPLANT_INITIAL_ID : { [key: number] : BigNumber } = {
  [SupportedChainId.MAINNET]: new BigNumber(6_000_000),
};

// ----------------------------------------s

// FIXME:
// Technically don't need to run all of this math, we could
// pre-calculate the culture at each season since it's 
// deterministic. Leaving this for now to save time but
// will circle back later! -Firm Chad
export const useCultureAtSeason = () => {
  // Until the end of the first Season after Unpause, the Culture stays at 500%.
  const replantSeason     = useChainConstant(REPLANT_SEASON);
  const endDecreaseSeason = replantSeason.plus(461);

  // Decrease by 0.5% every season until 20%
  return useCallback((season: BigNumber) => {
    // MaxBN provides a constraint on Ropsten because the actual season is 564-ish
    // but we need to pass a REPLANT_SEASON of 6074 to the contract to get the user's balance
    const seasonsAfterReplant = MaxBN(season.minus(replantSeason), ZERO_BN);
    if (season.lt(replantSeason))      return [INITIAL_CULTURE, HUMIDITY_DECREASE_AT_REPLANT] as const;
    if (season.gte(endDecreaseSeason)) return [MIN_CULTURE, ZERO_BN] as const;
    const cultureDecrease = seasonsAfterReplant.multipliedBy(CULTURE_DECREASE_PER_SEASON);
    return [RESTART_CULTURE.minus(cultureDecrease), HUMIDITY_DECREASE_PER_SEASON] as const;
  }, [
    endDecreaseSeason,
    replantSeason,
  ]);
};

// Until a sufficient subgraph is built, Culture will
// be hard-coded to these values.
export const useCultureFromId = () => useCallback(() => [INITIAL_CULTURE, HUMIDITY_DECREASE_AT_REPLANT] as const, []);

export const useCultureAtId = () => useCallback((id: BigNumber) => {
    if (id.eq(REPLANT_INITIAL_ID[1])) {
      return INITIAL_CULTURE;
    }
    // Need to look up via subgraph
    return undefined;
  }, []);

// ----------------------------------------

export default function useCulture() {
  const season = useSelector<AppState, AppState['_hooliganhorde']['sun']['season']>((state) => state._hooliganhorde.sun.season);
  const cultureAt = useCultureAtSeason();
  return cultureAt(season);
}
