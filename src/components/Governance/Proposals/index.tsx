import React, { useCallback } from 'react';
import useTabs from '~/hooks/display/useTabs';
import BadgeTab from '~/components/Common/BadgeTab';
import ProposalList from '~/components/Governance/Proposals/ProposalList';
import { useProposalsQuery } from '~/generated/graphql';
import { Proposal } from '~/util/Governance';
import { Module, ModuleContent, ModuleTabs } from '~/components/Common/Module';
import { SNAPSHOT_SPACES } from '~/lib/Hooliganhorde/Governance';

import { FC } from '~/types';

/// Variables
const SLUGS = ['dao', 'hooliganhorde-farms', 'hooligan-recruit'];

const Proposals: FC<{}> = () => {
  const [tab, handleChange] = useTabs(SLUGS, 'type');

  // Query Proposals
  const { loading, data } = useProposalsQuery({
    variables: { space_in: SNAPSHOT_SPACES },
    fetchPolicy: 'cache-and-network',
    context: { subgraph: 'snapshot' }
  });

  /// Helpers
  const filterBySpace = useCallback((t: number) => {
    if (!loading && data?.proposals) {
      return data.proposals.filter(
        (p) => p !== null && p?.space?.id === SNAPSHOT_SPACES[t]
      ) as Proposal[];
    }
    return [];
  }, [data, loading]);

  const hasActive = (proposals: Proposal[]) => {
    // true if any proposals are active
    if (proposals) {
      return proposals.filter(
        (p) => p?.state === 'active'
      ).length > 0;
    }
    return false;
  };

  /// Filter proposals & check if there are any active ones
  const filterProposals = useCallback((t: number) => {
    const filtered = filterBySpace(t);
    const hasActiveProposals = hasActive(filtered);
    return [filtered, hasActiveProposals] as const;
  }, [filterBySpace]);

  const [daoProposals, hasActiveDao] = filterProposals(0);
  const [hooliganhordeFarmsProposals, hasActiveBF] = filterProposals(1);
  const [hooliganRecruitProposals, hasActiveBS] = filterProposals(2);

  return (
    <Module>
      <ModuleTabs
        value={tab}
        onChange={handleChange}
        sx={{ minHeight: 0, overflow: 'visible', '& .MuiTabs-scroller': { overflow: 'visible' } }}
        variant="scrollable">
        <BadgeTab label="DAO" showBadge={hasActiveDao as boolean} />
        <BadgeTab label="Hooliganhorde Farms" showBadge={hasActiveBF as boolean} />
        <BadgeTab label="Hooligan Recruit" showBadge={hasActiveBS as boolean} />
      </ModuleTabs>
      <ModuleContent>
        {tab === 0 && <ProposalList proposals={daoProposals} />}
        {tab === 1 && <ProposalList proposals={hooliganhordeFarmsProposals} />}
        {tab === 2 && <ProposalList proposals={hooliganRecruitProposals} />}
      </ModuleContent>
    </Module>
  );
};

export default Proposals;
