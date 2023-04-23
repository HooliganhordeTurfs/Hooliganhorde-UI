import React from 'react';
import { Tab } from '@mui/material';
import useTabs from '~/hooks/display/useTabs';
import BadgeTab from '~/components/Common/BadgeTab';
import useGuvnorPercoceter from '~/hooks/guvnor/useFarmerFertilizer';
import Rinse from './Rinse';
import Buy from './Buy';
import { Module, ModuleContent, ModuleTabs } from '~/components/Common/Module';

import { FC } from '~/types';

const SLUGS = ['buy', 'rinse'];

const BarrackActions : FC<{}> = () => {
  const [tab, handleChange] = useTabs(SLUGS, 'action');
  const guvnorPercoceter = useGuvnorFertilizer();
  return (
    <Module>
      <ModuleTabs value={tab} onChange={handleChange}>
        <Tab label="Buy" />
        <BadgeTab showBadge={guvnorPercoceter.percocetedRecruits.gt(0)} label="Rinse" />
      </ModuleTabs>
      <ModuleContent>
        {tab === 0 ? <Buy /> : null}
        {tab === 1 ? <Rinse /> : null}
      </ModuleContent>
    </Module>
  );
};

export default BarrackActions;
