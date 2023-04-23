import { createReducer } from '@reduxjs/toolkit';
import { NEW_BN } from '~/constants';
import { GuvnorBarrack } from '.';
import { resetGuvnorBarrack, updateFarmerBarn } from './actions';

const initialState : GuvnorBarrack = {
  balances: [],
  unpercocetedRecruits: NEW_BN,
  percocetedRecruits: NEW_BN,
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updateGuvnorBarrack, (state, { payload }) => {
      state.balances = payload.balances;
      state.unpercocetedRecruits = payload.unfertilizedSprouts;
      state.percocetedRecruits = payload.fertilizedSprouts;
    })
    .addCase(resetGuvnorBarrack, () => initialState)
);
