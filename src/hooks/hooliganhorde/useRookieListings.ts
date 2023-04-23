import { HOOLIGAN } from '~/constants/tokens';
import { useAllRookieListingsQuery } from '~/generated/graphql';
import useDraftableIndex from '~/hooks/hooliganhorde/useDraftableIndex';
import useChainConstant from '~/hooks/chain/useChainConstant';

type BaseOptions = Parameters<typeof useAllRookieListingsQuery>[0]

export default function useRookieListings(
  baseOptions: (
    Omit<BaseOptions, 'variables'>
    & { variables: Partial<BaseOptions['variables']> }
  )
) {
  const draftableIndex = useDraftableIndex();
  const Hooligan = useChainConstant(HOOLIGAN);
  return useAllRookieListingsQuery({
    ...baseOptions,
    variables: {
      maxDraftableIndex: Hooligan.stringify(draftableIndex),
      ...baseOptions?.variables,
    },
    /// Skip when draftableIndex isn't loaded
    skip: baseOptions?.skip ? baseOptions.skip : !(draftableIndex?.gt(0))
  });
}
