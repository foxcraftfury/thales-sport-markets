import { ApexBetType, APEX_GAME_MIN_TAG, MarketStatus, OddsType } from 'constants/markets';
import { Position } from 'constants/options';
import { FIFA_WC_TAG, MLS_TAG, PERSON_COMPETITIONS, TAGS_OF_MARKETS_WITHOUT_DRAW_ODDS } from 'constants/tags';
import ordinal from 'ordinal';
import { AccountPositionProfile } from 'queries/markets/useAccountMarketsQuery';
import { AccountPosition, MarketData, MarketInfo, ParlayMarket, ParlaysMarket, SportMarketInfo } from 'types/markets';
import { addDaysToEnteredTimestamp } from './formatters/date';
import { formatCurrency } from './formatters/number';

const EXPIRE_SINGLE_SPORT_MARKET_PERIOD_IN_DAYS = 35;

export const getRoi = (ticketPrice: number, potentialWinnings: number, showRoi: boolean) =>
    showRoi ? (potentialWinnings - ticketPrice) / ticketPrice : 0;

export const isClaimAvailable = (accountPositions?: AccountPosition[]) => {
    let isClaimAvailable = false;
    accountPositions?.forEach((accountPosition) =>
        accountPosition.claimable && accountPosition.amount > 0 ? (isClaimAvailable = true) : ''
    );
    return isClaimAvailable;
};

export const getMarketStatus = (market: MarketInfo) => {
    if (market.isPaused) {
        return MarketStatus.Paused;
    } else {
        if (market.isResolved) {
            if (market.winningPosition === 0) {
                if (market.canUsersClaim || market.cancelledByCreator) {
                    return MarketStatus.CancelledConfirmed;
                } else {
                    return MarketStatus.CancelledPendingConfirmation;
                }
            } else {
                if (market.canUsersClaim) {
                    return MarketStatus.ResolvedConfirmed;
                } else {
                    return MarketStatus.ResolvedPendingConfirmation;
                }
            }
        } else {
            if (market.canMarketBeResolved) {
                return MarketStatus.ResolvePending;
            } else {
                return MarketStatus.Open;
            }
        }
    }
};

export const getMarketStatusFromMarketData = (market: MarketData) => {
    if (market.gameStarted && !market.resolved) return MarketStatus.ResolvePending;
    if (market.paused) return MarketStatus.Paused;
    if (market.resolved) return MarketStatus.ResolvedConfirmed;
    if (market.cancelled) return MarketStatus.CancelledConfirmed;
    return MarketStatus.Open;
};

export const isValidHttpsUrl = (text: string) => {
    let url;

    try {
        url = new URL(text);
    } catch (_) {
        return false;
    }

    return url.protocol === 'https:';
};

export const convertFinalResultToResultType = (result: number, isApexTopGame?: boolean) => {
    if (result == 1 && isApexTopGame) return 3;
    if (result == 2 && isApexTopGame) return 4;
    if (result == 1) return 0;
    if (result == 2) return 1;
    if (result == 3) return 2;
};

export const convertPositionToSymbolType = (position: Position, isApexTopGame: boolean) => {
    if (position == Position.HOME && isApexTopGame) return 3;
    if (position == Position.AWAY && isApexTopGame) return 4;
    if (position == Position.HOME) return 0;
    if (position == Position.AWAY) return 1;
    if (position == Position.DRAW) return 2;
};

export const formatMarketOdds = (oddsType: OddsType, odds: number | undefined) => {
    if (!odds) {
        return '0';
    }
    switch (oddsType) {
        case OddsType.Decimal:
            return `${formatCurrency(1 / odds, 2)}`;
        case OddsType.American:
            const decimal = 1 / odds;
            if (decimal >= 2) {
                return `+${formatCurrency((decimal - 1) * 100, 0)}`;
            } else {
                return `-${formatCurrency(100 / (decimal - 1), 0)}`;
            }
        case OddsType.AMM:
        default:
            return `${formatCurrency(odds, 2)}`;
    }
};

