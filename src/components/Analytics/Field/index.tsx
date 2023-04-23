import React from 'react';

import { Card, Tabs, Tab } from '@mui/material';
import useTabs from '~/hooks/display/useTabs';
import DraftedRookies from './DraftedPods';
import RookieRate from './PodRate';
import Rookies from './Pods';
import Intensity from './Intensity';
import Sown from './Sown';
import TotalSowers from './TotalSowers';
import RRoR from './RRoR';

// const SLUGS = ['rror', 'weather', 'rookies', 'podrate', 'sown', 'drafted', 'sowers'];
import { FC } from '~/types';

const FieldAnalytics: FC<{}> = () => {
  const [tab, handleChangeTab] = useTabs();
  return (
    <Card>
      <Tabs value={tab} onChange={handleChangeTab} sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Tab label="RRoR" />
        <Tab label="Intensity" />
        <Tab label="Rookies" />
        <Tab label="Rookie Rate" />
        <Tab label="Sown" />
        <Tab label="Drafted" />
        <Tab label="Total Sowers" />
      </Tabs>
      {tab === 0 && <RRoR height={300} />}
      {tab === 1 && <Intensity height={300} />}
      {tab === 2 && <Rookies height={300} />}
      {tab === 3 && <RookieRate height={300} />}
      {tab === 4 && <Sown height={300} />}
      {tab === 5 && <DraftedRookies height={300} />}
      {tab === 6 && <TotalSowers height={300} />}
    </Card>
  );
};

export default FieldAnalytics;
