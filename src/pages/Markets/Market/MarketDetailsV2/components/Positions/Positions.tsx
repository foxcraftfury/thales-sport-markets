import { Discount } from 'components/common';
import PositionSymbol from 'components/PositionSymbol';
import Tooltip from 'components/Tooltip';
import { getErrorToastOptions, getSuccessToastOptions } from 'config/toast';
import { USD_SIGN } from 'constants/currency';
import { MAX_GAS_LIMIT } from 'constants/network';
import { Position, Side } from 'constants/options';
import { ODDS_COLOR } from 'constants/ui';
import { ethers } from 'ethers';
import ShareTicketModal from 'pages/Markets/Home/Parlay/components/ShareTicketModal';
import useMarketBalancesQuery from 'queries/markets/useMarketBalancesQuery';
import useMarketCancellationOddsQuery from 'queries/markets/useMarketCancellationOddsQuery';
import useMarketTransactionsQuery from 'queries/markets/useMarketTransactionsQuery';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getIsMobile } from 'redux/modules/app';
import { getOddsType } from 'redux/modules/ui';
import { getIsWalletConnected, getNetworkId, getWalletAddress } from 'redux/modules/wallet';
import { RootState } from 'redux/rootReducer';
import { AvailablePerSide, MarketData, ParlaysMarket } from 'types/markets';
import sportsMarketContract from 'utils/contracts/sportsMarketContract';
import { floorNumberToDecimals, formatCurrencyWithSign } from 'utils/formatters/number';
import {
    convertFinalResultToResultType,
    convertFinalResultToWinnerName,
    convertMarketDataTypeToSportMarketInfoType,
    getIsApexTopGame,
    getVisibilityOfDrawOptionByTagId,
    isDiscounted,
    formatMarketOdds,
} from 'utils/markets';
import networkConnector from 'utils/networkConnector';
import {
    ClaimableInfoContainer,
    ClaimButton,
    InnerContainer,
    Label,
    LiquidityInfoContainer,
    PositionContainer,
    ResultContainer,
    StatusContainer,
    StatusLabel,
    TeamOptionContainer,
    Value,
    Wrapper,
} from './styled-components';

type PositionsProps = {
    market: MarketData;
    selectedSide: Side;
    availablePerSide: AvailablePerSide;
    selectedPosition: Position;
    setSelectedPosition: (index: number) => void;
};

