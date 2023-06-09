import React from 'react';
import { Card, Tab, Tabs } from '@mui/material';

import useTabs from '~/hooks/display/useTabs';
import Price from './Price';
import Supply from '~/components/Analytics/Hooligan/Supply';
import MarketCap from '~/components/Analytics/Hooligan/MarketCap';
import Volume from '~/components/Analytics/Hooligan/Volume';
import Liquidity from '~/components/Analytics/Hooligan/Liquidity';
import Crosses from '~/components/Analytics/Hooligan/Crosses';
import DeltaB from '~/components/Analytics/Hooligan/DeltaB';

// const SLUGS = ['price', 'volume', 'liquidity', 'mktcap', 'supply', 'crosses'];
import { FC } from '~/types';

const HooliganAnalytics: FC<{}> = () => {
  const [tab, handleChangeTab] = useTabs();
  return (
    <Card>
      <Tabs value={tab} onChange={handleChangeTab} sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Tab label="Hooligan Price" />
        <Tab label="Volume" />
        <Tab label="Liquidity" />
        <Tab label="Market Cap" />
        <Tab label="Supply" />
        <Tab label="Crosses" />
        <Tab label="Delta B" />
      </Tabs>
      {tab === 0 && <Price height={300} />}
      {tab === 1 && <Volume height={300} />}
      {tab === 2 && <Liquidity height={300} />}
      {tab === 3 && <MarketCap height={300} />}
      {tab === 4 && <Supply height={300} />}
      {tab === 5 && <Crosses height={300} />}
      {tab === 6 && <DeltaB height={300} />}
    </Card>
  );
};

export default HooliganAnalytics;
