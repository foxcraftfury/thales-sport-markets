import background from 'assets/images/march-madness/background-marchmadness.svg';
import backgrounBall from 'assets/images/march-madness/background-marchmadness-ball.png';
import {
    userSampleBracketsData,
    resultSampleBracketsData,
    wildCardTeams,
    initialBracketsData,
} from 'utils/marchMadness';
import React, { CSSProperties, useEffect, useState } from 'react';
import styled from 'styled-components';
import Match from '../Match';
import { BracketMatch, ResultMatch } from 'types/marchMadness';
import { useTranslation } from 'react-i18next';
import WildCardMatch from '../WildCardMatch';
import { getNetworkId } from 'redux/modules/wallet';
import { RootState } from 'redux/rootReducer';
import { useSelector } from 'react-redux';
import localStore from 'utils/localStore';
import { LOCAL_STORAGE_KEYS } from 'constants/storage';
import Button from 'components/Button';

const Brackets: React.FC = () => {
    const { t } = useTranslation();

    const networkId = useSelector((state: RootState) => getNetworkId(state));

    const [bracketsData, setBracketsData] = useState(userSampleBracketsData); // TODO: switch to initial if not on contract
    const [isBracketSubmitted, setIsBracketSubmitted] = useState(false); // TODO: fetch from contract

    const results: ResultMatch[] = [...resultSampleBracketsData]; // TODO: fetch from contract

    const isBracketsLocked = false; // TODO: fetch from contract

    useEffect(() => {
        if (!isBracketsLocked && !isBracketSubmitted) {
            const lsBrackets = localStore.get(LOCAL_STORAGE_KEYS.BRACKETS + networkId);
            setBracketsData(lsBrackets !== undefined ? (lsBrackets as BracketMatch[]) : initialBracketsData);
        }
    }, [networkId, isBracketsLocked, isBracketSubmitted]);

    const isTeamLostInPreviousRounds = (teamId: number | undefined) => {
        if (teamId === undefined) {
            return false;
        }
        const teamLost = results.find(
            (result) =>
                (result.homeTeamId === teamId && result.isHomeTeamWon === false) ||
                (result.awayTeamId === teamId && result.isHomeTeamWon === true)
        );

        return !!teamLost;
    };

    const updateBracketsByMatch = (id: number, isHomeTeamSelected: boolean) => {
        // update current match - only one
        let updatedMatch: BracketMatch | undefined = undefined;
        const updatedMatches = bracketsData.map((match) => {
            if (match.id === id) {
                updatedMatch = { ...match, isHomeTeamSelected };
                return updatedMatch;
            }
            return match;
        });

        // populate first child match always - only one child
        let firstChildMatchId: number | undefined = undefined;
        let previousTeamId: number | undefined = undefined;
        let newTeamId: number | undefined = undefined;
        const updatedChildMatches = updatedMatches.map((match) => {
            if (match.homeTeamParentMatchId === updatedMatch?.id) {
                // home team in child match
                firstChildMatchId = match.id;
                previousTeamId = match.homeTeamId;
                newTeamId = updatedMatch?.isHomeTeamSelected ? updatedMatch.homeTeamId : updatedMatch?.awayTeamId;
                return {
                    ...match,
                    homeTeamId: newTeamId,
                };
            }
            if (match.awayTeamParentMatchId === updatedMatch?.id) {
                // away team in child match
                firstChildMatchId = match.id;
                previousTeamId = match.awayTeamId;
                newTeamId = updatedMatch?.isHomeTeamSelected ? updatedMatch.homeTeamId : updatedMatch?.awayTeamId;
                return {
                    ...match,
                    awayTeamId: newTeamId,
                };
            }
            return match;
        });

        // update all children of first child which have previous team
        const childrenMatchesIds: number[] = [];
        let currentChildMatch = updatedChildMatches.find(
            (match) =>
                match.homeTeamParentMatchId === firstChildMatchId || match.awayTeamParentMatchId === firstChildMatchId
        );
        while (currentChildMatch) {
            childrenMatchesIds.push(currentChildMatch.id);
            const newParentMatchId = currentChildMatch.id;
            currentChildMatch = updatedChildMatches.find(
                (match) =>
                    match.homeTeamParentMatchId === newParentMatchId || match.awayTeamParentMatchId === newParentMatchId
            );
        }
        const updatedChildrenMatches = updatedChildMatches.map((match) => {
            if (childrenMatchesIds.includes(match.id)) {
                if (match.homeTeamId !== undefined && match.homeTeamId === previousTeamId) {
                    return {
                        ...match,
                        homeTeamId: newTeamId,
                    };
                } else if (match.awayTeamId !== undefined && match.awayTeamId === previousTeamId) {
                    return {
                        ...match,
                        awayTeamId: newTeamId,
                    };
                }
                return match;
            }
            return match;
        });

        localStore.set(LOCAL_STORAGE_KEYS.BRACKETS + networkId, updatedChildrenMatches);

        setBracketsData(updatedChildrenMatches);
    };

    const getMatchesPerIdRange = (fromId: number, toId: number) => {
        return bracketsData.map((match) => {
            if (match.id >= fromId && match.id <= toId) {
                const isFirstRound = fromId < 32;
                const isSecondRound = fromId >= 32 && toId < 48;
                const isSecondRoundLowerHalf = [36, 44].includes(match.id);
                const isSweet16 = fromId >= 48 && toId < 56;
                const isSweet16LowerHalf = [50, 54].includes(match.id);

                const margin = isFirstRound
                    ? match.id === fromId
                        ? '0'
                        : `${FIRST_ROUND_MATCH_GAP}px 0 0 0`
                    : isSecondRound
                    ? match.id === fromId // first match in round by quarter
                        ? isSecondRoundLowerHalf
                            ? '51px 0 0 0'
                            : `${FIRST_ROUND_MATCH_GAP + 1}px 0 0 0`
                        : `${SECOND_ROUND_MATCH_GAP}px 0 0 0`
                    : isSweet16
                    ? match.id === fromId // first match in round by quarter
                        ? isSweet16LowerHalf
                            ? '111px 0 0 0'
                            : `${SECOND_ROUND_MATCH_GAP + 1}px 0 0 0`
                        : `${SWEET16_ROUND_MATCH_GAP}px 0 0 0`
                    : '';
                return (
                    <Match
                        key={match.id}
                        matchData={match}
                        resultData={results[match.id]}
                        isBracketsLocked={isBracketsLocked}
                        isTeamLostInPreviousRounds={isTeamLostInPreviousRounds}
                        updateBrackets={updateBracketsByMatch}
                        height={MATCH_HEIGHT}
                        margin={margin}
                    ></Match>
                );
            }
        });
    };

    const getMatchById = (id: number) => {
        const isElite8UpperHalf = [56, 58].includes(id);
        const isElite8LowerHalf = [57, 59].includes(id);
        const isSemiFinalLeft = id === 60;
        const isSemiFinalRight = id === 61;
        const isFinal = id === 62;

        const margin = isElite8UpperHalf
            ? `${SWEET16_ROUND_MATCH_GAP + 1}px 0 0 0`
            : isElite8LowerHalf
            ? '231px 0 0 0'
            : isSemiFinalLeft
            ? '-7px 25px 0 0'
            : isSemiFinalRight
            ? '-7px 0 0 25px'
            : isFinal
            ? '24px 0 0 0'
            : '';

        return (
            <Match
                matchData={bracketsData.find((match) => match.id === id) || bracketsData[id]}
                resultData={results[id]}
                isBracketsLocked={isBracketsLocked}
                isTeamLostInPreviousRounds={isTeamLostInPreviousRounds}
                updateBrackets={updateBracketsByMatch}
                height={MATCH_HEIGHT}
                margin={margin}
            ></Match>
        );
    };

    const isSubmitDisabled = bracketsData.find((match) => match.isHomeTeamSelected === undefined) !== undefined;

    const handleSubmit = () => {
        // TODO
        console.log('clicked submit');
        setIsBracketSubmitted(true);
    };

    return (
        <Container>
            <RowHeader marginBottom={0}>
                <MyStats></MyStats>
                <MyTotalScore></MyTotalScore>
            </RowHeader>
            <BracketsWrapper>
                <RowHeader marginBottom={6}>
                    <RoundName>{'1st Round'}</RoundName>
                    <RoundName>{'2nd Round'}</RoundName>
                    <RoundName>{'Sweet 16'}</RoundName>
                    <RoundName>{'Elite 8'}</RoundName>
                    <RoundName>{'Final 4'}</RoundName>
                    <RoundName>{'Elite 8'}</RoundName>
                    <RoundName>{'Sweet 16'}</RoundName>
                    <RoundName>{'2nd Round'}</RoundName>
                    <RoundName>{'1st Round'}</RoundName>
                </RowHeader>
                <RowHalf>
                    <Region isSideLeft={true} isVertical={true}>
                        {t('march-madness.regions.east')}
                    </Region>
                    <LeftQuarter>
                        <FirstRound>{getMatchesPerIdRange(0, 7)}</FirstRound>
                        <SecondRound isSideLeft={true}>{getMatchesPerIdRange(32, 35)}</SecondRound>
                        <Sweet16 isSideLeft={true}>{getMatchesPerIdRange(48, 49)}</Sweet16>
                        <Elite8 isSideLeft={true}>{getMatchById(56)}</Elite8>
                    </LeftQuarter>
                    <RightQuarter>
                        <Elite8 isSideLeft={false}>{getMatchById(58)}</Elite8>
                        <Sweet16 isSideLeft={false}>{getMatchesPerIdRange(52, 53)}</Sweet16>
                        <SecondRound isSideLeft={false}>{getMatchesPerIdRange(40, 43)}</SecondRound>
                        <FirstRound>{getMatchesPerIdRange(16, 23)}</FirstRound>
                    </RightQuarter>
                    <Region isSideLeft={false} isVertical={true}>
                        {t('march-madness.regions.south')}
                    </Region>
                </RowHalf>
                <SemiFinals>
                    {getMatchById(60)}
                    {getMatchById(61)}
                </SemiFinals>
                <Final>
                    <>{getMatchById(62)}</>
                </Final>
                {!isBracketsLocked && (
                    <SubmitWrapper>
                        <Button style={submitButtonStyle} disabled={isSubmitDisabled} onClick={handleSubmit}>
                            {isBracketSubmitted
                                ? t('march-madness.brackets.submit-modify')
                                : t('march-madness.brackets.submit')}
                        </Button>
                    </SubmitWrapper>
                )}
                <RowHalf>
                    <Region isSideLeft={true} isVertical={true}>
                        {t('march-madness.regions.west')}
                    </Region>
                    <LeftQuarter>
                        <FirstRound>{getMatchesPerIdRange(8, 15)}</FirstRound>
                        <SecondRound isSideLeft={true}>{getMatchesPerIdRange(36, 39)}</SecondRound>
                        <Sweet16 isSideLeft={true}>{getMatchesPerIdRange(50, 51)}</Sweet16>
                        <Elite8 isSideLeft={true}>{getMatchById(57)}</Elite8>
                    </LeftQuarter>
                    <RightQuarter>
                        <Elite8 isSideLeft={false}>{getMatchById(59)}</Elite8>
                        <Sweet16 isSideLeft={false}>{getMatchesPerIdRange(54, 55)}</Sweet16>
                        <SecondRound isSideLeft={false}>{getMatchesPerIdRange(44, 47)}</SecondRound>
                        <FirstRound>{getMatchesPerIdRange(24, 31)}</FirstRound>
                    </RightQuarter>
                    <Region isSideLeft={false} isVertical={true}>
                        {t('march-madness.regions.midwest')}
                    </Region>
                </RowHalf>
            </BracketsWrapper>
            <WildCardsContainer>
                <WildCardsHeader>{'Wild Cards'}</WildCardsHeader>
                <WildCardsRow>
                    <Region isSideLeft={true} isVertical={false}>
                        {t('march-madness.regions.east')}
                    </Region>
                    <WildCardMatch
                        homeTeam={wildCardTeams[0].displayName}
                        awayTeam={wildCardTeams[1].displayName}
                        margin="0 2px 0 0"
                    />
                    <WildCardMatch homeTeam={wildCardTeams[4].displayName} awayTeam={wildCardTeams[5].displayName} />
                    <Region isSideLeft={false} isVertical={false}>
                        {t('march-madness.regions.south')}
                    </Region>
                </WildCardsRow>
                <WildCardsRow>
                    <Region isSideLeft={true} isVertical={false}>
                        {t('march-madness.regions.west')}
                    </Region>
                    <WildCardMatch
                        homeTeam={wildCardTeams[2].displayName}
                        awayTeam={wildCardTeams[3].displayName}
                        margin="0 2px 0 0"
                    />
                    <WildCardMatch homeTeam={wildCardTeams[6].displayName} awayTeam={wildCardTeams[7].displayName} />
                    <Region isSideLeft={false} isVertical={false}>
                        {t('march-madness.regions.midwest')}
                    </Region>
                </WildCardsRow>
            </WildCardsContainer>
        </Container>
    );
};

