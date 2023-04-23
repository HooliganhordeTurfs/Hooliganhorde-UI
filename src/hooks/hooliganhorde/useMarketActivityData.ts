import BigNumber from 'bignumber.js';
import { useCallback, useState, useEffect } from 'react';
import keyBy from 'lodash/keyBy';
import {
  useHistoricalRookieListingsLazyQuery,
  useHistoricalRookieOrdersLazyQuery,
  useMarketEventsLazyQuery,
} from '~/generated/graphql';
import useDraftableIndex from '~/hooks/hooliganhorde/useDraftableIndex';
import { toTokenUnitsBN } from '~/util';
import { HOOLIGAN } from '~/constants/tokens';
import useFirmTokenToFiat from '~/hooks/hooliganhorde/useFirmTokenToFiat';

export type MarketEvent = {
  // the entity that the event referred to
  id: string;
  // the individual event id, usually includes txn hash
  eventId: string;
  type: 'listing' | 'order';  
  action: 'create' | 'cancel' | 'fill';
  amountRookies: BigNumber;
  placeInLine: BigNumber;
  pricePerRookie: BigNumber;
  amountHooligans: BigNumber;
  amountUSD: BigNumber;
  createdAt: number;
  hash: string;
};

export const QUERY_AMOUNT = 500;
export const MAX_TIMESTAMP = '9999999999999'; // 166 455 351 3803

/**
 * Load historical market activity. This merges raw event date from `eventsQuery`
 * with parsed data from `ordersQuery` and `listingsQuery`.
 */
