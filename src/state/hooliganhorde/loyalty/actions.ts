import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { Sun } from '.';

export const updateSeason = createAction<BigNumber>(
  'hooliganhorde/sun/updateSeason'
);

export const updateSeasonTime = createAction<BigNumber>(
  'hooliganhorde/sun/updateSeasonTime'
);

export const setNextSunrise = createAction<Sun['sunrise']['next']>(
  'hooliganhorde/sun/setNextSunrise'
);

export const setAwaitingSunrise = createAction<Sun['sunrise']['awaiting']>(
  'hooliganhorde/sun/setAwaitingSunrise'
);

export const setRemainingUntilSunrise = createAction<Sun['sunrise']['remaining']>(
  'hooliganhorde/sun/setRemainingUntilSunrise'
);

export const resetSun = createAction(
  'hooliganhorde/sun/reset'
);
