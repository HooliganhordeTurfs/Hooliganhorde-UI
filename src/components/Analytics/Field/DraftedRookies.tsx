import React from 'react';
import SeasonPlot, { SeasonPlotBaseProps } from '~/components/Common/Charts/SeasonPlot';
import { SeasonalDraftedRookiesDocument, SeasonalDraftedPodsQuery } from '~/generated/graphql';
import { SnapshotData } from '~/hooks/hooliganhorde/useSeasonsQuery';
import { toTokenUnitsBN } from '~/util';
import { HOOLIGAN } from '~/constants/tokens';
import { LineChartProps } from '~/components/Common/Charts/LineChart';
import { tickFormatTruncated } from '~/components/Analytics/formatters'; 

import { FC } from '~/types';

const getValue = (season: SnapshotData<SeasonalDraftedRookiesQuery>) => toTokenUnitsBN(season.draftedPods, HOOLIGAN[1].decimals).toNumber();
const formatValue = (value: number) => `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const StatProps = {
  title: 'Drafted Rookies',
  titleTooltip: 'The total number of Rookies Drafted at the end of each Season.',
  gap: 0.5,
};
const lineChartProps : Partial<LineChartProps> = {
  yTickFormat: tickFormatTruncated
};

const DraftedRookies: FC<{height?: SeasonPlotBaseProps['height']}> = ({ height }) => (
  <SeasonPlot<SeasonalDraftedRookiesQuery>
    height={height}
    document={SeasonalDraftedRookiesDocument}
    getValue={getValue}
    formatValue={formatValue}
    StatProps={StatProps}
    LineChartProps={lineChartProps}
  />
);

export default DraftedRookies;
