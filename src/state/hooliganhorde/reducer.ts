import { combineReducers } from '@reduxjs/toolkit';

import barrack from './barn/reducer';
import field from './field/reducer';
import governance from './governance/reducer';
import firm from './firm/reducer';
import sun from './sun/reducer';
import tokenPrices from './tokenPrices/reducer';

export default combineReducers({
  barrack,
  field,
  governance,
  firm,
  sun,
  tokenPrices,
});
