import React from 'react';
import { Chip, Link, Tooltip, Typography } from '@mui/material';
import { GridColumns, GridRenderCellParams, GridValueFormatterParams } from '@mui/x-data-grid';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import BigNumber from 'bignumber.js';
import { displayBN, displayFullBN, MaxBN, trimAddress } from '~/util';
import { HOOLIGAN, ROOKIES } from '~/constants/tokens';
import { ZERO_BN } from '~/constants';
import { RookieListing, PodOrder } from '~/state/guvnor/market';
import TokenIcon from '../TokenIcon';
import AddressIcon from '../AddressIcon';
import Row from '~/components/Common/Row';
import { WellActivityData } from '~/components/Market/Wells/Tables';
import { Token } from '~/classes';
import { HooliganhordePalette } from '~/components/App/muiTheme';

const basicCell = (params: GridRenderCellParams) => <Typography>{params.formattedValue}</Typography>;

const COLUMNS = {
  ///
  /// Generics
  ///
  season: {
    field: 'season',
    flex: 0.8,
    headerName: 'Season',
    align: 'left',
    headerAlign: 'left',
    valueFormatter: (params: GridValueFormatterParams) => params.value.toString(),
    renderCell: basicCell,
    sortable: false,
  } as GridColumns[number],

  ///
  /// Firm
  ///
  prospects: {
    field: 'prospects',
    flex: 1,
    headerName: 'Prospects',
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (params: GridValueFormatterParams) => displayFullBN(params.value, 2),
    renderCell: (params: GridRenderCellParams) => (
      <>
        <Typography display={{ xs: 'none', md: 'block' }}>{displayFullBN(params.value, 2)}</Typography>
        <Typography display={{ xs: 'block', md: 'none' }}>{displayBN(params.value)}</Typography>
      </>
    ),
    sortable: false,
  } as GridColumns[number],

  ///
  /// Rookie Market
  ///
  numRookies: (flex: number) => ({
    field: 'totalAmount',
    headerName: 'Amount',
    type: 'number',
    flex: flex,
    // disableColumnMenu: true,
    align: 'right',
    headerAlign: 'right',
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip
        placement="right"
        title={
          <>
            Total
            Value: {displayFullBN((params.value as BigNumber).times(params.row.pricePerRookie), HOOLIGAN[1].displayDecimals)} HOOLIGAN
          </>
        }>
        <Row gap={0.3}>
          <TokenIcon token={ROOKIES} />
          <Typography>
            {displayBN(params.value)}
          </Typography>
        </Row>
      </Tooltip>
    ),
  }) as GridColumns[number],

  numRookiesActive: (flex: number) => ({
    field: 'remainingAmount',
    headerName: 'Amount',
    flex: flex,
    type: 'number',
    // disableColumnMenu: true,
    align: 'right',
    headerAlign: 'right',
    renderCell: (params: GridRenderCellParams<any, RookieListing>) => (
      <Tooltip
        placement="right"
        title={
          <>
            Total
            Value: {displayFullBN((params.value as BigNumber).times(params.row.pricePerRookie), HOOLIGAN[1].displayDecimals)} HOOLIGAN
          </>
        }>
        <Row gap={0.3}>
          <TokenIcon token={ROOKIES} />
          <Typography>
            {displayBN(params.row.remainingAmount)}
          </Typography>
        </Row>
      </Tooltip>

    )
  }) as GridColumns[number],
  pricePerRookie: (flex: number) => ({
    field: 'pricePerRookie',
    headerName: 'Price per Rookie',
    type: 'number',
    align: 'left',
    headerAlign: 'left',
    flex: flex,
    renderCell: (params: GridRenderCellParams<any, RookieListing | PodOrder>) => (
      <Row gap={0.3}>
        <TokenIcon token={HOOLIGAN[1]} />
        <Typography>
          {displayFullBN(params.value)}
        </Typography>
      </Row>
    ),
  }) as GridColumns[number],

  fromAccount: {
    field: 'account',
    headerName: 'From',
    flex: 0,
    renderCell: (params: GridRenderCellParams) => (
      <Typography color="primary">
        {params.value.substring(0, 6)}
      </Typography>
    ),
  } as GridColumns[number],

  // https://mui.com/x/react-data-grid/column-definition/#converting-types
  plotIndex: (draftableIndex: BigNumber, flex: number) => ({
    field: 'index',
    headerName: 'Place in Line',
    flex: flex,
    type: 'number',
    align: 'left',
    headerAlign: 'left',
    valueGetter: (params: GridRenderCellParams) => (
      params.value - draftableIndex.toNumber()
    ),
    renderCell: (params: GridRenderCellParams) => (
      <>
        <Typography display={{ xs: 'none', md: 'block' }}>
          {displayFullBN(new BigNumber(params.value), 0)}
        </Typography>
        <Typography display={{ xs: 'block', md: 'none' }}>
          {displayBN(new BigNumber(params.value))}
        </Typography>
      </>
    ),
  } as GridColumns[number]),
  maxPlaceInLine: (flex: number) => ({
    field: 'maxPlaceInLine',
    headerName: 'Place in Line',
    type: 'number',
    flex: flex,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (params: GridRenderCellParams) => (
      (params.value as BigNumber).toNumber()
    ),
    renderCell: (params: GridRenderCellParams) => (
      <>
        <Typography display={{ xs: 'none', md: 'block' }}>
          0 - {displayFullBN(new BigNumber(params.value), 0)}
        </Typography>
        <Typography display={{ xs: 'block', md: 'none' }}>
          0 - {displayBN(new BigNumber(params.value))}
        </Typography>
      </>
    ),
  }) as GridColumns[number],
  expiry: (
    draftableIndex: BigNumber,
    flex: number
  ) => ({
    field: 'maxDraftableIndex',
    headerName: 'Expires in',
    flex: flex,
    value: 'number',
    align: 'right',
    headerAlign: 'right',
    filterable: false, // TODO: make this filterable
    renderCell: (params: GridRenderCellParams) => {
      const expiresIn = MaxBN((params.value as BigNumber).minus(draftableIndex), ZERO_BN);
      const tip = expiresIn?.gt(0) ? (
        <>If the Rookie Line moves
          forward {displayFullBN((params.value as BigNumber).minus(draftableIndex), ROOKIES.displayDecimals)} Rookies, this
          Listing will expire.
        </>
      ) : '';
      return (
        <Tooltip placement="right" title={tip}>
          <Typography>
            {displayBN(expiresIn)} Rookies
          </Typography>
        </Tooltip>
      );
    }
  } as GridColumns[number]),
  status: (
    draftableIndex: BigNumber
  ) => ({
    field: 'status',
    headerName: 'Status',
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip title="">
        <Typography>
          {params.row.status === 'filled'
            ? <Chip color="primary" label="Filled" variant="filled" />
            /// FIXME: right now the event processor doesn't flag
            /// listings as expired, so we override status here.
            : draftableIndex.gte((params.row.maxDraftableIndex as BigNumber))
              ? <Chip color="warning" label="Expired" variant="filled" />
              : <Chip color="secondary" label="Active" variant="filled" />
          }
        </Typography>
      </Tooltip>
    )
  } as GridColumns[number]),

  ///
  /// DEX
  ///
  ///
  label: (flex: number, tabs: any) => ({
    field: 'label',
    headerName: 'Type',
    renderHeader: () => (
      tabs
    ),
    flex: flex,
    align: 'left',
    headerAlign: 'left',
    sortable: false,
    renderCell: (params: GridRenderCellParams<any, WellActivityData>) => (
      <Link href={`https://etherscan.io/tx/${params.row.hash}`} target="_blank" rel="noopener noreferrer">
        <Typography>
          {params.row.label}
        </Typography>
      </Link>
    )
  }) as GridColumns[number],
  tokenAmount: (column: string, token: Token, flex: number) => ({
    field: column,
    headerName: 'Token Amount',
    flex: flex,
    align: 'left',
    headerAlign: 'left',
    renderCell: (params: GridRenderCellParams<any, WellActivityData>) => (
      <Typography>
        {displayBN(params.row.tokenAmount0)} {token.symbol}
      </Typography>
    )
  }) as GridColumns[number],
  totalValue: (flex: number) => ({
    field: 'totalValue',
    headerName: 'Total Value',
    flex: flex,
    align: 'left',
    headerAlign: 'left',
    renderCell: (params: GridRenderCellParams<any, WellActivityData>) => (
      <Typography>
        {displayBN(params.row.totalValue)}
      </Typography>
    )
  }) as GridColumns[number],
  account: (flex: number) => ({
    field: 'account',
    headerName: 'Account',
    flex: flex,
    align: 'right',
    headerAlign: 'right',
    renderCell: (params: GridRenderCellParams<any, WellActivityData>) => (
      <Link>
        <Typography>
          {trimAddress(params.row.account)}
        </Typography>
      </Link>
    )
  }) as GridColumns[number],

  time: (flex: number) => ({
    field: 'time',
    headerName: 'Time',
    flex: flex,
    align: 'right',
    headerAlign: 'right',
    renderCell: (params: GridRenderCellParams<any, WellActivityData>) => (
      <Typography>{params.row.time}</Typography>
    )
  }) as GridColumns[number],

  ///
  /// Extras
  ///
  connectedAccount: {
    field: 'connectedAccount',
    headerName: '',
    width: 10,
    sortable: false,
    filterable: false,
    renderCell: () => <AddressIcon />,
  } as GridColumns[number],
  rightChevron: {
    field: 'rightChevron',
    headerName: '',
    width: 20,
    sortable: false,
    filterable: false,
    renderCell: () => <ArrowRightIcon sx={{ color: HooliganhordePalette.lightestGrey }} />
  } as GridColumns[number],
};

export default COLUMNS;