export const convertFinalResultToWinnerName = (result: number, market: MarketData) => {
    if (result == 1 && getIsApexTopGame(market.isApex, market.betType)) return 'YES';
    if (result == 1 && getIsApexTopGame(market.isApex, market.betType)) return 'NO';
    if (result == 1) return market.homeTeam;
    if (result == 2) return market.awayTeam;
    if (result == 3) return 'DRAW';
};

export const convertPositionToTeamName = (result: number, market: MarketData) => {
    if (result == 0 && getIsApexTopGame(market.isApex, market.betType)) return 'YES';
    if (result == 1 && getIsApexTopGame(market.isApex, market.betType)) return 'NO';
    if (result == 0) return market.homeTeam;
    if (result == 1) return market.awayTeam;
    if (result == 2) return 'DRAW';
};

export const convertPositionNameToPosition = (positionName: string) => {
    if (positionName?.toUpperCase() == 'HOME') return 0;
    if (positionName?.toUpperCase() == 'AWAY') return 1;
    if (positionName?.toUpperCase() == 'DRAW') return 2;
};

export const convertPositionNameToPositionType = (positionName: string) => {
    if (positionName?.toUpperCase() == 'HOME') return Position.HOME;
    if (positionName?.toUpperCase() == 'AWAY') return Position.AWAY;
    if (positionName?.toUpperCase() == 'DRAW') return Position.DRAW;
    return Position.HOME;
};

export const convertPositionToPositionName = (position: number): 'home' | 'away' | 'draw' => {
    if (position == 0) return 'home';
    if (position == 1) return 'away';
    if (position == 2) return 'draw';
    return 'home';
};

export const getCanceledGameClaimAmount = (position: AccountPositionProfile) => {
    const positionType = convertPositionNameToPositionType(position.side);

    if (positionType == Position.HOME) return formatCurrency(position.market.homeOdds * position.amount, 2);
    if (positionType == Position.AWAY) return formatCurrency(position.market.awayOdds * position.amount, 2);
    if (positionType == Position.DRAW)
        return position.market.drawOdds ? formatCurrency(position.market.drawOdds * position.amount, 2) : 0;
    return 0;
};

export const isApexGame = (tag: number) => tag >= APEX_GAME_MIN_TAG;

export const getScoreForApexGame = (resultDetails: string, defaultHomeScore: string, defaultAwayScore: string) => {
    if (resultDetails !== null && resultDetails.indexOf('/')) {
        const splittedResultDetails = resultDetails.split('/');
        let homeScore = splittedResultDetails[0];
        let awayScore = splittedResultDetails[1];
        if (!isNaN(parseInt(homeScore))) {
            homeScore = ordinal(Number(homeScore));
        }
        if (!isNaN(parseInt(awayScore))) {
            awayScore = ordinal(Number(awayScore));
        }
        return {
            homeScore,
            awayScore,
        };
    }

    return {
        homeScore: defaultHomeScore,
        awayScore: defaultAwayScore,
    };
};

export const appplyLogicForApexGame = (market: SportMarketInfo) => {
    // parse result and set score
    const score = getScoreForApexGame(market.resultDetails, market.homeScore.toString(), market.awayScore.toString());
    market.homeScore = score.homeScore;
    market.awayScore = score.awayScore;

    // show market as paused if there are no new odds for post qualifying phase
    market.isPaused =
        !!market.qualifyingStartTime &&
        market.qualifyingStartTime < new Date().getTime() &&
        market.maturityDate.getTime() > new Date().getTime() &&
        !market.arePostQualifyingOddsFetched;
    return market;
};

export const getIsApexTopGame = (isApex: boolean, betType: ApexBetType) =>
    isApex && (betType === ApexBetType.TOP3 || betType === ApexBetType.TOP5 || betType === ApexBetType.TOP10);

export const getPositionOdds = (market: ParlaysMarket) => {
    return market.position === Position.HOME
        ? market.homeOdds
        : market.position === Position.AWAY
        ? market.awayOdds
        : market.drawOdds
        ? market.drawOdds
        : 0;
};

