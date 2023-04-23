import React from 'react';
import SeasonPlot, { SeasonPlotBaseProps } from '~/components/Common/Charts/SeasonPlot';
import { SeasonalProspectsDocument, SeasonalProspectsQuery } from '~/generated/graphql';
import { SnapshotData } from '~/hooks/hooliganhorde/useSeasonsQuery';
import { toTokenUnitsBN } from '~/util';
import { PROSPECTS } from '~/constants/tokens';
import { tickFormatTruncated } from '~/components/Analytics/formatters';
import { LineChartProps } from '~/components/Common/Charts/LineChart'; 

import { FC } from '~/types';

const getValue = (season: SnapshotData<SeasonalProspectsQuery>) => toTokenUnitsBN(season.prospects, PROSPECTS.decimals).toNumber();
const formatValue = (value: number) => `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const statProps = {
  title: 'Prospects',
  titleTooltip: 'The total number of Prospects at the end of each Season.',
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

const Prospects: FC<{ height?: SeasonPlotBaseProps['height'] }> = ({ height }) => (
  <SeasonPlot<SeasonalProspectsQuery>
    height={height}
    document={SeasonalProspectsDocument}
    getValue={getValue}
    formatValue={formatValue}
    StatProps={statProps}
    LineChartProps={lineChartProps}
    queryConfig={queryConfig}
  />
);

export default Prospects;