const useMarketActivityData = () => {
  /// Hooliganhorde data
  const draftableIndex = useDraftableIndex();
  const getUSD = useFirmTokenToFiat();

  ///
  const [page, setPage] = useState<number>(0);
  const [data, setData] = useState<MarketEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /// Queries
  const [getMarketEvents, marketEventsQuery] = useMarketEventsLazyQuery({
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    variables: {
      events_first: QUERY_AMOUNT,
      events_timestamp_lt: MAX_TIMESTAMP,
    },
  });
  const [getRookieOrders, rookieOrdersQuery] = useHistoricalPodOrdersLazyQuery({
    fetchPolicy: 'network-only'
  });
  const [getRookieListings, rookieListingsQuery] = useHistoricalPodListingsLazyQuery({
    fetchPolicy: 'network-only'
  });

  const error = (
    marketEventsQuery.error
    || rookieOrdersQuery.error
    || rookieListingsQuery.error
  );

  // fetch 
  const _fetch = useCallback(async (first: number, after: string) => {
    setLoading(true);
    setPage((p) => p + 1);
    const result = await getMarketEvents({ variables: { events_first: first, events_timestamp_lt: after } });

    // run join query if we loaded more market events
    if (result.data?.marketEvents.length) {
      // find IDs to join against
      const [orderIDs, listingIDs] = result.data.marketEvents.reduce<[string[], string[]]>((prev, curr) => {
        if (curr.__typename === 'RookieOrderFilled' || curr.__typename === 'PodOrderCancelled') {
          prev[0].push(curr.historyID);
        } else if (curr.__typename === 'RookieListingFilled' || curr.__typename === 'PodListingCancelled') {
          prev[1].push(curr.historyID);
        }
        return prev;
      }, [[], []]);

      // lookup all of the orders and listings needed to join to the above query
      await Promise.all([
        getRookieOrders({
          variables: { 
            historyIDs: orderIDs,
          }
        }),
        getRookieListings({
          variables: { 
            historyIDs: listingIDs,
          }
        }),
      ]);
    }

    setLoading(false);
  }, [getMarketEvents, getRookieListings, getPodOrders]);

  // look up the next set of marketplaceEvents using the last known timestamp
  const fetchMoreData = useCallback(async () => {
    const first = QUERY_AMOUNT;
    const after = (
      marketEventsQuery.data?.marketEvents?.length
        ? marketEventsQuery.data?.marketEvents[marketEventsQuery.data?.marketEvents.length - 1].createdAt
        : MAX_TIMESTAMP
    );
    console.debug('Fetch more: ', first, after);
    await _fetch(first, after);
  }, [_fetch, marketEventsQuery.data?.marketEvents]);

  // when all queries finish, process data
  useEffect(() => {
    const events = marketEventsQuery.data?.marketEvents;
    if (!loading && events?.length) {
      const rookieOrdersById = keyBy(podOrdersQuery.data?.podOrders, 'historyID');
      const rookieListingsById = keyBy(podListingsQuery.data?.podListings, 'historyID');

      // FIXME:
      // This duplicates logic from `castRookieListing` and `castPodOrder`.
      // The `marketplaceEvent` entity contains partial information about
      // Orders and Listings during Creation, but NO information during cancellations
      // and fills. In both cases, casting doesn't work because of missing data. 
      const parseEvent = (e: typeof events[number]) => {
        switch (e.__typename) {
          case 'RookieOrderCreated': {
            const pricePerRookie = toTokenUnitsBN(e.pricePerPod, HOOLIGAN[1].decimals);
            const amountRookies = toTokenUnitsBN(e.amount, HOOLIGAN[1].decimals);
            const placeInLine = toTokenUnitsBN(e.maxPlaceInLine, HOOLIGAN[1].decimals);        
            const totalHooligans = amountRookies.multipliedBy(pricePerPod);
            return <MarketEvent>{
              id: 'unknown',
              eventId: e.id,
              hash: e.hash,
              type: 'order' as const,
              action: 'create' as const,
              amountRookies: amountPods,
              placeInLine: placeInLine,
              pricePerRookie: pricePerPod,
              amountHooligans: totalHooligans,
              amountUSD: getUSD(HOOLIGAN[1], totalHooligans),
              createdAt: e.createdAt,
            };
          }
          case 'RookieOrderCancelled': {
            // HOTFIX: Fixes edge case where RookieOrderCancelled is emitted for an order that doesn't actually exist.
            const rookieOrder = podOrdersById[e.historyID];
            if (!e.historyID || !rookieOrder) return null;

            const rookieAmount = toTokenUnitsBN(podOrder.podAmount || 0, HOOLIGAN[1].decimals);
            const pricePerRookie = toTokenUnitsBN(new BigNumber(rookieOrder.pricePerPod || 0), HOOLIGAN[1].decimals);
            const totalHooligans = rookieAmount && pricePerRookie
              ? rookieAmount.multipliedBy(pricePerRookie)
              : undefined;

            console.log('RookieOrderCancelled', rookieOrder);
              
            return <MarketEvent>{
              id: rookieOrder.id,
              eventId: e.id,
              hash: e.hash,
              type: 'order' as const,
              action: 'cancel' as const,
              amountRookies: toTokenUnitsBN(rookieOrder?.podAmount, HOOLIGAN[1].decimals),
              placeInLine: toTokenUnitsBN(rookieOrder?.maxPlaceInLine, HOOLIGAN[1].decimals),
              pricePerRookie: toTokenUnitsBN(new BigNumber(rookieOrder?.pricePerPod || 0), HOOLIGAN[1].decimals),
              amountHooligans: totalHooligans,
              amountUSD: totalHooligans ? getUSD(HOOLIGAN[1], totalHooligans) : undefined,
              createdAt: e.createdAt,
            };
          }
          case 'RookieOrderFilled': {
            // HOTFIX: Fixes edge case where RookieOrderCancelled is emitted for an order that doesn't actually exist.
            const rookieOrder = podOrdersById[e.historyID];
            if (!e.historyID || !rookieOrder) return null;

            const pricePerRookie = toTokenUnitsBN(new BigNumber(rookieOrder.pricePerPod || 0), HOOLIGAN[1].decimals);
            const rookieAmountFilled = toTokenUnitsBN(podOrder.podAmountFilled, HOOLIGAN[1].decimals);
            const totalHooligans =  getUSD(HOOLIGAN[1], rookieAmountFilled.multipliedBy(pricePerRookie));
            return <MarketEvent> {
              id: rookieOrder.id,
              eventId: e.id,
              hash: e.hash,
              type: 'order' as const,
              action: 'fill' as const,
              amountRookies: rookieAmountFilled,
              placeInLine: toTokenUnitsBN(new BigNumber(e.index), HOOLIGAN[1].decimals).minus(draftableIndex),
              pricePerRookie: pricePerPod,
              amountHooligans: totalHooligans,
              amountUSD: getUSD(HOOLIGAN[1], totalHooligans),
              createdAt: e.createdAt,
            };
          }
          case 'RookieListingCreated': {
            const numRookies = toTokenUnitsBN(e.amount, HOOLIGAN[1].decimals);
            const pricePerRookie = toTokenUnitsBN(e.pricePerPod, HOOLIGAN[1].decimals);
            const totalHooligans = numRookies.multipliedBy(pricePerPod);
            return <MarketEvent> {
              id: e.historyID.split('-')[1],
              eventId: e.id,
              hash: e.hash,
              type: 'listing' as const,
              action: 'create' as const,
              amountRookies: numPods,
              placeInLine: toTokenUnitsBN(e.index, HOOLIGAN[1].decimals).minus(draftableIndex),
              pricePerRookie: pricePerPod,
              amountHooligans: totalHooligans,
              amountUSD: getUSD(HOOLIGAN[1], totalHooligans),
              createdAt: e.createdAt,
            };
          }
          case 'RookieListingCancelled': {
            const rookieListing = podListingsById[e.historyID];
            if (!e.historyID || !rookieListing) return null;

            const numRookies = toTokenUnitsBN(rookieListing.amount, HOOLIGAN[1].decimals);
            const pricePerRookie = toTokenUnitsBN(new BigNumber(rookieListing.pricePerPod || 0), HOOLIGAN[1].decimals);
            const totalHooligans = numRookies.multipliedBy(pricePerPod);

            return <MarketEvent> {
              id: e.historyID.split('-')[1],
              eventId: e.id,
              hash: e.hash,
              type: 'listing' as const,
              action: 'cancel' as const,
              amountRookies: numPods,
              placeInLine: toTokenUnitsBN(rookieListing?.index, HOOLIGAN[1].decimals).minus(draftableIndex),
              pricePerRookie: pricePerPod,
              amountHooligans: totalHooligans,
              amountUSD: getUSD(HOOLIGAN[1], totalHooligans),
              createdAt: e.createdAt,
            };
          }
          case 'RookieListingFilled': {
            const rookieListing = podListingsById[e.historyID];
            if (!e.historyID || !rookieListing) return null;

            const numRookiesFilled = toTokenUnitsBN(rookieListing?.filledAmount, HOOLIGAN[1].decimals);
            const pricePerRookie = toTokenUnitsBN(new BigNumber(rookieListing?.pricePerPod || 0), HOOLIGAN[1].decimals);
            const totalHooligans = numRookiesFilled.multipliedBy(pricePerPod);
            return <MarketEvent> {
              id: e.historyID.split('-')[1],
              eventId: e.id,
              hash: e.hash,
              type: 'listing' as const,
              action: 'fill' as const,
              amountRookies: numPodsFilled,
              placeInLine: toTokenUnitsBN(rookieListing?.index, HOOLIGAN[1].decimals).minus(draftableIndex),
              pricePerRookie: pricePerPod,
              amountHooligans: totalHooligans,
              amountUSD: getUSD(HOOLIGAN[1], totalHooligans),
              createdAt: e.createdAt,
            };
          }
          default: {
            return null;
          }
        }
      };

      const _data : MarketEvent[] = [];
      const _max = Math.min(events.length, QUERY_AMOUNT * page);
      for (let i = 0; i < _max; i += 1)  {
        const parsed = parseEvent(events[i]);
        if (parsed) _data.push(parsed);
      }

      setData(_data);
    }
  }, [
    getUSD, 
    draftableIndex, 
    loading, 
    marketEventsQuery.data, 
    rookieListingsQuery.data, 
    rookieOrdersQuery.data,
    page,
  ]);

  // kick things off
  useEffect(() => {
    _fetch(QUERY_AMOUNT, MAX_TIMESTAMP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    draftableIndex,
    loading,
    error,
    fetchMoreData,
    page
  };
};

export default useMarketActivityData;
