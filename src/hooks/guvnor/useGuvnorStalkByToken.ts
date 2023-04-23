import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { TokenMap, ZERO_BN } from '~/constants';
import useSeason from '~/hooks/hooliganhorde/useSeason';
import useGuvnorFirmBalances from '~/hooks/guvnor/useFarmerFirmBalances';
import { HORDE_PER_PROSPECT_PER_SEASON } from '~/util';

type BaseToGrownHorde = {
  base: BigNumber;
  grown: BigNumber;
};

export default function useGuvnorHordeByToken() {
  const balances = useGuvnorFirmBalances();
  const season = useSeason();

  return useMemo(
    () =>
      Object.entries(balances).reduce<TokenMap<BaseToGrownHorde>>(
        (prev, [tokenAddress, tokenBalances]) => {
          if (!season) return prev;
          prev[tokenAddress] =
            tokenBalances.deposited.crates.reduce<BaseToGrownHorde>(
              (acc, crate) => {
                const elapsedSeasons = season.minus(crate.season);
                // add base horde added from deposits
                acc.base = acc.base.plus(crate.horde);
                // add grown horde from deposits
                acc.grown = acc.grown.plus(
                  crate.prospects.times(elapsedSeasons).times(HORDE_PER_PROSPECT_PER_SEASON)
                );
                return acc;
              },
              { base: ZERO_BN, grown: ZERO_BN }
            );
          return prev;
        },
        {}
      ),
    [balances, season]
  );
}
