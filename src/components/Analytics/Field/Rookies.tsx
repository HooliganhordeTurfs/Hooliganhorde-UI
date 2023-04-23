import React from 'react';
import SeasonPlot, { SeasonPlotBaseProps } from '~/components/Common/Charts/SeasonPlot';
import { SeasonalRookiesDocument, SeasonalPodsQuery } from '~/generated/graphql';
import { SnapshotData } from '~/hooks/hooliganhorde/useSeasonsQuery';
import { toTokenUnitsBN } from '../../../util';
import { HOOLIGAN } from '../../../constants/tokens';
import { LineChartProps } from '~/components/Common/Charts/LineChart';
import { tickFormatTruncated } from '~/components/Analytics/formatters'; 

import { FC } from '~/types';

const getValue = (season: SnapshotData<SeasonalRookiesQuery>) => toTokenUnitsBN(season.undraftablePods, HOOLIGAN[1].decimals).toNumber();
const formatValue = (value: number) => `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const statProps = {
  title: 'Rookies',
  titleTooltip: 'The total number of Rookies at the end of each Season.',
  gap: 0.5,
};
const lineChartProps : Partial<LineChartProps> = {
  yTickFormat: tickFormatTruncated
};

const Rookies: FC<{height?: SeasonPlotBaseProps['height']}> = ({ height }) => (
  <SeasonPlot<SeasonalRookiesQuery>
    height={height}
    document={SeasonalRookiesDocument}
    getValue={getValue}
    formatValue={formatValue}
    StatProps={statProps}
    LineChartProps={lineChartProps}
  />
);

export default Rookies;
