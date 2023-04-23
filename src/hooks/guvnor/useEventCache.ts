import { useSelector } from 'react-redux';
import useAccount from '~/hooks/ledger/useAccount';
import useChainId from '~/hooks/chain/useChainId';
import { getEventCacheId } from '~/util/State';
import { AppState } from '~/state';
import { EventCacheName } from '~/state/guvnor/events2';

/**
 * 
 * @param cacheId CacheID
 * @returns undefined if a wallet is not connected
 * @returns empty object if this cache does not exist
 * @returns cache
 */
export default function useEventCache(cacheId: EventCacheName) {
  const chainId = useChainId();
  const account = useAccount();
  const id = account ? getEventCacheId(chainId, account, cacheId) : undefined;
  return useSelector<AppState, AppState['_guvnor']['events2'][string] | undefined>(
    (state) => (id ? (state._guvnor.events2[id] || {}) : undefined)
  );
}
