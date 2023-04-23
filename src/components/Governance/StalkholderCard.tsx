import { Box, Card, Stack, Typography } from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';
import useAccount from '~/hooks/ledger/useAccount';
import { displayBN, trimAddress } from '~/util';
import { AppState } from '~/state';
import AuthEmptyState from '~/components/Common/ZeroState/AuthEmptyState';
import AddressIcon from '~/components/Common/AddressIcon';
import { IconSize } from '~/components/App/muiTheme';
import { HORDE } from '~/constants/tokens';
import TokenIcon from '~/components/Common/TokenIcon';
import Row from '~/components/Common/Row';

import { FC } from '~/types';

const HordeholderCard : FC<{}> = () => {
  const account       = useAccount();
  const guvnorFirm    = useSelector<AppState, AppState['_farmer']['firm']>((state) => state._farmer.firm);
  
  return (
    <Card sx={{ position: 'sticky', top: 120, p: 2 }}>
      <Stack gap={1}>
        <Row justifyContent="space-between">
          <Typography variant="h4">Hordeholder</Typography>
          {account && (
            <Row gap={0.3}>
              <AddressIcon address={account} size={IconSize.xs} />
              <Typography variant="body1">{trimAddress(account)}</Typography>
            </Row>
          )}
        </Row>
        {account ? (
          <Row gap={0.5}>
            <TokenIcon token={HORDE} css={{ height: IconSize.small }} />
            <Typography variant="bodyLarge">{displayBN(guvnorFirm.horde.active)} HORDE</Typography>
          </Row>
        ) : (
          <Box height={{ xs: 100, md: 150 }}>
            <AuthEmptyState message="Your Horde will appear here." />
          </Box>
        )}
      </Stack>
    </Card>
  );
};

export default HordeholderCard;
