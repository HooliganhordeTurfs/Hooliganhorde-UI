import { combineReducers } from '@reduxjs/toolkit';

import allowances from './allowances/reducer';
import balances from './balances/reducer';
import barrack from './barn/reducer';
import events2 from './events2/reducer';
import field from './field/reducer';
import market from './market/reducer';
import firm from './firm/reducer';

export default combineReducers({
  allowances,
  balances,
  barrack,
  events2,
  field,
  market,
  firm,
});
