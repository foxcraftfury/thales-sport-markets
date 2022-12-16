import Tooltip from 'components/Tooltip';
import { Position } from 'constants/options';
import { BetType } from 'constants/tags';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { getParlay, removeFromParlay, updateParlay } from 'redux/modules/parlay';
import { getOddsType } from 'redux/modules/ui';
import { AvailablePerPosition, MarketData, ParlaysMarketPosition } from 'types/markets';
import { isDiscounted, formatMarketOdds, getSymbolText, convertFinalResultToResultType } from 'utils/markets';
import { Discount, Container, Value } from './styled-components';

type PositionDetailsProps = {
    market: MarketData;
    odd?: number;
    availablePerPosition: AvailablePerPosition;
    position: Position;
};

const PositionDetails: React.FC<PositionDetailsProps> = ({ market, odd, availablePerPosition, position }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    // Redux states
    const selectedOddsType = useSelector(getOddsType);

    const parlay = useSelector(getParlay);
    const addedToParlay = parlay.filter((game: any) => game.sportMarketAddress == market.address)[0];
    // ------------

    const isGameCancelled = market.cancelled || (!market.gameStarted && market.resolved);
    const isGameResolved = market.gameStarted && market.resolved;
    const isGamePaused = market.paused && !isGameResolved && !isGameCancelled;
    const isGameOpen = !market.resolved && !market.cancelled && !market.paused && !market.gameStarted;

    const showDiscount =
        isGameOpen && !!availablePerPosition.buyImpactPrice && isDiscounted(availablePerPosition.buyImpactPrice);
    const positionDiscount = showDiscount ? Math.ceil(Math.abs(Number(availablePerPosition.buyImpactPrice) * 100)) : 0;

    const disabledPosition = !(odd || 0 > 0) || !isGameOpen;

    return (
        <Container
            disabled={disabledPosition}
            selected={addedToParlay && addedToParlay.position == position}
            isWinner={isGameResolved && convertFinalResultToResultType(market.finalResult) == position}
            onClick={() => {
                if (!disabledPosition) {
                    if (addedToParlay && addedToParlay.position == position) {
                        dispatch(removeFromParlay(market.address));
                    } else {
                        const parlayMarket: ParlaysMarketPosition = {
                            parentMarket: market.parentMarket !== '' ? market.parentMarket : market.address,
                            sportMarketAddress: market.address,
                            position: position,
                            homeTeam: market.homeTeam || '',
                            awayTeam: market.awayTeam || '',
                        };
                        dispatch(updateParlay(parlayMarket));
                    }
                }
            }}
        >
            <Value>
                {getSymbolText(position, market.betType)}
                {market.betType == BetType.SPREAD && ` (${market.spread})`}
                {market.betType == BetType.TOTAL && ` (${market.total})`}
            </Value>
            {!isGameResolved && (
                <Value>
                    {isGameCancelled
                        ? `- ${t('markets.market-card.canceled')} -`
                        : isGamePaused
                        ? `- ${t('markets.market-card.paused')} -`
                        : formatMarketOdds(selectedOddsType, odd)}
                </Value>
            )}
            {showDiscount && (
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
                        <Discount>
                            <span>+{positionDiscount}%</span>
                        </Discount>
                    }
                    iconFontSize={23}
                    marginLeft={2}
                    top={0}
                />
            )}
        </Container>
    );
};

export default PositionDetails;
