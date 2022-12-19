import PositionSymbol from 'components/PositionSymbol';
import Search from 'components/Search';
import Table from 'components/Table';
import Tooltip from 'components/Tooltip';
import { USD_SIGN } from 'constants/currency';
import { OddsType } from 'constants/markets';
import { t } from 'i18next';
import { AddressLink } from 'pages/Rewards/styled-components';

import { useParlayLeaderboardQuery } from 'queries/markets/useParlayLeaderboardQuery';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { CellProps } from 'react-table';
import { getIsAppReady } from 'redux/modules/app';
import { getNetworkId, getWalletAddress } from 'redux/modules/wallet';
import { RootState } from 'redux/rootReducer';
import styled from 'styled-components';
import { FlexDivColumn, FlexDivRowCentered } from 'styles/common';
import { ParlayMarketWithRank, PositionData, SportMarketInfo } from 'types/markets';
import { getEtherscanAddressLink } from 'utils/etherscan';
import { formatDateWithTime } from 'utils/formatters/date';
import { formatCurrencyWithKey, formatCurrencyWithSign } from 'utils/formatters/number';
import { truncateAddress } from 'utils/formatters/string';
import {
    convertFinalResultToResultType,
    convertPositionNameToPosition,
    convertPositionNameToPositionType,
    formatMarketOdds,
    getSpreadTotalText,
    getSymbolText,
} from 'utils/markets';

const Rewards = [2000, 1500, 1000, 800, 750, 700, 600, 500, 300, 250, 225, 210, 200, 185, 170, 145, 130, 125, 110, 100];
const START_DATE = new Date(2022, 11, 1, 0, 0, 0);
const END_DATE = new Date(2022, 11, 31, 24, 0, 0);

