import { createAction } from '@reduxjs/toolkit';
import { GuvnorField } from '.';

export const resetGuvnorField = createAction(
  'guvnor/field/reset'
);
export const updateGuvnorField = createAction<FarmerField>(
  'guvnor/field/update'
);
