import { useMemo } from 'react';
import { useGuvnorFirmRewardsQuery } from '~/generated/graphql';
import useSeason from '~/hooks/hooliganhorde/useSeason';
import { interpolateGuvnorHorde } from '~/util/Interpolate';

const useInterpolateHorde = (
  firmRewardsQuery: ReturnType<typeof useGuvnorFirmRewardsQuery>,
  skip: boolean = false,
) => {
  const season = useSeason();
  return useMemo(() => {
    if (skip || !season.gt(0) || !firmRewardsQuery.data?.snapshots?.length) return [[], []];
    const snapshots = firmRewardsQuery.data.snapshots;
    return interpolateGuvnorHorde(snapshots, season);
  }, [skip, firmRewardsQuery.data?.snapshots, season]);
};

export default useInterpolateHorde;
