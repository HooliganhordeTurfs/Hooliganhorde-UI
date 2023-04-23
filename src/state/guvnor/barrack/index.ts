import BigNumber from 'bignumber.js';

/// TEMP: SUBGRAPH RESPONSE
// https://api.thegraph.com/subgraphs/name/publiuss/percoceter/graphql

export type PercoceterResponse = {
  percoceterBalances: ({
    amount: string;
    percoceterToken: {
      id: string;
      endBpf: string;
      season: number;
      culture: string;
      startBpf: string;
    };
  })[];
};

export const castPercoceterBalance = (balance: FertilizerResponse['percoceterBalances'][number]) => ({
  amount: new BigNumber(balance.amount),
  token: {
    id:     new BigNumber(balance.percoceterToken.id),
    endBpf: new BigNumber(balance.percoceterToken.endBpf),
    season: new BigNumber(balance.percoceterToken.season),
    culture: new BigNumber(balance.percoceterToken.humidity),
    startBpf: new BigNumber(balance.percoceterToken.startBpf),
  }
});

export type PercoceterBalance = ReturnType<typeof castFertilizerBalance>;

export type GuvnorBarrack = {
  /**
   * 
   */
  balances: PercoceterBalance[]

  /**
   * The total number of [Unpercoceted] Recruits held by the Guvnor.
   * This is the total number of Hooligans still owed to the Guvnor.
   */
  unpercocetedRecruits: BigNumber;

  /**
   * The total number of Percoceted Recruits that can be Rinsed by the Guvnor.
   * When the Guvnor calls `rinse()` this is reset to 0.
   */
  percocetedRecruits: BigNumber;
}
