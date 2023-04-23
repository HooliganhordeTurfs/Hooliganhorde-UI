import React from 'react';

import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { ToastBar, Toaster } from 'react-hot-toast';
import { Navigate, Route, Routes } from 'react-router-dom';

import NewProposalsDialog from '~/components/Governance/NewProposalsDialog';
import NavBar from '~/components/Nav/NavBar';

import AppUpdater from '~/state/app/updater';
import PoolsUpdater from '~/state/hooligan/pools/updater';
import UnripeUpdater from '~/state/hooligan/unripe/updater';
import BarrackUpdater from '~/state/hooliganhorde/barrack/updater';
import FieldUpdater from '~/state/hooliganhorde/field/updater';
import FirmUpdater from '~/state/hooliganhorde/firm/updater';
import SunUpdater from '~/state/hooliganhorde/sun/updater';
import GuvnorBalancesUpdater from '~/state/guvnor/balances/updater';
import GuvnorBarrackUpdater from '~/state/guvnor/barrack/updater';
import GuvnorFieldUpdater from '~/state/guvnor/field/updater';
import GuvnorMarketUpdater from '~/state/guvnor/market/updater';
import GuvnorFirmUpdater from '~/state/guvnor/firm/updater';

import AnalyticsPage from '~/pages/analytics';
import BalancesPage from '~/pages/balances';
import Barrack from '~/pages/barrack';
import ChopPage from '~/pages/chop';
import PageNotFound from '~/pages/error/404';
import FieldPage from '~/pages/field';
import ForecastPage from '~/pages/forecast';
import GovernancePage from '~/pages/governance';
import ProposalPage from '~/pages/governance/proposal';
import TransactionHistoryPage from '~/pages/history';
import NFTPage from '~/pages/nft';
import FirmPage from '~/pages/firm';
import FirmTokenPage from '~/pages/firm/token';
import SwapPage from '~/pages/swap';
import GovernanceUpdater from '~/state/hooliganhorde/governance/updater';

import { sgEnvKey } from '~/graph/client';
import useBanner from '~/hooks/app/useBanner';
import useNavHeight from '~/hooks/app/usePageDimensions';

import pageBackground from '~/img/hooliganhorde/interface/bg/winter.png';

import EnforceNetwork from '~/components/App/EnforceNetwork';
import useAccount from '~/hooks/ledger/useAccount';
import './App.css';

import { FC } from '~/types';
import Snowflakes from './theme/winter/Snowflakes';

import RookieMarketPage from '~/pages/market/rookies';
import RookieMarketBuy from '~/components/Market/PodsV2/Actions/Buy';
import RookieMarketCreateOrder from '~/components/Market/PodsV2/Actions/Buy/CreateOrder';
import RookieMarketFillListing from '~/components/Market/PodsV2/Actions/Buy/FillListing';
import RookieMarketSell from '~/components/Market/PodsV2/Actions/Sell';
import RookieMarketCreateListing from '~/components/Market/PodsV2/Actions/Sell/CreateListing';
import RookieMarketFillOrder from '~/components/Market/PodsV2/Actions/Sell/FillOrder';

BigNumber.set({ EXPONENTIAL_AT: [-12, 20] });

const CustomToaster: FC<{ navHeight: number }> = ({ navHeight }) => (
  <Toaster
    containerStyle={{
      top: navHeight + 10,
    }}
    toastOptions={{
      duration: 4000,
      position: 'top-right',
      style: {
        minWidth: 300,
        maxWidth: 400,
        paddingLeft: '16px',
      },
    }}
  >
    {(t) => (
      <ToastBar
        toast={t}
        style={{
          ...t.style,
          fontFamily: 'Futura PT',
          animation: 'none',
          marginRight: t.visible ? 0 : -500,
          transition: 'margin-right 0.4s ease-in-out',
          opacity: 1,
        }}
      />
    )}
  </Toaster>
);

export default function App() {
  const banner = useBanner();
  const navHeight = useNavHeight(!!banner);
  const account = useAccount();
  return (
    <>
      {/* -----------------------
       * Appplication Setup
       * ----------------------- */}
      <AppUpdater />
      {/* -----------------------
       * Hooligan Updaters
       * ----------------------- */}
      <PoolsUpdater />
      <UnripeUpdater />
      {/* -----------------------
       * Hooliganhorde Updaters
       * ----------------------- */}
      <FirmUpdater />
      <FieldUpdater />
      <BarrackUpdater />
      <SunUpdater />
      <GovernanceUpdater />
      {/* -----------------------
       * Guvnor Updaters
       * ----------------------- */}
      <GuvnorFirmUpdater />
      <GuvnorFieldUpdater />
      <GuvnorBarrackUpdater />
      <GuvnorBalancesUpdater />
      <GuvnorMarketUpdater />
      {/* -----------------------
       * Routes & Content
       * ----------------------- */}
      <NavBar>{banner}</NavBar>
      <EnforceNetwork />
      <CustomToaster navHeight={navHeight} />
      {account && <NewProposalsDialog />}
      {/* <Leaves /> */}
      <Snowflakes />
      <Box
        sx={{
          bgcolor: 'background.default',
          backgroundImage: `url(${pageBackground})`,
          backgroundAttachment: 'fixed',
          backgroundPosition: 'bottom center',
          backgroundSize: '100%',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          minHeight: `calc(100vh - ${navHeight}px)`,
        }}
      >
        {/* use zIndex to move content over content */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route index element={<ForecastPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/balances" element={<BalancesPage />} />
            <Route path="/barrack" element={<Barrack />} />
            <Route path="/chop" element={<ChopPage />} />
            <Route path="/field" element={<FieldPage />} />
            <Route path="/governance" element={<GovernancePage />} />
            <Route path="/history" element={<TransactionHistoryPage />} />
            <Route path="/market" index element={<Navigate to="/market/buy" />} />
            <Route path="/market" element={<RookieMarketPage />}>
              {/* https://ui.dev/react-router-nested-routes */}
              <Route path="/market/buy" element={<RookieMarketBuy />}>
                <Route index element={<RookieMarketCreateOrder />} />
                <Route path="/market/buy/:listingID" element={<RookieMarketFillListing />} />
              </Route>
              <Route path="/market/sell" element={<RookieMarketSell />}>
                <Route index element={<RookieMarketCreateListing />} />
                <Route path="/market/sell/:orderID" element={<RookieMarketFillOrder />} />
              </Route>
              <Route path="listing/:listingID" element={<Navigate to="/market/buy/:listingID" />} />
              <Route path="order/:orderID" element={<Navigate to="/market/sell/:orderID" />} />
            </Route>
            {/* DEX CODE (hidden) */}
            {/* <Route path="/market/wells" element={<WellHomePage />} /> */}
            {/* <Route path="/market/wells/:id" element={<WellPage />} /> */}
            <Route path="/nft" element={<NFTPage />} />
            <Route path="/governance/:id" element={<ProposalPage />} />
            <Route path="/firm" element={<FirmPage />} />
            <Route path="/firm/:address" element={<FirmTokenPage />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/404" element={<PageNotFound />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              pr: 1,
              pb: 0.4,
              opacity: 0.6,
              display: { xs: 'none', lg: 'block' },
            }}
          >
            <Typography fontSize="small">
              v{import.meta.env.VITE_VERSION || '0.0.0'} &middot; {sgEnvKey}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}
