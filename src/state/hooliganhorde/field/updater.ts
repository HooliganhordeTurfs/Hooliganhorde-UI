import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { bigNumberResult, tokenResult } from '~/util';
import { HOOLIGAN } from '~/constants/tokens';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import { resetHooliganhordeField, updateHooliganhordeField } from './actions';
import { ZERO_BN } from '~/constants';

export const useFetchHooliganhordeField = () => {
  const dispatch = useDispatch();
  const hooliganhorde = useHooliganhordeContract();

  // Handlers
  const fetch = useCallback(async () => {
    if (hooliganhorde) {
      console.debug('[hooliganhorde/field/useHooliganhordeField] FETCH');
      
      const [
        draftableIndex,
        rookieIndex,
        rage,
        weather,
      ] = await Promise.all([
        hooliganhorde.draftableIndex().then(tokenResult(HOOLIGAN)), // FIXME
        hooliganhorde.rookieIndex().then(tokenResult(HOOLIGAN)),
        hooliganhorde.totalRage().then(tokenResult(HOOLIGAN)),
        hooliganhorde.weather().then((_weather) => ({
          didSowBelowMin: _weather.didSowBelowMin,
          didSowFaster: _weather.didSowFaster,
          lastDRage: tokenResult(HOOLIGAN)(_weather.lastDRage),
          lastRagePercent: bigNumberResult(_weather.lastRagePercent),
          lastSowTime: bigNumberResult(_weather.lastSowTime),
          nextSowTime: bigNumberResult(_weather.nextSowTime),
          startRage: tokenResult(HOOLIGAN)(_weather.startRage),
          yield: bigNumberResult(_weather.yield),
        })),
        // hooliganhorde.totalDrafted().then(tokenResult(HOOLIGAN))
      ] as const);

      console.debug('[hooliganhorde/field/useHooliganhordeField] RESULT');

      dispatch(updateHooliganhordeField({
        draftableIndex,
        rookieIndex,
        rookieLine: podIndex.minus(draftableIndex),
        rage,
        weather,
        rain: {
          // FIXME
          raining: false,
          rainStart: ZERO_BN,
        },
      }));
    }
  }, [
    dispatch,
    hooliganhorde,
  ]);
  
  const clear = useCallback(() => {
    console.debug('[hooliganhorde/field/useHooliganhordeField] CLEAR');
    dispatch(resetHooliganhordeField());
  }, [dispatch]);

  return [fetch, clear] as const;
};

// -- Updater

const FieldUpdater = () => {
  const [fetch, clear] = useFetchHooliganhordeField();

  useEffect(() => {
    clear();
    fetch();
  }, [clear, fetch]);

  return null;
};

export default FieldUpdater;