const Positions: React.FC<PositionsProps> = ({
    market,
    selectedSide,
    availablePerSide,
    selectedPosition,
    setSelectedPosition,
}) => {
    const { t } = useTranslation();
    const [claimable, setClaimable] = useState<boolean>(false);
    const [claimableAmount, setClaimableAmount] = useState<number>(0);
    const [showShareTicketModal, setShowShareTicketModal] = useState(false);

    // Redux states
    const walletAddress = useSelector((state: RootState) => getWalletAddress(state)) || '';
    const isWalletConnected = useSelector((state: RootState) => getIsWalletConnected(state));
    const networkId = useSelector((state: RootState) => getNetworkId(state));
    const isMobile = useSelector((state: RootState) => getIsMobile(state));
    const selectedOddsType = useSelector(getOddsType);
    // ------------

    // Queries
    const marketBalancesQuery = useMarketBalancesQuery(market.address, walletAddress, {
        enabled: !!market.address && isWalletConnected,
    });
    const marketCancellationOddsQuery = useMarketCancellationOddsQuery(market?.address || '', {
        enabled: market?.cancelled,
    });
    const marketTransactionsQuery = useMarketTransactionsQuery(market.address, networkId, walletAddress, {
        enabled: isWalletConnected,
    });
    // ------------

    const sumOfTransactionPaidAmount = useMemo(() => {
        let sum = 0;

        if (marketTransactionsQuery.data) {
            marketTransactionsQuery.data.forEach((transaction) => {
                if (transaction.position == market.finalResult - 1) {
                    if (transaction.type == 'sell') sum -= transaction.paid;
                    if (transaction.type == 'buy') sum += transaction.paid;
                }
            });
        }

        return sum;
    }, [market.finalResult, marketTransactionsQuery.data]);

    const balances = marketBalancesQuery.isSuccess && marketBalancesQuery.data ? marketBalancesQuery.data : undefined;
    const oddsOnCancellation =
        marketCancellationOddsQuery.isSuccess && marketCancellationOddsQuery.data
            ? marketCancellationOddsQuery.data
            : undefined;

    useEffect(() => {
        if (balances) {
            if (market.resolved) {
                if (market.cancelled) {
                    if (balances.home > 0 || balances.draw > 0 || balances.away > 0) {
                        setClaimable(true);
                        setClaimableAmount(
                            balances.home * (oddsOnCancellation?.home || 0) +
                                balances.draw * (oddsOnCancellation?.draw || 0) +
                                balances.away * (oddsOnCancellation?.away || 0)
                        );
                    }
                } else if (
                    market.finalResult !== 0 &&
                    //@ts-ignore
                    balances?.[Position[market.finalResult - 1].toLowerCase()] > 0
                ) {
                    setClaimable(true);
                    //@ts-ignore
                    setClaimableAmount(balances?.[Position[market.finalResult - 1].toLowerCase()]);
                } else if (market.finalResult === 0) {
                    if (balances.home > 0 || balances.draw > 0 || balances.away > 0) {
                        setClaimable(true);
                        setClaimableAmount(balances.home + balances.draw + balances.away);
                    }
                }
            }
        }
    }, [
        balances,
        market.cancelled,
        market.finalResult,
        market.resolved,
        oddsOnCancellation?.away,
        oddsOnCancellation?.draw,
        oddsOnCancellation?.home,
    ]);

    // @ts-ignore
    const disabledDrawOption = !(market?.positions[Position.DRAW]?.sides[selectedSide]?.odd > 0);
    // @ts-ignore
    const disableddHomeOption = !(market?.positions[Position.HOME]?.sides[selectedSide]?.odd > 0);
    // @ts-ignore
    const disabledAwayOption = !(market?.positions[Position.AWAY]?.sides[selectedSide]?.odd > 0);

    const showDrawOdds = getVisibilityOfDrawOptionByTagId(market.tags);
    const gameCancelled = market.cancelled || (!market.gameStarted && market.resolved);
    const gameResolved = market.gameStarted && market.resolved;
    const pendingResolution = market.gameStarted && !market.resolved;
    const showPositions = !market.resolved && !market.cancelled && !market.gameStarted;

    const isApexTopGame = getIsApexTopGame(market.isApex, market.betType);

    const homeTeam = isApexTopGame ? t('common.yes') : market.homeTeam;
    const awayTeam = isApexTopGame ? t('common.no') : market.awayTeam;

    const showHomeTeamDiscount =
        !!availablePerSide?.positions[Position.HOME]?.buyImpactPrice &&
        isDiscounted(availablePerSide?.positions[Position.HOME]?.buyImpactPrice);
    const showDrawTeamDiscount =
        !!availablePerSide?.positions[Position.DRAW]?.buyImpactPrice &&
        isDiscounted(availablePerSide?.positions[Position.DRAW]?.buyImpactPrice);
    const showAwayTeamDiscount =
        !!availablePerSide?.positions[Position.AWAY]?.buyImpactPrice &&
        isDiscounted(availablePerSide?.positions[Position.AWAY]?.buyImpactPrice);

    const homePositionDiscount = showHomeTeamDiscount
        ? Math.ceil(Math.abs(Number(availablePerSide?.positions[Position.HOME]?.buyImpactPrice) * 100))
        : 0;
    const drawPositionDiscount = showDrawTeamDiscount
        ? Math.ceil(Math.abs(Number(availablePerSide?.positions[Position.DRAW]?.buyImpactPrice) * 100))
        : 0;
    const awayPositionDiscount = showAwayTeamDiscount
        ? Math.ceil(Math.abs(Number(availablePerSide?.positions[Position.AWAY]?.buyImpactPrice) * 100))
        : 0;

    const shareParlayData = useMemo(() => {
        return {
            markets: [
                {
                    ...convertMarketDataTypeToSportMarketInfoType(market),
                    homeOdds: sumOfTransactionPaidAmount / claimableAmount,
                    awayOdds: sumOfTransactionPaidAmount / claimableAmount,
                    drawOdds: sumOfTransactionPaidAmount / claimableAmount,
                    winning: claimable,
                    position: market.finalResult - 1,
                } as ParlaysMarket,
            ],
            totalQuote: sumOfTransactionPaidAmount / claimableAmount,
            paid: sumOfTransactionPaidAmount,
            payout: claimableAmount,
        };
    }, [market, sumOfTransactionPaidAmount, claimableAmount, claimable]);

    const claimReward = async () => {
        const { signer } = networkConnector;
        if (signer) {
            const contract = new ethers.Contract(market.address, sportsMarketContract.abi, signer);
            contract.connect(signer);
            const id = toast.loading(t('market.toast-message.transaction-pending'));
            try {
                const tx = await contract.exerciseOptions({
                    gasLimit: MAX_GAS_LIMIT,
                });
                const txResult = await tx.wait();

                if (txResult && txResult.transactionHash) {
                    setShowShareTicketModal(true);
                    toast.update(id, getSuccessToastOptions(t('market.toast-message.claim-winnings-success')));
                }
            } catch (e) {
                toast.update(id, getErrorToastOptions(t('common.errors.unknown-error-try-again')));
                console.log(e);
            }
        }
    };

    return (
        <>
            {gameCancelled && (
                <StatusContainer isCancelled={gameCancelled}>
                    <StatusLabel isCancelled={gameCancelled}>{t('markets.market-card.canceled')}</StatusLabel>
                </StatusContainer>
            )}
            {pendingResolution && (
                <StatusContainer isPendingResolve={pendingResolution}>
                    <StatusLabel isPendingResolve={pendingResolution}>
                        {t('markets.market-card.pending-resolution')}
                    </StatusLabel>
                </StatusContainer>
            )}
            {gameResolved && (
                <Wrapper>
                    <TeamOptionContainer isResolved={gameResolved}>
                        <PositionContainer>
                            <PositionSymbol
                                type={convertFinalResultToResultType(market.finalResult)}
                                symbolColor={ODDS_COLOR.HOME}
                                additionalText={{
                                    firstText: convertFinalResultToWinnerName(market.finalResult, market),
                                    firstTextStyle: {
                                        fontSize: isMobile ? '12px' : '19px',
                                        marginLeft: '15px',
                                        textTransform: 'uppercase',
                                    },
                                }}
                                glow={true}
                            />
                        </PositionContainer>
                        <ResultContainer style={{ width: '35%' }}>
                            <Label style={{ textTransform: 'uppercase' }}>{t('markets.market-card.result')}</Label>
                            <Value>{`${market.homeScore}${isApexTopGame ? '' : ` - ${market.awayScore}`}`}</Value>
                        </ResultContainer>
                        {claimable && (
                            <>
                                <ClaimableInfoContainer style={{ width: '35%' }}>
                                    <Label>{t('markets.market-card.claimable')}</Label>
                                    <Value>{formatCurrencyWithSign(USD_SIGN, claimableAmount, 2)}</Value>
                                </ClaimableInfoContainer>
                                <InnerContainer style={{ width: '15%' }}>
                                    <ClaimButton
                                        onClick={(e: any) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            claimReward();
                                        }}
                                        claimable={claimable}
                                    >
                                        {t('markets.market-card.claim')}
                                    </ClaimButton>
                                </InnerContainer>
                            </>
                        )}
                    </TeamOptionContainer>
                </Wrapper>
            )}
            {showPositions && (
                <Wrapper>
                    <TeamOptionContainer
                        disabled={disableddHomeOption}
                        selected={selectedPosition == Position.HOME}
                        onClick={!disableddHomeOption ? () => setSelectedPosition(Position.HOME) : undefined}
                    >
                        <PositionContainer>
                            <PositionSymbol
                                type={0}
                                hideSymbol={isApexTopGame}
                                symbolColor={ODDS_COLOR.HOME}
                                additionalText={{
                                    firstText: homeTeam,
                                    firstTextStyle: {
                                        fontSize: '19px',
                                        marginLeft: '15px',
                                        textTransform: 'uppercase',
                                    },
                                }}
                            />
                        </PositionContainer>
                        <InnerContainer>
                            <Label>{t('markets.market-details.odds')}</Label>
                            <Value>
                                {formatMarketOdds(
                                    selectedOddsType,
                                    market.positions[Position.HOME]?.sides[selectedSide]?.odd
                                )}
                            </Value>
                            <Discount visible={showHomeTeamDiscount}>
                                <Tooltip
                                    overlay={
                                        <span>
                                            {t(`markets.discounted-per`)}{' '}
                                            <a
                                                href="https://github.com/thales-markets/thales-improvement-proposals/blob/main/TIPs/TIP-95.md"
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                TIP-95
                                            </a>
                                        </span>
                                    }
                                    component={
                                        <div className="discount-label green">
                                            <span>-{homePositionDiscount}%</span>
                                        </div>
                                    }
                                    iconFontSize={23}
                                    marginLeft={2}
                                    top={0}
                                />
                            </Discount>
                        </InnerContainer>
                        <LiquidityInfoContainer>
                            <Label>{t('markets.market-details.liquidity')}</Label>
                            <Value>
                                {availablePerSide
                                    ? floorNumberToDecimals(availablePerSide.positions[Position.HOME].available)
                                    : '-'}
                            </Value>
                        </LiquidityInfoContainer>
                    </TeamOptionContainer>
                    {showDrawOdds && (
                        <TeamOptionContainer
                            disabled={disabledDrawOption}
                            selected={selectedPosition == Position.DRAW}
                            onClick={!disabledDrawOption ? () => setSelectedPosition(Position.DRAW) : undefined}
                        >
                            <PositionContainer>
                                <PositionSymbol
                                    type={2}
                                    symbolColor={ODDS_COLOR.DRAW}
                                    additionalText={{
                                        firstText: 'DRAW',
                                        firstTextStyle: {
                                            fontSize: '19px',
                                            marginLeft: '15px',
                                            textTransform: 'uppercase',
                                        },
                                    }}
                                />
                            </PositionContainer>
                            <InnerContainer>
                                <Label>{t('markets.market-details.odds')}</Label>
                                <Value>
                                    {formatMarketOdds(
                                        selectedOddsType,
                                        market.positions[Position.DRAW]?.sides[selectedSide]?.odd
                                    )}
                                </Value>
                                <Discount visible={showDrawTeamDiscount}>
                                    <Tooltip
                                        overlay={
                                            <span>
                                                {t(`markets.discounted-per`)}{' '}
                                                <a
                                                    href="https://github.com/thales-markets/thales-improvement-proposals/blob/main/TIPs/TIP-95.md"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    TIP-95
                                                </a>
                                            </span>
                                        }
                                        component={
                                            <div className="discount-label green">
                                                <span>-{drawPositionDiscount}%</span>
                                            </div>
                                        }
                                        iconFontSize={23}
                                        marginLeft={2}
                                        top={0}
                                    />
                                </Discount>
                            </InnerContainer>
                            <LiquidityInfoContainer>
                                <Label>{t('markets.market-details.liquidity')}</Label>
                                <Value>
                                    {availablePerSide
                                        ? floorNumberToDecimals(availablePerSide.positions[Position.DRAW].available)
                                        : '-'}
                                </Value>
                            </LiquidityInfoContainer>
                        </TeamOptionContainer>
                    )}
                    <TeamOptionContainer
                        disabled={disabledAwayOption}
                        selected={selectedPosition == Position.AWAY}
                        onClick={!disabledAwayOption ? () => setSelectedPosition(Position.AWAY) : undefined}
                    >
                        <PositionContainer>
                            <PositionSymbol
                                type={1}
                                hideSymbol={isApexTopGame}
                                symbolColor={ODDS_COLOR.AWAY}
                                additionalText={{
                                    firstText: awayTeam,
                                    firstTextStyle: {
                                        fontSize: '19px',
                                        marginLeft: '15px',
                                        textTransform: 'uppercase',
                                    },
                                }}
                            />
                        </PositionContainer>
                        <InnerContainer>
                            <Label>{t('markets.market-details.odds')}</Label>
                            <Value>
                                {formatMarketOdds(
                                    selectedOddsType,
                                    market.positions[Position.AWAY]?.sides[selectedSide]?.odd
                                )}
                            </Value>
                            <Discount visible={showAwayTeamDiscount}>
                                <Tooltip
                                    overlay={
                                        <span>
                                            {t(`markets.discounted-per`)}{' '}
                                            <a
                                                href="https://github.com/thales-markets/thales-improvement-proposals/blob/main/TIPs/TIP-95.md"
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                TIP-95
                                            </a>
                                        </span>
                                    }
                                    component={
                                        <div className="discount-label green">
                                            <span>-{awayPositionDiscount}%</span>
                                        </div>
                                    }
                                    iconFontSize={23}
                                    marginLeft={2}
                                    top={0}
                                />
                            </Discount>
                        </InnerContainer>
                        <LiquidityInfoContainer>
                            <Label>{t('markets.market-details.liquidity')}</Label>
                            <Value>
                                {availablePerSide
                                    ? floorNumberToDecimals(availablePerSide.positions[Position.AWAY].available)
                                    : '-'}
                            </Value>
                        </LiquidityInfoContainer>
                    </TeamOptionContainer>
                </Wrapper>
            )}
            {showShareTicketModal && (
                <ShareTicketModal
                    markets={shareParlayData.markets}
                    totalQuote={shareParlayData.totalQuote}
                    paid={Number(shareParlayData.paid)}
                    payout={shareParlayData.payout}
                    onClose={() => setShowShareTicketModal(false)}
                />
            )}
        </>
    );
};

export default Positions;
