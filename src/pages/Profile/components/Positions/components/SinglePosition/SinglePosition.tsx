import React, { useEffect, useMemo, useState } from 'react';

import { AccountPositionProfile } from 'queries/markets/useAccountMarketsQuery';
import { ClubLogo, ClubName } from '../ParlayPosition/components/ParlayItem/styled-components';
import { getOnImageError, getTeamImageSource } from 'utils/images';
import {
    BoldValue,
    ClaimInfoContainer,
    ColumnDirectionInfo,
    GameParticipantsWrapper,
    PositionContainer,
    ResultContainer,
    TeamContainer,
    Wrapper,
} from './styled-components';
import {
    ClaimContainer,
    ClaimLabel,
    ClaimValue,
    ExternalLink,
    ExternalLinkArrow,
    ExternalLinkContainer,
    Label,
} from '../ParlayPosition/styled-components';
import { useTranslation } from 'react-i18next';
import { USD_SIGN } from 'constants/currency';
import { formatCurrencyWithSign } from 'utils/formatters/number';
import { ClaimButton } from 'pages/Markets/Market/MarketDetailsV2/components/Positions/styled-components';
import networkConnector from 'utils/networkConnector';
import { getErrorToastOptions, getSuccessToastOptions } from 'config/toast';
import { ethers } from 'ethers';
import sportsMarketContract from 'utils/contracts/sportsMarketContract';
import { toast } from 'react-toastify';
import PositionSymbol from 'components/PositionSymbol';
import {
    convertPositionNameToPosition,
    convertPositionNameToPositionType,
    convertPositionToSymbolType,
    getCanceledGameClaimAmount,
    getIsApexTopGame,
} from 'utils/markets';
import { getPositionColor } from 'utils/ui';
import { formatDateWithTime } from 'utils/formatters/date';
import { useSelector } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { getIsWalletConnected, getNetworkId, getWalletAddress } from 'redux/modules/wallet';
import { getIsMobile } from 'redux/modules/app';
import { FlexDivRow } from 'styles/common';
import { refetchAfterClaim } from 'utils/queryConnector';
import { buildMarketLink } from 'utils/routes';
import i18n from 'i18n';
import { MAX_GAS_LIMIT } from 'constants/network';
import ShareTicketModal from 'pages/Markets/Home/Parlay/components/ShareTicketModal';
import useMarketTransactionsQuery from 'queries/markets/useMarketTransactionsQuery';
import { ParlaysMarket } from 'types/markets';

