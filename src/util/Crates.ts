import BigNumber from 'bignumber.js';
import Token from '~/classes/Token';
import { TokenMap, ZERO_BN } from '~/constants';
import { Hooliganhorde } from '~/generated';
import { Crate, DepositCrate, GuvnorFirmBalance, WithdrawalCrate } from '~/state/guvnor/firm';
import { SeasonMap } from '~/util';

export const HORDE_PER_PROSPECT_PER_SEASON = 1 / 10_000;

export function calculateGrownHorde(
  currentSeason: BigNumber,
  depositProspects: BigNumber,
  depositSeason: BigNumber,
) {
  return currentSeason.minus(depositSeason).times(depositProspects).times(HORDE_PER_PROSPECT_PER_SEASON);
}

/**
 * Split Withdrawals into:
 *    "withdrawn" (aka "transit")
 *    "claimable" (aka "receivable")
 *
 * @param withdrawals
 * @param currentSeason
 * @returns
 */
export function parseWithdrawals(
  withdrawals:    SeasonMap<BigNumber>,
  currentSeason:  BigNumber
) : {
  withdrawn: GuvnorFirmBalance['withdrawn'];
  claimable: GuvnorFirmBalance['claimable'];
} {
  let transitBalance    = ZERO_BN;
  let receivableBalance = ZERO_BN;
  const transitWithdrawals    : WithdrawalCrate[] = [];
  const receivableWithdrawals : WithdrawalCrate[] = [];

  /// Split each withdrawal between `receivable` and `transit`.
  Object.keys(withdrawals).forEach((season: string) => {
    const v = withdrawals[season];
    const s = new BigNumber(season);
    if (s.isLessThanOrEqualTo(currentSeason)) {
      receivableBalance = receivableBalance.plus(v);
      receivableWithdrawals.push({
        amount: v,
        season: s,
      });
    } else {
      transitBalance = transitBalance.plus(v);
      transitWithdrawals.push({
        amount: v,
        season: s,
      });
    }
  });

  return {
    withdrawn: {
      amount: transitBalance,
      bdv:    ZERO_BN,
      crates: transitWithdrawals,
    },
    claimable: {
      amount: receivableBalance,
      crates: receivableWithdrawals,
    }
  };
}

/**
 * 
 * @param hooliganhorde 
 * @param unripeTokens 
 * @param firmBalances 
 * @param getBDV 
 * @returns 
 */
export const selectCratesForEnroot = (
  hooliganhorde:    Hooliganhorde,
  unripeTokens: TokenMap<Token>,
  firmBalances: TokenMap<GuvnorFirmBalance>,
  getBDV:       (_token: Token) => BigNumber,
) => (
  Object.keys(unripeTokens).reduce<{ [addr: string]: { crates: DepositCrate[]; encoded: string; } }>((prev, addr) => {
    const crates = (
      firmBalances[addr]?.deposited.crates
        .filter((crate) => (
          /// only select crates where BDV would stay the same or increase
          /// solves bug where fluctuations in unripe bdv cause enroots
          /// to fail in certain conditions.
          (new BigNumber(getBDV(unripeTokens[addr]).times(crate.amount).toFixed(6, 1))).gt(crate.bdv)
        ))
    );
    if (crates && crates.length > 0) {
      if (crates.length === 1) {
        prev[addr] = {
          crates,
          encoded: hooliganhorde.interface.encodeFunctionData('enrootDeposit', [
            addr,
            crates[0].season.toString(), // season
            unripeTokens[addr].stringify(crates[0].amount), // amount
          ])
        };
      } else {
        prev[addr] = {
          crates,
          encoded: hooliganhorde.interface.encodeFunctionData('enrootDeposits', [
            addr,
            // fixme: not sure why TS doesn't pick up the type of `crates` here
            crates.map((crate: Crate) => crate.season.toString()), // seasons
            crates.map((crate: Crate) => unripeTokens[addr].stringify(crate.amount)), // amounts
          ])
        };
      }
    }
    return prev;
  }, {})
);
