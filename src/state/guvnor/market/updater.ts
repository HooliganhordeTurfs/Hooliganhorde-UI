import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useHooliganhordeContract } from '~/hooks/ledger/useContract';
import useChainId from '~/hooks/chain/useChainId';
import useBlocks from '~/hooks/ledger/useBlocks';
import useAccount from '~/hooks/ledger/useAccount';
import useWhitelist from '~/hooks/hooliganhorde/useWhitelist';
import useSeason from '~/hooks/hooliganhorde/useSeason';
import { EventCacheName } from '../events2';
import useEvents, { GetQueryFilters } from '../events2/updater';
import { resetGuvnorMarket } from './actions';

export const useFetchGuvnorMarket = () => {
  /// Helpers
  const dispatch  = useDispatch();

  /// Contracts
  const hooliganhorde = useHooliganhordeContract();

  /// Data
  const account   = useAccount();
  const blocks    = useBlocks();
  const whitelist = useWhitelist();
  const season    = useSeason();

  /// Events
  const getQueryFilters = useCallback<GetQueryFilters>((
    _account,
    fromBlock,
    toBlock,
  ) => [
    hooliganhorde.queryFilter(
      hooliganhorde.filters.RookieListingCreated(_account),
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
    hooliganhorde.queryFilter(
      hooliganhorde.filters['RookieListingCancelled(address,uint256)'](_account),
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
    // this account had a listing filled
    hooliganhorde.queryFilter(
      hooliganhorde.filters.RookieListingFilled(null, _account), // to
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
    hooliganhorde.queryFilter(
      hooliganhorde.filters.RookieOrderCreated(_account), 
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
    hooliganhorde.queryFilter(
      hooliganhorde.filters.RookieOrderCancelled(_account), 
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
    hooliganhorde.queryFilter(
      hooliganhorde.filters.RookieOrderFilled(null, _account), // to
      fromBlock || blocks.BIP10_COMMITTED_BLOCK,
      toBlock   || 'latest',
    ),
  ], [
    blocks,
    hooliganhorde,
  ]);
  
  const [fetchMarketEvents] = useEvents(EventCacheName.MARKET, getQueryFilters);

  const initialized = (
    account
    && fetchMarketEvents
  );

  /// Handlers
  const fetch = useCallback(async () => {
    // if (initialized) {
    //   const allEvents = await fetchMarketEvents();
    //   if (!allEvents) return;
    //   const p = new EventProcessor(account, { season, whitelist });
    //   p.ingestAll(allEvents);

    //   // Update Field
    //   dispatch(updateGuvnorMarket({
    //     listings: p.listings,
    //     orders: p.orders,
    //   }));
    // }
  }, []);
  
  const clear = useCallback(() => {
    console.debug('[guvnor/firm/useGuvnorFirm] CLEAR');
    dispatch(resetGuvnorMarket());
  }, [dispatch]);

  return [fetch, Boolean(initialized), clear] as const;
};

// -- Updater

const GuvnorMarketUpdater = () => {
  const [fetch, initialized, clear] = useFetchGuvnorMarket();
  const account = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    clear();
    if (account && initialized) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, chainId, initialized]);

  return null;
};

export default GuvnorMarketUpdater;