const SinglePosition: React.FC<{ position: AccountPositionProfile }> = ({ position }) => {
    const language = i18n.language;
    const { t } = useTranslation();
    const networkId = useSelector((state: RootState) => getNetworkId(state));
    const isMobile = useSelector((state: RootState) => getIsMobile(state));
    const walletAddress = useSelector((state: RootState) => getWalletAddress(state)) || '';
    const isWalletConnect = useSelector((state: RootState) => getIsWalletConnected(state));

    const [homeLogoSrc, setHomeLogoSrc] = useState(
        getTeamImageSource(position.market.homeTeam, position.market.tags[0])
    );
    const [awayLogoSrc, setAwayLogoSrc] = useState(
        getTeamImageSource(position.market.awayTeam, position.market.tags[0])
    );

    const [showShareTicketModal, setShowShareTicketModal] = useState(false);

    const marketTransactionsQuery = useMarketTransactionsQuery(position.market.address, networkId, position.account, {
        enabled: isWalletConnect,
    });

    const sumOfTransactionPaidAmount = useMemo(() => {
        let sum = 0;

        if (marketTransactionsQuery.data) {
            marketTransactionsQuery.data.forEach((transaction) => {
                if (transaction.position == position.market.finalResult - 1) {
                    if (transaction.type == 'sell') sum -= transaction.paid;
                    if (transaction.type == 'buy') sum += transaction.paid;
                }
            });
        }

        return sum;
    }, [marketTransactionsQuery.data, position.market.finalResult]);

    useEffect(() => {
        setHomeLogoSrc(getTeamImageSource(position.market.homeTeam, position.market.tags[0]));
        setAwayLogoSrc(getTeamImageSource(position.market.awayTeam, position.market.tags[0]));
    }, [position.market.homeTeam, position.market.awayTeam, position.market.tags]);

    const claimReward = async () => {
        const { signer } = networkConnector;
        if (signer) {
            const contract = new ethers.Contract(position.market.address, sportsMarketContract.abi, signer);
            contract.connect(signer);
            const id = toast.loading(t('market.toast-message.transaction-pending'));
            try {
                const tx = await contract.exerciseOptions({
                    gasLimit: MAX_GAS_LIMIT,
                });
                const txResult = await tx.wait();

                if (txResult && txResult.transactionHash) {
                    setTimeout(() => {
                        refetchAfterClaim(walletAddress, networkId);
                    }, 1500);
                    setShowShareTicketModal(true);
                    toast.update(id, getSuccessToastOptions(t('market.toast-message.claim-winnings-success')));
                }
            } catch (e) {
                toast.update(id, getErrorToastOptions(t('common.errors.unknown-error-try-again')));
                console.log(e);
            }
        }
    };

    const isClaimable = position.claimable;
    const isCanceled = position.market.isCanceled;
    const positionEnum = convertPositionNameToPositionType(position ? position.side : '');
    const claimCanceledGame = isClaimable && isCanceled;

    const claimAmountForCanceledGame = claimCanceledGame ? getCanceledGameClaimAmount(position) : 0;

    const claimAmount = claimCanceledGame ? claimAmountForCanceledGame : position.amount;

    const shareTicketData = {
        markets: [
            {
                ...position.market,
                homeOdds: sumOfTransactionPaidAmount / position.amount,
                awayOdds: sumOfTransactionPaidAmount / position.amount,
                drawOdds: sumOfTransactionPaidAmount / position.amount,
                winning: position.claimable,
                position: convertPositionNameToPosition(position?.side ? position?.side : ''),
            } as ParlaysMarket,
        ],
        totalQuote: sumOfTransactionPaidAmount / position.amount,
        paid: sumOfTransactionPaidAmount,
        payout: position.amount,
    };

    return (
        <Wrapper>
            <GameParticipantsWrapper>
                <TeamContainer>
                    <ClubLogo
                        style={{ marginRight: '5px' }}
                        alt={position.market.homeTeam}
                        src={homeLogoSrc}
                        isFlag={position.market.tags[0] == 9018}
                        onError={getOnImageError(setHomeLogoSrc, position.market.tags[0])}
                    />
                    <ClubName>{position.market.homeTeam}</ClubName>
                </TeamContainer>
                <ClubName>{' VS '}</ClubName>
                <TeamContainer>
                    <ClubLogo
                        style={{ marginRight: '5px' }}
                        alt={position.market.awayTeam}
                        src={awayLogoSrc}
                        isFlag={position.market.tags[0] == 9018}
                        onError={getOnImageError(setAwayLogoSrc, position.market.tags[0])}
                    />
                    <ClubName>{position.market.awayTeam}</ClubName>
                </TeamContainer>
            </GameParticipantsWrapper>
            {isClaimable && (
                <>
                    <ResultContainer>
                        {!isCanceled && (
                            <>
                                <Label>{t('profile.card.result')}</Label>
                                <BoldValue>{`${position.market.homeScore} : ${position.market.awayScore}`}</BoldValue>
                            </>
                        )}
                        {isCanceled && (
                            <>
                                <Label canceled={true}>{t('profile.card.canceled')}</Label>
                            </>
                        )}
                    </ResultContainer>
                    {isMobile ? (
                        <ClaimContainer>
                            <FlexDivRow>
                                <ClaimValue>{formatCurrencyWithSign(USD_SIGN, claimAmount, 2)}</ClaimValue>
                            </FlexDivRow>
                            <ClaimButton
                                claimable={true}
                                onClick={(e: any) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    claimReward();
                                }}
                            >
                                {t('profile.card.claim')}
                            </ClaimButton>
                        </ClaimContainer>
                    ) : (
                        <>
                            <ClaimInfoContainer>
                                <ClaimLabel>{t('profile.card.to-claim')}:</ClaimLabel>
                                <ClaimValue>{formatCurrencyWithSign(USD_SIGN, claimAmount, 2)}</ClaimValue>
                            </ClaimInfoContainer>
                            <ClaimButton
                                claimable={true}
                                onClick={(e: any) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    claimReward();
                                }}
                            >
                                {t('profile.card.claim')}
                            </ClaimButton>
                        </>
                    )}
                </>
            )}
            {!isClaimable && (
                <>
                    <PositionContainer>
                        <PositionSymbol
                            type={convertPositionToSymbolType(
                                positionEnum,
                                getIsApexTopGame(position.market.isApex, position.market.betType)
                            )}
                            symbolColor={getPositionColor(positionEnum)}
                        />
                    </PositionContainer>
                    <ColumnDirectionInfo>
                        <Label>{t('profile.card.position-size')}:</Label>
                        <BoldValue>{formatCurrencyWithSign(USD_SIGN, position.amount)}</BoldValue>
                    </ColumnDirectionInfo>
                    <ColumnDirectionInfo>
                        <Label>{t('profile.card.starts')}</Label>
                        <BoldValue>{formatDateWithTime(position.market.maturityDate)}</BoldValue>
                    </ColumnDirectionInfo>
                    <ExternalLink href={buildMarketLink(position.market.address, language)} target={'_blank'}>
                        <ExternalLinkContainer>
                            <ExternalLinkArrow />
                        </ExternalLinkContainer>
                    </ExternalLink>
                </>
            )}
            {showShareTicketModal && (
                <ShareTicketModal
                    markets={shareTicketData.markets}
                    totalQuote={shareTicketData.totalQuote}
                    paid={Number(shareTicketData.paid)}
                    payout={shareTicketData.payout}
                    onClose={() => setShowShareTicketModal(false)}
                />
            )}
        </Wrapper>
    );
};

export default SinglePosition;