const MATCH_HEIGHT = 52;
const FIRST_ROUND_MATCH_GAP = 8;
const SECOND_ROUND_MATCH_GAP = 1 * (MATCH_HEIGHT + FIRST_ROUND_MATCH_GAP) + FIRST_ROUND_MATCH_GAP;
const SWEET16_ROUND_MATCH_GAP = 3 * (MATCH_HEIGHT + FIRST_ROUND_MATCH_GAP) + FIRST_ROUND_MATCH_GAP;

const Container = styled.div`
    overflow: auto;
    padding-bottom: 20px;
    ::-webkit-scrollbar {
        height: 10px;
    }
`;

const BracketsWrapper = styled.div`
    width: 1350px;
    height: 982px;
    background-image: url('${background}'), url('${backgrounBall}');
    background-size: auto;
    background-position: 0 71px, -354px -162px;
    background-repeat: no-repeat;
`;

const RowHalf = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
`;

const LeftQuarter = styled.div`
    display: flex;
`;

const RightQuarter = styled.div`
    display: flex;
    margin-left: 208px;
`;

const FirstRound = styled.div`
    display: flex;
    flex-direction: column;
    z-index: 40;
`;

const SecondRound = styled.div<{ isSideLeft: boolean }>`
    display: flex;
    flex-direction: column;
    ${(props) => `${props.isSideLeft ? 'margin-left: ' : 'margin-right: '}15px;`}
    z-index: 30;
