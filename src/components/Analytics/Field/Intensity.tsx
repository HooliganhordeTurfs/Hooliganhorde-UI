import React from 'react';
import { useSelector } from 'react-redux';
import { tickFormatPercentage } from '~/components/Analytics/formatters';
import { LineChartProps } from '~/components/Common/Charts/LineChart';
import SeasonPlot, { SeasonPlotBaseProps } from '~/components/Common/Charts/SeasonPlot';
import { SeasonalIntensityDocument, SeasonalIntensityQuery } from '~/generated/graphql';
import useSeason from '~/hooks/hooliganhorde/useSeason';
import { SnapshotData } from '~/hooks/hooliganhorde/useSeasonsQuery';
import { AppState } from '~/state';

import { FC } from '~/types';

const getValue = (snapshot: SnapshotData<SeasonalIntensityQuery>) => snapshot.intensity;
const formatValue = (value: number) => `${value.toFixed(0)}%`;
const statProps = {
  title: 'Intensity',
  titleTooltip: 'The interest rate for Sowing Hooligans each Season.',
  gap: 0.5,
};
const lineChartProps : Partial<LineChartProps> = {
  yTickFormat: tickFormatPercentage
};

const Intensity: FC<{height?: SeasonPlotBaseProps['height']}> = ({ height }) => {
  const intensity = useSelector<AppState, AppState['_hooliganhorde']['field']['weather']['yield']>((state) => state._hooliganhorde.field.weather.yield);
  const season  = useSeason();
  return (
    <SeasonPlot<SeasonalIntensityQuery>
      height={height}
      document={SeasonalIntensityDocument}
      defaultValue={intensity?.gt(0) ? intensity.toNumber() : 0}
      defaultSeason={season?.gt(0) ? season.toNumber() : 0}
      getValue={getValue}
      formatValue={formatValue}
      StatProps={statProps}
      LineChartProps={lineChartProps}
    />
  );
};

export default Intensity;
