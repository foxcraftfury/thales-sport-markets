import React, { useEffect, useState } from 'react';
import { AccountPosition, SportMarketInfo } from 'types/markets';
import { formatDateWithTime } from 'utils/formatters/date';
import { getOnImageError, getTeamImageSource } from 'utils/images';
import { isClaimAvailable } from 'utils/markets';
import MatchStatus from './components/MatchStatus';
import Odds from './components/Odds';
import { ClubContainer, ClubLogo, ClubNameLabel, ClubVsClubContainer, Container, VSLabel } from './styled-components';

type MarketRowCardProps = {
    market: SportMarketInfo;
    accountPositions?: AccountPosition[];
};

const MarketListCard: React.FC<MarketRowCardProps> = ({ market, accountPositions }) => {
    const claimAvailable = isClaimAvailable(accountPositions);

    const [homeLogoSrc, setHomeLogoSrc] = useState(getTeamImageSource(market.homeTeam, market.tags[0]));
    const [awayLogoSrc, setAwayLogoSrc] = useState(getTeamImageSource(market.awayTeam, market.tags[0]));

    useEffect(() => {
        setHomeLogoSrc(getTeamImageSource(market.homeTeam, market.tags[0]));
        setAwayLogoSrc(getTeamImageSource(market.awayTeam, market.tags[0]));
    }, [market.homeTeam, market.awayTeam]);

    return (
        <Container claimBorder={claimAvailable} isCanceled={market.isCanceled} isResolved={market.isResolved}>
            <ClubVsClubContainer>
                <ClubContainer>
                    <ClubLogo
                        alt="Home team logo"
                        src={homeLogoSrc}
                        onError={getOnImageError(setHomeLogoSrc, market.tags[0])}
                    />
                    <ClubNameLabel>{market.homeTeam}</ClubNameLabel>
                </ClubContainer>
                <VSLabel>{'VS'}</VSLabel>
                <ClubContainer>
                    <ClubLogo
                        alt="Away team logo"
                        src={awayLogoSrc}
                        onError={getOnImageError(setAwayLogoSrc, market.tags[0])}
                    />
                    <ClubNameLabel>{market.awayTeam}</ClubNameLabel>
                </ClubContainer>
            </ClubVsClubContainer>
            <Odds
                isResolved={market.isResolved}
                finalResult={market.finalResult}
                isLive={market.maturityDate < new Date()}
                isCancelled={market.isCanceled}
                odds={{
                    homeOdds: market.homeOdds,
                    awayOdds: market.awayOdds,
                    drawOdds: market.drawOdds,
                }}
                accountPositions={accountPositions}
            />
            <MatchStatus
                isResolved={market.isResolved}
                isLive={market.maturityDate < new Date()}
                isCanceled={market.isCanceled}
                isClaimable={claimAvailable}
                result={`${market.homeScore}:${market.awayScore}`}
                startsAt={formatDateWithTime(market.maturityDate)}
            />
        </Container>
    );
};

export default MarketListCard;
