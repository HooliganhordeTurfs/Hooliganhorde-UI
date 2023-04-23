import React from 'react';
import {
  Container, Grid,
  Stack
} from '@mui/material';
import PageHeader from '~/components/Common/PageHeader';
import Proposals from '~/components/Governance/Proposals';
import HordeholderCard from '~/components/Governance/HordeholderCard';
 import { HOW_TO_VOTE } from '~/util/Guides';
import GuideButton from '~/components/Common/Guide/GuideButton';

import { FC } from '~/types';

const GovernancePage: FC<{}> = () => (
  <Container maxWidth="lg">
    <Stack gap={2}>
      <PageHeader
        title="Governance"
        description="Participate in Hooliganhorde governance as a Hordeholder"
        href="https://docs.hooligan.money/almanac/governance/proposals"
        control={
          <GuideButton
            title="The Guvnors' Almanac: Governance Guides"
            guides={[
              HOW_TO_VOTE,
            ]}
          />
        }
      />
      <Grid container direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Grid item xs={12} lg={3.5}>
          <HordeholderCard />
        </Grid>
        <Grid item xs={12} lg={8.5}>
          <Proposals />
        </Grid>
      </Grid>
    </Stack>
  </Container>
);

export default GovernancePage;
