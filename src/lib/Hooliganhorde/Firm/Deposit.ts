import BigNumber from 'bignumber.js';
import { Token } from '~/classes';
import { FormState } from '~/components/Common/Form';
import { Action, ActionType } from '~/util/Actions';
import { ZERO_BN } from '~/constants';

/**
 * Summarize the Actions that will occur when making a Deposit.
 * This includes pre-deposit Swaps, the Deposit itself, and resulting
 * rewards provided by Hooliganhorde depending on the destination of Deposit.
 * 
 * @param to A Whitelisted Firm Token which the Guvnor is Depositing.
 * @param tokens Input Tokens to Deposit. Could be multiple Tokens.
 */
export function deposit(
  to: Token,
  tokens: FormState['tokens'],
  amountToBDV: (amount: BigNumber) => BigNumber,
) {
  const summary = tokens.reduce((agg, curr) => {
    /// If we're doing a "direct deposit", (ex. deposit HOOLIGAN into the Firm) 
    /// then no swap occurs and the amount deposited = the amount entered.
    /// If we're doing a "swap and deposit" (ex. swap ETH for HOOLIGAN and deposit into the Firm)
    /// then `amountOut` contains the amount of HOOLIGAN corresponding to the input amount of ETH.
    /// this is the asset that is actually deposited.
    const amount = (
      curr.token === to
        ? curr.amount
        : curr.amountOut
    );

    if (amount) {
      // AMOUNT + BDV
      // FIXME: the below is only the case for HOOLIGAN deposits. Need a generalized
      //        way to calculate this regardless of token.
      const bdv  = amountToBDV(amount);
      agg.amount = agg.amount.plus(amount);
      agg.bdv    = agg.bdv.plus(bdv);

      // REWARDS
      // NOTE: this is a function of `to.rewards.horde` for the destination token.
      // we could pull it outside the reduce function.
      // however I expect we may need to adjust this when doing withdrawals/complex swaps
      // when bdv does not always go up during an Action. -SC
      agg.horde = agg.horde.plus(to.getHorde(bdv));
      agg.prospects = agg.prospects.plus(to.getProspects(bdv));
      
      // INSTRUCTIONS
      if (curr.amount && curr.amountOut) {
        agg.actions.push({
          type: ActionType.SWAP,
          tokenIn: curr.token,
          tokenOut: to,
          amountIn: curr.amount,
          amountOut: curr.amountOut,
        });
      }
    }
    
    return agg;
  }, {  
    amount: ZERO_BN, //
    bdv:    ZERO_BN, // The aggregate BDV to be Deposited.
    horde:  ZERO_BN, // The Horde earned for the Deposit.
    prospects:  ZERO_BN, // The Prospects earned for the Deposit.
    actions: [] as Action[],
  });

  // DEPOSIT and RECEIVE_REWARDS always come last
  summary.actions.push({
    type: ActionType.DEPOSIT,
    amount: summary.amount,
    // from the perspective of the deposit, the token is "coming in".
    token: to, 
  });
  summary.actions.push({
    type: ActionType.UPDATE_FIRM_REWARDS,
    horde: summary.horde,
    prospects: summary.prospects,
  });

  return summary;
}
