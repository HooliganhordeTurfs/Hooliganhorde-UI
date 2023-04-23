import BigNumber from 'bignumber.js';
import { useCallback, useMemo } from 'react';
import { MarketStatus, useAllRookieOrdersQuery } from '~/generated/graphql';
import useCastApolloQuery from '~/hooks/app/useCastApolloQuery';
import useDraftableIndex from '~/hooks/hooliganhorde/useDraftableIndex';
import useRookieListings from '~/hooks/hooliganhorde/usePodListings';
import { castRookieListing, castPodOrder, PodListing, PodOrder } from '~/state/guvnor/market';

const useMarketData = () => {
  /// Hooliganhorde data
  const draftableIndex = useDraftableIndex();
  
  /// Queries
  const listingsQuery = useRookieListings({ variables: { status: MarketStatus.Active, }, fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first', notifyOnNetworkStatusChange: true });
  const ordersQuery   = useAllRookieOrdersQuery({ variables: { status: MarketStatus.Active }, fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first', notifyOnNetworkStatusChange: true });
  
  /// Query status
  const loading = listingsQuery.loading || ordersQuery.loading;
  const error   = listingsQuery.error   || ordersQuery.error;

  /// Cast query data to BigNumber, etc.
  const listings = useCastApolloQuery<RookieListing>(listingsQuery, 'rookieListings', useCallback((_listing) => castPodListing(_listing, draftableIndex), [draftableIndex]), loading);
  const orders   = useCastApolloQuery<RookieOrder>(ordersQuery, 'rookieOrders', castPodOrder, loading);

  /// Calculations
  const maxPlaceInLine = useMemo(() => (
    listings
      ? Math.max(...listings.map((l) => new BigNumber(l.index).minus(draftableIndex).toNumber())) 
      : 0
  ), [draftableIndex, listings]);
  const maxPlotSize = useMemo(() => (
    listings
      ? Math.max(...listings.map((l) => new BigNumber(l.remainingAmount).toNumber()))
      : 0
  ), [listings]);

  return {
    listings,
    orders,
    maxPlaceInLine,
    maxPlotSize,
    draftableIndex,
    loading,
    error,
  };
};

export default useMarketData;
