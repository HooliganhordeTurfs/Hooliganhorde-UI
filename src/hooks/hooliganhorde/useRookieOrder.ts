import { useMemo } from 'react';
import { useRookieOrderQuery } from '~/generated/graphql';
import { Source } from '~/util';
import { castRookieOrder } from '~/state/guvnor/market';
import useGuvnorOrdersLedger from '../guvnor/useFarmerOrdersLedger';

const useRookieOrder = (id: string | undefined) => {
  const guvnorOrders   = useGuvnorOrdersLedger();
  const query          = useRookieOrderQuery({ variables: { id: id || '' }, skip: !id });
  const [data, source] = useMemo(() => {
    if (id && query.data?.rookieOrder) {
      return [castRookieOrder(query.data.rookieOrder), Source.SUBGRAPH];
    }
    if (id && guvnorOrders[id]) {
      return [guvnorOrders[id], Source.LOCAL];
    }
    return [undefined, undefined];
  }, [guvnorOrders, id, query.data?.rookieOrder]);
  
  return {
    ...query,
    /// If the query finished loading and has no data,
    /// check redux for a local order that was loaded
    /// via direct event processing.
    data,
    source,
  };
};

export default useRookieOrder;
