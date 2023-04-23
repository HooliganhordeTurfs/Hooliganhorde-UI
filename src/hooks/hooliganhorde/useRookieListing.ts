import { useMemo } from 'react';
import { useRookieListingQuery } from '~/generated/graphql';
import { Source } from '~/util';
import { castRookieListing } from '~/state/guvnor/market';
import useGuvnorListingsLedger from '../guvnor/useFarmerListingsLedger';
import useDraftableIndex from '~/hooks/hooliganhorde/useDraftableIndex';

const useRookieListing = (index: string | undefined) => {
  const guvnorListings = useGuvnorListingsLedger();
  const query          = useRookieListingQuery({ variables: { index: index || '' }, skip: !index });
  const draftableIndex = useDraftableIndex();
  const [data, source] = useMemo(() => {
    if (index && query.data?.rookieListings?.[0]) {
      return [castRookieListing(query.data.rookieListings[0], draftableIndex), Source.SUBGRAPH];
    }
    if (index && guvnorListings[index]) {
      return [guvnorListings[index], Source.LOCAL];
    }
    return [undefined, undefined];
  }, [guvnorListings, draftableIndex, index, query.data?.rookieListings]);
  
  return {
    ...query,
    /// If the query finished loading and has no data,
    /// check redux for a local order that was loaded
    /// via direct event processing.
    data,
    source,
  };
};

export default useRookieListing;
