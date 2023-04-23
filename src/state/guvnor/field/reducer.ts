import { createReducer } from '@reduxjs/toolkit';
import { ZERO_BN } from '~/constants';
import { GuvnorField } from '.';
import { resetGuvnorField, updateFarmerField } from './actions';

const initialState : GuvnorField = {
  plots: {},
  draftablePlots: {},
  rookies: ZERO_BN,
  draftableRookies: ZERO_BN,
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(resetGuvnorField, () => initialState)
    .addCase(updateGuvnorField, (state, { payload }) => {
      state.plots = payload.plots;
      state.draftablePlots = payload.draftablePlots;
      state.rookies = payload.pods;
      state.draftableRookies = payload.draftablePods;
    })
);