export const getPositionOddsFromSportMarket = (market: SportMarketInfo, position: Position) => {
    return position === Position.HOME
        ? market.homeOdds
        : position === Position.AWAY
        ? market.awayOdds
        : market.drawOdds
        ? market.drawOdds
        : 0;
};

export const getVisibilityOfDrawOptionByTagId = (tags: Array<number>) => {
    const tag = tags.find((element) => TAGS_OF_MARKETS_WITHOUT_DRAW_ODDS.includes(element));
    if (tag) return false;
    return true;
};

export const isDiscounted = (priceImpact: number | undefined) => {
    if (priceImpact) {
        return Number(priceImpact) < 0;
    }
    return false;
};

export const isMlsGame = (tag: number) => Number(tag) === MLS_TAG;

export const isFifaWCGame = (tag: number) => Number(tag) === FIFA_WC_TAG;

export const getIsIndividualCompetition = (tag: number) => PERSON_COMPETITIONS.includes(tag);

export const isParlayClaimable = (parlayMarket: ParlayMarket) => {
    const resolvedMarkets = parlayMarket.sportMarkets.filter((market) => market?.isResolved);
    const claimablePositions = parlayMarket.positions.filter((position) => position.claimable);

    const lastGameStartsPlusExpirationPeriod = addDaysToEnteredTimestamp(
        EXPIRE_SINGLE_SPORT_MARKET_PERIOD_IN_DAYS,
        parlayMarket.lastGameStarts
    );

    if (lastGameStartsPlusExpirationPeriod < new Date().getTime()) {
        return false;
    }

    if (
        resolvedMarkets?.length == claimablePositions?.length &&
        resolvedMarkets?.length == parlayMarket.sportMarkets.length &&
        !parlayMarket.claimed
    ) {
        return true;
    }

    return false;
};

export const isParlayOpen = (parlayMarket: ParlayMarket) => {
    const resolvedMarkets = parlayMarket.sportMarkets.filter((market) => market?.isResolved);
    const resolvedAndClaimable = parlayMarket.positions.filter(
        (position) => position.claimable && position.market.isResolved
    );

    if (resolvedMarkets?.length == 0) return true;

    if (resolvedMarkets?.length !== resolvedAndClaimable?.length) return false;
    return true;
};

export const isSportMarketExpired = (sportMarket: SportMarketInfo) => {
    const maturyDatePlusExpirationPeriod = addDaysToEnteredTimestamp(
        EXPIRE_SINGLE_SPORT_MARKET_PERIOD_IN_DAYS,
        new Date(sportMarket.maturityDate).getTime()
    );

    if (maturyDatePlusExpirationPeriod < new Date().getTime()) {
        return true;
    }

    return false;
};

export const convertMarketDataTypeToSportMarketInfoType = (marketData: MarketData): SportMarketInfo => {
    return {
        id: marketData.address,
        address: marketData.address,
        maturityDate: new Date(marketData.maturityDate),
        tags: marketData.tags,
        isOpen: !marketData.resolved && !marketData.cancelled && !marketData.gameStarted ? true : false,
        isResolved: marketData.resolved,
        isCanceled: marketData.cancelled,
        finalResult: marketData.finalResult,
        poolSize: 0,
        numberOfParticipants: 0,
        homeTeam: marketData.homeTeam,
        awayTeam: marketData.awayTeam,
        homeOdds: marketData.positions[0].sides.BUY.odd ? marketData.positions[0].sides.BUY.odd : 0,
        awayOdds: marketData.positions[1].sides.BUY.odd ? marketData.positions[1].sides.BUY.odd : 0,
        drawOdds: marketData.positions[2].sides.BUY.odd,
        homeScore: marketData.homeScore ? marketData.homeScore : 0,
        awayScore: marketData.awayScore ? marketData.awayScore : 0,
        sport: '',
        isApex: marketData.isApex,
        resultDetails: '',
        isPaused: marketData.paused,
        arePostQualifyingOddsFetched: false,
        betType: marketData.betType,
        homePriceImpact: 0,
        awayPriceImpact: 0,
    };
};