`;

const Sweet16 = styled.div<{ isSideLeft: boolean }>`
    display: flex;
    flex-direction: column;
    ${(props) => `${props.isSideLeft ? 'margin-left: ' : 'margin-right: '}-24px;`}
    z-index: 20;
`;

const Elite8 = styled.div<{ isSideLeft: boolean }>`
    display: flex;
    flex-direction: column;
    ${(props) => `${props.isSideLeft ? 'margin-left: ' : 'margin-right: '}-37px;`}
    z-index: 10;
`;

const SemiFinals = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: 38px;
`;

const Final = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: 0;
`;

const SubmitWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: 0;
`;

const submitButtonStyle: CSSProperties = {
    fontSize: '14px',
    fontFamily: "'NCAA' !important",
    textTransform: 'uppercase',
    background: '#FFFFFF',
    border: '2px solid #005EB8',
    borderRadius: '4px',
    color: '#021631',
    width: '142px',
    marginTop: '82px',
};

const Region = styled.div<{ isSideLeft: boolean; isVertical: boolean }>`
    width: ${(props) => (props.isVertical ? '30px' : '81px')};
    height: ${(props) => (props.isVertical ? '472px' : '52px')};
    background: #0e94cb;
    ${(props) => `${props.isSideLeft ? 'margin-right: ' : 'margin-left: '}${props.isVertical ? '5' : '1'}`}px;
    ${(props) => (props.isVertical ? 'writing-mode: vertical-rl;' : '')}
    ${(props) => (props.isVertical ? 'text-orientation: upright;' : '')}
    text-align: justify;
    justify-content: center;
    display: flex;
    align-items: center;
    font-family: 'NCAA' !important;
    font-style: normal;
    font-weight: 400;
    font-size: ${(props) => (props.isVertical ? '30px' : '20px')};
    color: #ffffff;
    letter-spacing: ${(props) => (props.isVertical ? '15px' : '2px')};
}
`;

const RowHeader = styled.div<{ marginBottom: number }>`
    width: 1252px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin: ${(props) => `0 49px ${props.marginBottom}px 49px`};
`;

const RoundName = styled.div`
    width: 129px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 94, 184, 0.4);
    font-family: 'Oswald' !important;
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
    line-height: 14px;
    text-align: center;
    text-transform: uppercase;
    color: #ffffff;
    margin-top: 14px;
`;

const MyStats = styled.div`
    width: 312px;
    height: 80px;
    background: #c12b34;
    border: 1px solid #c12b34;
`;
const MyTotalScore = styled.div`
    width: 930px;
    height: 80px;
    background: #021631;
    border: 1px solid #0e94cb;
`;

const WildCardsContainer = styled.div`
    width: 1350px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: -10px;
`;

const WildCardsHeader = styled.div`
    width: 436px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid #0e94cb;
    margin-bottom: 6px;
    font-family: 'NCAA' !important;
    font-style: normal;
    font-weight: 400;
    font-size: 20px;
    line-height: 23px;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: #ffffff;
`;

const WildCardsRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-bottom: 5px;
`;

export default Brackets;