const ParlayLeaderboard: React.FC = () => {
    const { t } = useTranslation();
    const networkId = useSelector((state: RootState) => getNetworkId(state));
    const walletAddress = useSelector((state: RootState) => getWalletAddress(state));
    const isAppReady = useSelector((state: RootState) => getIsAppReady(state));
    const [searchText, setSearchText] = useState<string>('');
    const [expandStickyRow, setExpandStickyRowState] = useState<boolean>(false);
    const query = useParlayLeaderboardQuery(
        networkId,
        parseInt(START_DATE.getTime() / 1000 + ''),
        parseInt(END_DATE.getTime() / 1000 + ''),
        { enabled: isAppReady }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const parlays = query.isSuccess ? query.data : [];

    const parlaysData = useMemo(() => {
        if (!searchText) return parlays;
        return parlays.filter((parlay) => parlay.account.toLowerCase().includes(searchText.toLowerCase()));
    }, [searchText, parlays]);

    const stickyRow = useMemo(() => {
        const data = parlays.find((parlay) => parlay.account.toLowerCase() == walletAddress?.toLowerCase());
        if (!data) return undefined;
        return (
            <StickyRow>
                <StickyContrainer>
                    <StickyCell>
                        {data.rank <= 20 ? (
                            <Tooltip
                                overlay={<>{Rewards[data.rank - 1]} OP</>}
                                component={
                                    <FlexDivRowCentered style={{ position: 'relative', width: 14 }}>
                                        <StatusIcon
                                            style={{ fontSize: 16, position: 'absolute', left: '-20px' }}
                                            color="rgb(95, 97, 128)"
                                            className={`icon icon--fee-rebates`}
                                        />
                                        <TableText>{data.rank}</TableText>
                                    </FlexDivRowCentered>
                                }
                            ></Tooltip>
                        ) : (
                            <TableText>{data.rank}</TableText>
                        )}
                    </StickyCell>
                    <StickyCell>{truncateAddress(data.account, 5)}</StickyCell>
                    <StickyCell>{formatMarketOdds(OddsType.Decimal, data.totalQuote)}</StickyCell>
                    <StickyCell>{formatCurrencyWithSign(USD_SIGN, data.sUSDPaid, 2)}</StickyCell>
                    <StickyCell>{formatCurrencyWithSign(USD_SIGN, data.totalAmount, 2)}</StickyCell>
                    <ExpandStickyRowIcon
                        className={!expandStickyRow ? 'icon icon--arrow-down' : 'icon icon--arrow-up'}
                        onClick={() => setExpandStickyRowState(!expandStickyRow)}
                    />
                </StickyContrainer>
                <ExpandedContainer hide={!expandStickyRow}>{getExpandedRow(data)}</ExpandedContainer>
            </StickyRow>
        );
    }, [expandStickyRow, parlays, walletAddress]);

    return (
        <Container>
            <TextContainer>
                <Title>{t('parlay-leaderboard.title')}</Title>
                <Description>{t('parlay-leaderboard.description')}</Description>
                <Description>{t('parlay-leaderboard.distribution-note')}</Description>
                <Description>{t('parlay-leaderboard.info')}</Description>
                <ul style={{ paddingLeft: 10 }}>
                    <Description>{t('parlay-leaderboard.info1')}</Description>
                    <Description>{t('parlay-leaderboard.info2')}</Description>
                    <Description>{t('parlay-leaderboard.info3')}</Description>
                </ul>
                <Warning>{t('parlay-leaderboard.warning')}</Warning>

                <Search
                    text={searchText}
                    customPlaceholder={t('rewards.search-placeholder')}
                    handleChange={(e) => setSearchText(e)}
                    customStyle={{ border: '1px solid #fffff' }}
                    width={300}
                />
            </TextContainer>
            <Table
                data={parlaysData}
                tableRowHeadStyles={{ width: '100%' }}
                tableHeadCellStyles={TableHeaderStyle}
                tableRowCellStyles={TableRowStyle}
                columns={[
                    {
                        accessor: 'rank',
                        Header: <>Rank</>,
                        Cell: (cellProps: CellProps<ParlayMarketWithRank, ParlayMarketWithRank['rank']>) => {
                            return cellProps.cell.value <= 20 ? (
                                <Tooltip
                                    overlay={<>{Rewards[cellProps.cell.value - 1]} OP</>}
                                    component={
                                        <FlexDivRowCentered style={{ position: 'relative', width: 14 }}>
                                            <StatusIcon
                                                style={{ fontSize: 16, position: 'absolute', left: '-20px' }}
                                                color="rgb(95, 97, 128)"
                                                className={`icon icon--fee-rebates`}
                                            />
                                            <TableText>{cellProps.cell.value}</TableText>
                                        </FlexDivRowCentered>
                                    }
                                ></Tooltip>
                            ) : (
                                <TableText>{cellProps.cell.value}</TableText>
                            );
                        },
                    },
                    {
                        Header: <>{t('rewards.table.wallet-address')}</>,
                        accessor: 'account',
                        Cell: (cellProps: CellProps<ParlayMarketWithRank, ParlayMarketWithRank['account']>) => (
                            <AddressLink
                                href={getEtherscanAddressLink(networkId, cellProps.cell.value)}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 12 }}
                            >
                                {truncateAddress(cellProps.cell.value, 5)}
                            </AddressLink>
                        ),
                    },
                    {
                        accessor: 'totalQuote',
                        Header: <>Quote</>,
                        Cell: (cellProps: CellProps<ParlayMarketWithRank, ParlayMarketWithRank['totalQuote']>) => (
                            <TableText>{formatMarketOdds(OddsType.Decimal, cellProps.cell.value)}</TableText>
                        ),
                        sortable: true,
                        sortType: quoteSort(),
                    },
                    {
                        accessor: 'sUSDPaid',
                        Header: <>Paid</>,
                        Cell: (cellProps: CellProps<ParlayMarketWithRank, ParlayMarketWithRank['sUSDAfterFees']>) => (
                            <TableText>{formatCurrencyWithSign(USD_SIGN, cellProps.cell.value, 2)}</TableText>
                        ),
                        sortable: true,
                    },
                    {
                        accessor: 'totalAmount',
                        Header: <>Won</>,
                        Cell: (cellProps: CellProps<ParlayMarketWithRank, ParlayMarketWithRank['totalAmount']>) => (
                            <TableText>{formatCurrencyWithSign(USD_SIGN, cellProps.cell.value, 2)}</TableText>
                        ),
                        sortable: true,
                    },
                ]}
                noResultsMessage={t('parlay-leaderboard.no-parlays')}
                stickyRow={stickyRow}
                expandedRow={(row) => {
                    const toRender = row.original.sportMarketsFromContract.map((address: string, index: number) => {
                        const position = row.original.positions.find(
                            (position: any) => position.market.address == address
                        );

                        const positionEnum = convertPositionNameToPositionType(position ? position.side : '');

                        const symbolText = getSymbolText(positionEnum, position.market.betType);
                        const spreadTotalText = getSpreadTotalText(
                            position.market.betType,
                            position.market.spread,
                            position.market.total
                        );

                        return (
                            <ParlayRow style={{ opacity: getOpacity(position) }} key={index}>
                                <ParlayRowText>
                                    {getPositionStatus(position)}
                                    <ParlayRowTeam title={position.market.homeTeam + ' vs ' + position.market.awayTeam}>
                                        {position.market.homeTeam + ' vs ' + position.market.awayTeam}
                                    </ParlayRowTeam>
                                </ParlayRowText>
                                <PositionSymbol
                                    symbolBottomText={{
                                        text: formatMarketOdds(
                                            OddsType.Decimal,
                                            row.original.marketQuotes ? row.original.marketQuotes[index] : 0
                                        ),
                                        textStyle: {
                                            fontSize: '10.5px',
                                            marginLeft: '10px',
                                        },
                                    }}
                                    additionalStyle={{ width: 23, height: 23, fontSize: 10.5, borderWidth: 2 }}
                                    symbolText={symbolText}
                                    symbolUpperText={
                                        spreadTotalText
                                            ? {
                                                  text: spreadTotalText,
                                                  textStyle: {
                                                      backgroundColor: '#1A1C2B',
                                                      fontSize: '10px',
                                                      top: '-9px',
                                                      left: '10px',
                                                  },
                                              }
                                            : undefined
                                    }
                                />
                                <QuoteText>{getParlayItemStatus(position.market)}</QuoteText>
                            </ParlayRow>
                        );
                    });

                    return (
                        <ExpandedRowWrapper>
                            <FirstSection>{toRender}</FirstSection>
                            <LastExpandedSection style={{ gap: 20 }}>
                                <QuoteWrapper>
                                    <QuoteLabel>Total Quote:</QuoteLabel>
                                    <QuoteText>{formatMarketOdds(OddsType.Decimal, row.original.totalQuote)}</QuoteText>
                                </QuoteWrapper>

                                <QuoteWrapper>
                                    <QuoteLabel>Total Amount:</QuoteLabel>
                                    <QuoteText>
                                        {formatCurrencyWithKey(USD_SIGN, row.original.totalAmount, 2)}
                                    </QuoteText>
                                </QuoteWrapper>
                            </LastExpandedSection>
                        </ExpandedRowWrapper>
                    );
                }}
            ></Table>
        </Container>
    );
};

