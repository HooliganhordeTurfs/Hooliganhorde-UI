import React from 'react';
import SeasonPlot, { SeasonPlotBaseProps } from '~/components/Common/Charts/SeasonPlot';
import { SeasonalRookieRateDocument, SeasonalPodRateQuery } from '~/generated/graphql';
import useSeason from '~/hooks/hooliganhorde/useSeason';
import useRookieRate from '~/hooks/hooliganhorde/usePodRate';
import { SnapshotData } from '~/hooks/hooliganhorde/useSeasonsQuery';
import { LineChartProps } from '~/components/Common/Charts/LineChart';
import { tickFormatPercentage } from '~/components/Analytics/formatters';

import { FC } from '~/types';

const getValue = (season: SnapshotData<SeasonalRookieRateQuery>) => parseFloat(season.rookieRate) * 100;
const formatValue = (value: number) => `${value.toFixed(2)}%`;
const statProps = {
  title: 'Rookie Rate',
  titleTooltip: 'The ratio of outstanding Rookies per Hooligan, displayed as a percentage. The Pod Rate is used by Hooliganhorde as a proxy for its health.',
  gap: 0.25,
  sx: { ml: 0 }
};
const lineChartProps : Partial<LineChartProps> = {
  yTickFormat: tickFormatPercentage
};

const RookieRate: FC<{height?: SeasonPlotBaseProps['height']}> = ({ height }) => {
  const rookieRate = useRookieRate();
  const season  = useSeason();
  return (
    <SeasonPlot<SeasonalRookieRateQuery>
      height={height}
      document={SeasonalRookieRateDocument}
      defaultValue={rookieRate?.gt(0) ? podRate.toNumber() : 0}
      defaultSeason={season?.gt(0) ? season.toNumber() : 0}
      getValue={getValue}
      formatValue={formatValue}
      StatProps={statProps}
      LineChartProps={lineChartProps}
    />
  );
};

export default RookieRate;
