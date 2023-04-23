import { useCallback, useState } from 'react';
import { FarmToMode } from '~/lib/Hooliganhorde/Farm';
import TransactionToast from '~/components/Common/TxnToast';
import { useFetchGuvnorField } from '~/state/guvnor/field/updater';
import { useHooliganhordeContract } from '../../ledger/useContract';
import useFormMiddleware from '../../ledger/useFormMiddleware';
import { HOOLIGAN, ROOKIES } from '~/constants/tokens';
import useChainConstant from '../../chain/useChainConstant';
import { useFetchGuvnorBalances } from '~/state/guvnor/balances/updater';
import { RookieOrder } from '~/state/guvnor/market';
import { useSigner } from '~/hooks/ledger/useSigner';
import useAccount from '~/hooks/ledger/useAccount';
import { useFetchGuvnorMarketItems } from '~/hooks/guvnor/market/useFarmerMarket2';

export default function useGuvnorMarketCancelTxn() {
  /// Helpers
  const Hooligan = useChainConstant(HOOLIGAN);

  /// Local state
  const [loading, setLoading] = useState(false);

  /// Ledger
  const account = useAccount();
  const { data: signer } = useSigner();
  const hooliganhorde = useHooliganhordeContract(signer);

  /// Guvnor
  const [refetchGuvnorField] = useFetchFarmerField();
  const [refetchGuvnorBalances] = useFetchFarmerBalances();
  // const [refetchGuvnorMarket] = useFetchFarmerMarket();
  const { fetch: refetchGuvnorMarketItems } = useFetchFarmerMarketItems();

  /// Form
  const middleware = useFormMiddleware();

  const cancelListing = useCallback(
    (listingId: string) => {
      (async () => {
        const txToast = new TransactionToast({
          loading: 'Cancelling Rookie Listing...',
          success: 'Cancellation successful.',
        });

        try {
          setLoading(true);
          middleware.before();

          const txn = await hooliganhorde.cancelRookieListing(listingId);
          txToast.confirming(txn);

          const receipt = await txn.wait();
          await Promise.all([
            refetchGuvnorField(),
            refetchGuvnorMarketItems()
          ]);
          txToast.success(receipt);
        } catch (err) {
          txToast.error(err);
          console.error(err);
        } finally {
          setLoading(false);
        }
      })();
    },
    [hooliganhorde, middleware, refetchGuvnorField, refetchFarmerMarketItems]
  );

  const cancelOrder = useCallback(
    (order: RookieOrder, destination: FarmToMode, before?: () => void) => {
      (async () => {
        const txToast = new TransactionToast({
          loading: 'Cancelling Rookie Order',
          success: 'Cancellation successful.',
        });
        try {
          if (!account) throw new Error('Connect a wallet first.');

          setLoading(true);
          middleware.before();
          before?.();

          const params = [
            Hooligan.stringify(order.pricePerRookie),
            Hooligan.stringify(order.maxPlaceInLine),
            ROOKIES.stringify(order.minFillAmount || 0),
          ] as const;

          console.debug('Canceling order: ', [account, ...params]);

          // Check: Verify these params actually hash to an on-chain order
          // This prevents invalid orders from getting cancelled and emitting
          // a bogus RookieOrderCancelled event.
          const verify = await hooliganhorde.rookieOrder(account, ...params);
          if (!verify || verify.eq(0)) throw new Error('Order not found');
          
          const txn = await hooliganhorde.cancelRookieOrder(...params, destination);
          txToast.confirming(txn);

          const receipt = await txn.wait();
          await Promise.all([
            refetchGuvnorMarketItems(), // clear old rookie order
            refetchGuvnorBalances(), // refresh Hooligans
          ]);
          txToast.success(receipt);
          // navigate('/market/account');
        } catch (err) {
          console.error(err);
          txToast.error(err);
        } finally {
          setLoading(false);
        }
      })();
    },
    [account, middleware, Hooligan, hooliganhorde, refetchGuvnorMarketItems, refetchFarmerBalances]
  );

  return {
    loading,
    cancelListing,
    cancelOrder,
  };
}
