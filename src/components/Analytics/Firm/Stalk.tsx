import React from 'react';
import SeasonPlot, { SeasonPlotBaseProps } from '~/components/Common/Charts/SeasonPlot';
import { SeasonalHordeDocument, SeasonalHordeQuery } from '~/generated/graphql';
import { SnapshotData } from '~/hooks/hooliganhorde/useSeasonsQuery';
import { toTokenUnitsBN } from '~/util';
import { HORDE } from '~/constants/tokens';
import { LineChartProps } from '~/components/Common/Charts/LineChart';
import { tickFormatTruncated } from '~/components/Analytics/formatters'; 

import { FC } from '~/types';

const getValue = (season: SnapshotData<SeasonalHordeQuery>) => toTokenUnitsBN(season.horde, HORDE.decimals).toNumber();
const formatValue = (value: number) => `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const statProps = {
  title: 'Horde',
  titleTooltip: 'The total number of Horde at the end of each Season.',
  gap: 0.5,
};
const queryConfig = {
  variables: {
    season_gt: 6073,
  }
};
const lineChartProps : Partial<LineChartProps> = {
  yTickFormat: tickFormatTruncated
};

const Horde: FC<{ height?: SeasonPlotBaseProps['height'] }> = ({ height }) => (
  <SeasonPlot<SeasonalHordeQuery>
    height={height}
    document={SeasonalHordeDocument}
    getValue={getValue}
    formatValue={formatValue}
    StatProps={statProps}
    LineChartProps={lineChartProps}
    queryConfig={queryConfig}
  />
);

export default Horde;