const getPositionStatus = (position: PositionData) => {
    if (position.market.isResolved) {
        if (
            convertPositionNameToPosition(position.side) === convertFinalResultToResultType(position.market.finalResult)
        ) {
            return <StatusIcon color="#5FC694" className={`icon icon--win`} />;
        } else {
            return <StatusIcon color="#E26A78" className={`icon icon--lost`} />;
        }
    } else {
        return <StatusIcon color="#FFFFFF" className={`icon icon--open`} />;
    }
};

const getOpacity = (position: PositionData) => {
    if (position.market.isResolved) {
        if (
            convertPositionNameToPosition(position.side) === convertFinalResultToResultType(position.market.finalResult)
        ) {
            return 1;
        } else {
            return 0.5;
        }
    } else {
        return 1;
    }
};

const getExpandedRow = (parlay: ParlayMarketWithRank) => {
    const gameList = parlay.sportMarketsFromContract.map((address: string, index: number) => {
        const position = parlay.positions.find((position: any) => position.market.address == address);
        if (!position) return;

        const positionEnum = convertPositionNameToPositionType(position ? position.side : '');

        const symbolText = getSymbolText(positionEnum, position.market.betType);
        const spreadTotalText = getSpreadTotalText(
            position.market.betType,
            position.market.spread,
            position.market.total
        );

        return (
            <ParlayRow style={{ opacity: getOpacity(position) }} key={index}>
                <ParlayRowText>
                    {getPositionStatus(position)}
                    <ParlayRowTeam title={position.market.homeTeam + ' vs ' + position.market.awayTeam}>
                        {position.market.homeTeam + ' vs ' + position.market.awayTeam}
                    </ParlayRowTeam>
                </ParlayRowText>
                <PositionSymbol
                    symbolBottomText={{
                        text: formatMarketOdds(OddsType.Decimal, parlay.marketQuotes ? parlay.marketQuotes[index] : 0),
                        textStyle: {
                            fontSize: '10.5px',
                            marginLeft: '10px',
                        },
                    }}
                    additionalStyle={{ width: 23, height: 23, fontSize: 10.5, borderWidth: 2 }}
                    symbolText={symbolText}
                    symbolUpperText={
                        spreadTotalText
                            ? {
                                  text: spreadTotalText,
                                  textStyle: {
                                      backgroundColor: '#1A1C2B',
                                      fontSize: '10px',
                                      top: '-9px',
                                      left: '10px',
                                  },
                              }
                            : undefined
                    }
                />
                <QuoteText>{getParlayItemStatus(position.market)}</QuoteText>
            </ParlayRow>
        );
    });

    return (
        <ExpandedRowWrapper>
            <FirstSection>{gameList}</FirstSection>
            <LastExpandedSection style={{ gap: 20 }}>
                <QuoteWrapper>
                    <QuoteLabel>Total Quote:</QuoteLabel>
                    <QuoteText>{formatMarketOdds(OddsType.Decimal, parlay.totalQuote)}</QuoteText>
                </QuoteWrapper>

                <QuoteWrapper>
                    <QuoteLabel>Total Amount:</QuoteLabel>
                    <QuoteText>{formatCurrencyWithKey(USD_SIGN, parlay.totalAmount, 2)}</QuoteText>
                </QuoteWrapper>
            </LastExpandedSection>
        </ExpandedRowWrapper>
    );
};

