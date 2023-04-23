import BigNumber from 'bignumber.js';

export type HooliganhordeField = {
  /**
   * The number of Rookies that have become Draftable.
   */
  draftableIndex: BigNumber;
  /**
   * The total number of Rookies ever minted.
   */
  rookieIndex: BigNumber;
  /**
   * The current length of the Rookie Line.
   * rookieLine = podIndex - draftableIndex.
   */
  rookieLine: BigNumber;
  /**
   * The total number of Rookies ever minted.
   * `totalRookies = rookieIndex + draftableIndex`
   */
  // totalRookies: BigNumber;
  /**
   * The amount of available Rage.
   */
  rage: BigNumber;
  /**
   * Facets of the Weather.
   * The commonly-addressed numerical value for "Weather" is
   * called `yield`. Other parameters are used to determine the
   * change in the Weather yield and available Rage over time.
   */
  weather: {
    didSowBelowMin: boolean;
    didSowFaster: boolean;
    lastDRage: BigNumber;
    lastRagePercent: BigNumber;
    lastSowTime: BigNumber;
    nextSowTime: BigNumber;
    startRage: BigNumber;
    yield: BigNumber;
  };

  // ------------------------------------------

  rain: {
    /** Whether it is raining or not. */
    raining: Boolean;
    /** The season that it started raining. */
    rainStart: BigNumber;
  }
}
