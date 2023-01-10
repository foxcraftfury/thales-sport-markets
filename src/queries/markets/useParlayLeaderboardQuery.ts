import QUERY_KEYS from 'constants/queryKeys';
import { useQuery, UseQueryOptions } from 'react-query';
import { ParlayMarket, ParlayMarketWithRank } from 'types/markets';
import { NetworkId } from 'types/network';
import thalesData from 'thales-data';
import { fixApexName, fixDuplicatedTeamName, fixLongTeamNameString } from 'utils/formatters/string';
import { subMilliseconds } from 'date-fns';
import { PARLAY_LEADERBOARD_MINIMUM_GAMES, PARLAY_LEADERBOARD_START_DATE_UTC } from 'constants/markets';
import { addMonthsToUTCDate } from 'utils/formatters/date';
import { uniqBy } from 'lodash';
import { convertFinalResultToResultType, convertPositionNameToPosition } from 'utils/markets';

const MAXIMUM_QUOTE = 0.033;
const MAXIMUM_QUOTE_PERIOD_ZERO = 0.05;

const sortByTotalQuote = (a: ParlayMarket, b: ParlayMarket) => {
    let firstQuote = 1;
    a.marketQuotes.map((quote) => {
        firstQuote = firstQuote * quote;
    });

    let secondQuote = 1;
    b.marketQuotes.map((quote) => {
        secondQuote = secondQuote * quote;
    });
    return firstQuote - secondQuote;
};

export const useParlayLeaderboardQuery = (
    networkId: NetworkId,
    period: number,
    options?: UseQueryOptions<ParlayMarketWithRank[]>
) => {
    return useQuery<ParlayMarketWithRank[]>(
        QUERY_KEYS.ParlayLeaderboard(networkId, period),
        async () => {
            try {
                const startPeriod = Math.trunc(
                    addMonthsToUTCDate(PARLAY_LEADERBOARD_START_DATE_UTC, period).getTime() / 1000
                );
                const endPeriod = Math.trunc(
                    subMilliseconds(addMonthsToUTCDate(PARLAY_LEADERBOARD_START_DATE_UTC, period + 1), 1).getTime() /
                        1000
                );

                let parlayMarkets = await thalesData.sportMarkets.parlayMarkets({
                    network: networkId,
                    startPeriod,
                    endPeriod,
                });

                if (period === 1) {
                    const startPreviousPeriod = Math.trunc(PARLAY_LEADERBOARD_START_DATE_UTC.getTime() / 1000);
                    const endPreviousPeriod = Math.trunc(
                        subMilliseconds(addMonthsToUTCDate(PARLAY_LEADERBOARD_START_DATE_UTC, 1), 1).getTime() / 1000
                    );

                    const parlayMarketsPreviosPeriod = await thalesData.sportMarkets.parlayMarkets({
                        network: networkId,
                        startPeriod: startPreviousPeriod,
                        endPeriod: endPreviousPeriod,
                    });

                    const parlayMarketsPreviosPeriodModified = parlayMarketsPreviosPeriod.filter(
                        (market: ParlayMarket) =>
                            market.totalQuote < MAXIMUM_QUOTE_PERIOD_ZERO ||
                            market.sportMarkets.length > PARLAY_LEADERBOARD_MINIMUM_GAMES
                    );

                    parlayMarkets = uniqBy([...parlayMarkets, ...parlayMarketsPreviosPeriodModified], 'id');
                }

                const parlayMarketsModified = parlayMarkets
                    .filter(
                        (market: ParlayMarket) =>
                            (period > 0 ||
                                (period === 0 &&
                                    market.totalQuote >= MAXIMUM_QUOTE_PERIOD_ZERO &&
                                    market.sportMarkets.length <= PARLAY_LEADERBOARD_MINIMUM_GAMES)) &&
                            market.positions.every(
                                (position) =>
                                    convertPositionNameToPosition(position.side) ===
                                        convertFinalResultToResultType(position.market.finalResult) ||
                                    position.market.isCanceled
                            )
                    )
                    .map((parlayMarket: ParlayMarket) => {
                        let totalQuote = parlayMarket.totalQuote;
                        let totalAmount = parlayMarket.totalAmount;
                        let numberOfPositions = parlayMarket.sportMarkets.length;
                        const sportMarkets = parlayMarket.sportMarkets.map((market) => {
                            if (market.isCanceled) {
                                let realQuote = 1;
                                parlayMarket.marketQuotes.map((quote) => {
                                    realQuote = realQuote * quote;
                                });

                                const marketIndex = parlayMarket.sportMarketsFromContract.findIndex(
                                    (sportMarketFromContract) => sportMarketFromContract === market.address
                                );
                                if (marketIndex > -1) {
                                    realQuote = realQuote / parlayMarket.marketQuotes[marketIndex];
                                    const maximumQuote = period === 0 ? MAXIMUM_QUOTE_PERIOD_ZERO : MAXIMUM_QUOTE;
                                    totalQuote = realQuote < maximumQuote ? maximumQuote : realQuote;
                                    numberOfPositions = numberOfPositions - 1;
                                    totalAmount = totalAmount * parlayMarket.marketQuotes[marketIndex];
                                }
                            }

                            return {
                                ...market,
                                homeTeam: market.isApex
                                    ? fixApexName(market.homeTeam)
                                    : fixLongTeamNameString(fixDuplicatedTeamName(market.homeTeam)),
                                awayTeam: market.isApex
                                    ? fixApexName(market.awayTeam)
                                    : fixLongTeamNameString(fixDuplicatedTeamName(market.awayTeam)),
                            };
                        });

                        return {
                            ...parlayMarket,
                            totalQuote,
                            totalAmount,
                            numberOfPositions,
                            sportMarkets,
                        };
                    })
                    .sort((a: ParlayMarketWithRank, b: ParlayMarketWithRank) =>
                        a.numberOfPositions !== b.numberOfPositions
                            ? b.numberOfPositions - a.numberOfPositions
                            : a.totalQuote !== b.totalQuote
                            ? a.totalQuote - b.totalQuote
                            : a.sUSDPaid !== b.sUSDPaid
                            ? b.sUSDPaid - a.sUSDPaid
                            : sortByTotalQuote(a, b)
                    )
                    .map((parlayMarket: ParlayMarketWithRank, index: number) => {
                        return {
                            ...parlayMarket,
                            rank: index + 1,
                        };
                    });
                return parlayMarketsModified;
            } catch (e) {
                console.log('E ', e);
                return [];
            }
        },
        {
            ...options,
        }
    );
};
