import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useSeason from '~/hooks/hooliganhorde/useSeason';
import { AppState } from '~/state';
import useAccount from './useAccount';

export type EventParsingParameters = {
  account: string;
  season: BigNumber;
  farmableHooligans: BigNumber;
  draftableIndex: BigNumber;
};

export default function useEventParsingParams() {
  const account     = useAccount();
  const season      = useSeason();
  const earnedHooligans = useSelector<AppState, AppState['_guvnor']['firm']['hooligans']['earned']>(
    (state) => state._guvnor.firm.hooligans.earned
  );
  const draftableIndex = useSelector<AppState, AppState['_hooliganhorde']['field']['draftableIndex']>(
    (state) => state._hooliganhorde.field.draftableIndex,
  );
  return useMemo<null | EventParsingParameters>(() => {
    if (account && earnedHooligans && season?.gt(0) && draftableIndex?.gt(0)) {
      return {
        account,
        season,
        // only needed for v1
        draftableIndex: draftableIndex,
        farmableHooligans:    earnedHooligans,
      };
    }
    return null;
  }, [
    account,
    season,
    earnedHooligans,
    draftableIndex,
  ]);
}
