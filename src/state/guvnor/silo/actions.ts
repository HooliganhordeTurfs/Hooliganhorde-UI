import { createAction } from '@reduxjs/toolkit';
import { AddressMap } from '~/constants';
import { GuvnorFirmRewards, FarmerFirmBalance } from '.';

export type UpdateGuvnorFirmBalancesPayload = AddressMap<Partial<FarmerFirmBalance>>

export const resetGuvnorFirm = createAction(
  'guvnor/firm/reset'
);

export const updateGuvnorFirmRewards = createAction<FarmerFirmRewards>(
  'guvnor/firm/update'
);

export const updateGuvnorFirmBalances = createAction<UpdateFarmerFirmBalancesPayload>(
  'guvnor/firm/updateGuvnorFirmBalances'
);