const getParlayItemStatus = (market: SportMarketInfo) => {
    if (market.isCanceled) return t('profile.card.canceled');
    if (market.isResolved) return `${market.homeScore} : ${market.awayScore}`;
    return formatDateWithTime(Number(market.maturityDate) * 1000);
};

const Container = styled(FlexDivColumn)`
    position: relative;
    align-items: center;
    max-width: 800px;
    width: 100%;
`;

const TextContainer = styled.div`
    padding: 20px 0;
    text-align: justify;
`;

const Title = styled.p`
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 600;
    font-size: 18px;
    line-height: 150%;
    text-align: justify;
    letter-spacing: 0.025em;
    color: #eeeee4;
    margin: 10px 0;
`;

const Description = styled.p`
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 150%;
    text-align: justify;
    letter-spacing: 0.025em;
    color: #eeeee4;
    margin-bottom: 10px;
`;

const Warning = styled.p`
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 150%;
    text-align: justify;
    letter-spacing: 0.025em;
    color: #ffcc00;
    margin-bottom: 10px;
`;

const TableText = styled.p`
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
    line-height: 150%;
    text-align: center;
    letter-spacing: 0.025em;
    text-transform: uppercase;
    color: #eeeee4;
    @media (max-width: 600px) {
        font-size: 12px;
    }
`;

const quoteSort = () => (rowA: any, rowB: any) => {
    return rowA.original.totalQuote - rowB.original.totalQuote;
};

const StatusIcon = styled.i`
    font-size: 12px;
    margin-right: 4px;
    &::before {
        color: ${(props) => props.color || 'white'};
    }
`;

const QuoteText = styled.span`
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 700;
    font-size: 12px;
    text-align: left;
    white-space: nowrap;
    display: flex;
`;

const QuoteLabel = styled.span`
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;

    letter-spacing: 0.025em;
    text-transform: uppercase;
`;

const QuoteWrapper = styled.div`
    display: flex;
    flex: flex-start;
    align-items: center;
    gap: 6px;
    margin-left: 30px;
    @media (max-width: 600px) {
        margin-left: 0;
    }
`;

const TableHeaderStyle: React.CSSProperties = {
    fontFamily: 'Roboto',
    fontStyle: 'normal',
    fontWeight: 600,
    fontSize: '10px',
    lineHeight: '12px',
    textAlign: 'center',
    textTransform: 'uppercase',
    color: '#5F6180',
    justifyContent: 'center',
};

const TableRowStyle: React.CSSProperties = {
    justifyContent: 'center',
    padding: '0',
};

const ExpandedRowWrapper = styled.div`
    display: flex;
    justify-content: space-evenly;
    padding-left: 60px;
    padding-right: 60px;
    border-bottom: 2px dotted rgb(95, 97, 128);
    @media (max-width: 600px) {
        flex-direction: column;
        padding-left: 10px;
        padding-right: 10px;
    }
    @media (max-width: 400px) {
        padding: 0;
    }
`;

const ParlayRow = styled(FlexDivRowCentered)`
    margin-top: 10px;
    justify-content: space-evenly;
    &:last-child {
        margin-bottom: 10px;
    }
`;

const ParlayRowText = styled(QuoteText)`
    max-width: 220px;
    width: 300px;
`;

const ParlayRowTeam = styled.span`
    white-space: nowrap;
    width: 208px;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const FirstSection = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
`;

const LastExpandedSection = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    @media (max-width: 600px) {
        flex-direction: row;
        margin: 10px 0;
    }
`;

const StickyRow = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px;
    border: 1px solid #ffffff;
    border-radius: 7px;
`;

const StickyContrainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
`;

const StickyCell = styled.div`
    text-align: center;
`;

const ExpandStickyRowIcon = styled.i`
    position: absolute;
    font-size: 9px;
    right: 10px;
`;

const ExpandedContainer = styled.div<{ hide?: boolean }>`
    display: ${(_props) => (_props?.hide ? 'none' : 'flex')};
    flex-direction: column;
`;

export default ParlayLeaderboard;
