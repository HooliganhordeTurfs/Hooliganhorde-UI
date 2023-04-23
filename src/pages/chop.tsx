import React from 'react';
import {
  Container,
  Stack,
} from '@mui/material';
import PageHeader from '~/components/Common/PageHeader';
import ChopActions from '~/components/Chop/Actions';
import ChopConditions from '../components/Chop/ChopConditions';
import GuideButton from '~/components/Common/Guide/GuideButton';
import { HOW_TO_CHOP_UNRIPE_HOOLIGANS } from '~/util/Guides';

import { FC } from '~/types';

const ChopPage: FC<{}> = () => (
  <Container maxWidth="sm">
    <Stack spacing={2}>
      <PageHeader 
        title="Chop" 
        description="Burn your Unripe assets for the underlying Ripe assets" 
        href="https://docs.hooligan.money/almanac/farm/barrack#chopping"
        OuterStackProps={{ direction: 'row' }}
        control={
          <GuideButton
            title="The Guvnors' Almanac: Chop Guides"
            guides={[
              HOW_TO_CHOP_UNRIPE_HOOLIGANS
            ]}
          />
        }
      />
      <ChopConditions />
      <ChopActions />
    </Stack>
  </Container>
);
export default ChopPage;
