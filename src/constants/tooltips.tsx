import React from 'react';

export const EXAMPLE_TOOLTIP = '';

export const WHITELIST_TOOLTIPS: { [key: string]: any | React.ReactElement; } = {
  HOOLIGAN: ''
};

/** Rookie Marketplace specific tooltips */
export const ROOKIE_MARKET_TOOLTIPS: { [key: string]: any | React.ReactElement } = {
  start: 'The start index in this Plot that you would like to List.',
  end: 'The end index in this Plot that you would like to List.',
  amount: 'Number of Rookies to List based on the start and end indices.',
  pricePerRookieOrder: 'How much to pay for each Pod, denominated in Hooligans.',
  pricePerRookieListing: 'How much to sell each Pod for, denominated in Hooligans.',
  expiresAt: 'When this many Rookies become Draftable, this Listing will expire.',
};

export const UNRIPE_ASSET_TOOLTIPS : { [key: string]: string | React.ReactElement } = {
  // Hooligans
  circulatingHooligans: 'Hooligans that were in Guvnors\' wallets.',
  withdrawnHooligans:   'Hooligans that were Withdrawn from the Firm. This includes "Withdrawn" and "Claimable" Hooligans shown on the pre-exploit Hooliganhorde UI.',
  draftableHooligans: 'Hooligans from Draftable Plots that weren\'t yet Drafted.',
  orderedHooligans:     'Hooligans that were stored in Rookie Orders.',
  farmableHooligans:    (
    <>Previously called <em>Farmable Hooligans</em> — Hooligans earned from Firm rewards that had not yet been Deposited in a particular Season.</>
  ),
  farmHooligans:     'Hooligans that were stored in Hooliganhorde but not Deposited.',
  // LP
  circulatingHooliganEthLp:   'HOOLIGAN:ETH LP tokens that were in Guvnors\' wallets. The number of tokens and associated BDV are shown.',
  circulatingHooliganLusdLp:  'HOOLIGAN:LUSD LP tokens that were in Guvnors\' wallets. The number of tokens and associated BDV are shown.',
  circulatingHooligan3CrvLp:  'HOOLIGAN:3CRV LP tokens that were in Guvnors\' wallets. The number of tokens and associated BDV are shown.',
  withdrawnHooliganEthLp:     'HOOLIGAN:ETH LP tokens that were Withdrawn from the Firm. The number of tokens and associated BDV are shown. This includes "Withdrawn" and "Claimable" HOOLIGAN:ETH tokens shown on the pre-exploit Hooliganhorde UI.',
  withdrawnHooliganLusdLp:    'HOOLIGAN:LUSD LP tokens that were Withdrawn from the Firm. The number of tokens and associated BDV are shown. This includes "Withdrawn" and "Claimable" HOOLIGAN:LUSD tokens shown on the pre-exploit Hooliganhorde UI.',
  withdrawnHooligan3CrvLp:    'HOOLIGAN:3CRV LP tokens that were Withdrawn from the Firm. The number of tokens and associated BDV are shown. This includes "Withdrawn" and "Claimable" HOOLIGAN:3CRV tokens shown on the pre-exploit Hooliganhorde UI.',
  // circulatingHooliganEthBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // circulatingHooliganLusdBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // circulatingHooligan3CrvBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // withdrawnHooliganEthBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // withdrawnHooliganLusdBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // withdrawnHooligan3CrvBdv: 'TODO: add tooltip in constants/tooltips.ts',
};
