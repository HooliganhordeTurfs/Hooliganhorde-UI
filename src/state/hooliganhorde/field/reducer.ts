import { createReducer } from '@reduxjs/toolkit';
import { NEW_BN, ZERO_BN } from '~/constants';
import { HooliganhordeField } from '.';
import { resetHooliganhordeField, updateHooliganhordeField, updateDraftableIndex } from './actions';

const initialState : HooliganhordeField = {
  draftableIndex: NEW_BN,
  rookieIndex: NEW_BN,
  rookieLine: ZERO_BN,
  rage: NEW_BN,
  weather: {
    didSowBelowMin: false,
    didSowFaster: false,
    lastDRage: NEW_BN,
    lastRagePercent: NEW_BN,
    lastSowTime: NEW_BN,
    nextSowTime: NEW_BN,
    startRage: NEW_BN,
    yield: NEW_BN,
  },
  // FIXME: move under Weather?
  rain: {
    raining: false,
    rainStart: NEW_BN,
  },
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(resetHooliganhordeField, () => initialState)
    .addCase(updateHooliganhordeField, (state, { payload }) => {
      Object.keys(payload).forEach((key) => {
        const _k = key as keyof HooliganhordeField;
        const _p = payload[_k];
        // @ts-ignore
        state[_k] = _p;
      });
    })
    .addCase(updateDraftableIndex, (state, { payload }) => {
      state.draftableIndex = payload;
    })
);
