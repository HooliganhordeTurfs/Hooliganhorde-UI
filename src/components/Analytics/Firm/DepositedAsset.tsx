import React, { useCallback, useMemo } from 'react';
import { Token } from '~/classes';
import { tickFormatTruncated } from '~/components/Analytics/formatters';
import { LineChartProps } from '~/components/Common/Charts/LineChart';
import SeasonPlot, { SeasonPlotBaseProps } from '~/components/Common/Charts/SeasonPlot';
import { SeasonalDepositedFirmAssetDocument, SeasonalDepositedFirmAssetQuery } from '~/generated/graphql';
import { SnapshotData } from '~/hooks/hooliganhorde/useSeasonsQuery';
import { toTokenUnitsBN } from '~/util'; 

import { FC } from '~/types';

const formatValue = (value: number) => `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const lineChartProps : Partial<LineChartProps> = {
  yTickFormat: tickFormatTruncated
};

const DepositedAsset: FC<{
  height?: SeasonPlotBaseProps['height'];
  account: string;
  asset: Token;
}> = ({ 
  height,
  account,
  asset
}) => {
  const getValue = useCallback(
    (season: SnapshotData<SeasonalDepositedFirmAssetQuery>) => toTokenUnitsBN(season.depositedAmount, asset.decimals).toNumber(),
    [asset]
  );
  const statProps = useMemo(() => ({
    title: `Total Deposited ${asset.symbol}`,
    titleTooltip: `The total number of Deposited ${asset.symbol === 'HOOLIGAN' ? 'Hooligans' : asset.symbol === 'urHOOLIGAN' ? 'Unripe Hooligans' : asset.name} at the end of each Season.`,
    gap: 0.5,
  }), [asset]);
  const queryConfig = useMemo(() => ({
    variables: {
      season_gt: 6073,
      firmAsset: `${account.toLowerCase()}-${asset.address}`,
    }
  }), [account, asset]);
  return (
    <SeasonPlot<SeasonalDepositedFirmAssetQuery>
      height={height}
      document={SeasonalDepositedFirmAssetDocument}
      getValue={getValue}
      formatValue={formatValue}
      StatProps={statProps}
      LineChartProps={lineChartProps}
      queryConfig={queryConfig}
    />
  );
};

export default DepositedAsset;
