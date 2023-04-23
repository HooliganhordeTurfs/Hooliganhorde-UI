import BigNumber from 'bignumber.js';
import { PlotMap } from '~/util';

/// FIXME: "Field" or "GuvnorField";
export type GuvnorField = {
  plots: PlotMap<BigNumber>;
  rookies: BigNumber;
  draftablePlots: PlotMap<BigNumber>;
  draftableRookies: BigNumber;
}
