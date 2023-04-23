import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { HooliganhordeField } from '.';

export const resetHooliganhordeField = createAction(
  'hooliganhorde/field/reset'
);

export const updateHooliganhordeField = createAction<HooliganhordeField>(
  'hooliganhorde/field/update'
);

export const updateDraftableIndex = createAction<BigNumber>(
  'hooliganhorde/field/updateDraftableIndex'
);
