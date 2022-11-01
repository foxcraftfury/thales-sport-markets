import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    EligibilityContainer,
    EligibilityText,
    InfoContainer,
    InfoContent,
    InfoText,
    ButtonContainer,
    GetThalesButton,
    StyledButton,
    ListItemContainer,
    ListItem,
    GoToTwitterContainer,
} from 'pages/MintWorldCupNFT/styled-components';
import { ReactComponent as SadFace } from 'assets/images/favorite-team/sad-face.svg';
import { ReactComponent as FirstRectangle } from 'assets/images/favorite-team/first-rectangle.svg';
import { ReactComponent as SecondRectangle } from 'assets/images/favorite-team/second-rectangle.svg';
import { ReactComponent as ArrowRight } from 'assets/images/favorite-team/arrow-right.svg';

const NotEligible: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <EligibilityContainer>
                <FirstRectangle />
                <EligibilityText>
                    {t('mint-world-cup-nft.not-eligible-text')}
                    <SadFace />
                </EligibilityText>
            </EligibilityContainer>
            <InfoContainer>
                <SecondRectangle />
                <InfoContent>
                    <InfoText>{t('mint-world-cup-nft.stake-10-thales')}</InfoText>
                    <ButtonContainer>
                        <GetThalesButton
                            onClick={() =>
                                window.open(
                                    'https://app.uniswap.org/#/swap?outputCurrency=0x217d47011b23bb961eb6d93ca9945b7501a5bb11&chain=optimism'
                                )
                            }
                        >
                            {t('mint-world-cup-nft.get-thales')}
                        </GetThalesButton>
                        <StyledButton onClick={() => window.open('https://thalesmarket.io/token')}>
                            {t('mint-world-cup-nft.stake-thales')}
                        </StyledButton>
                    </ButtonContainer>
                </InfoContent>
            </InfoContainer>
            <InfoContainer>
                <SecondRectangle />
                <InfoContent>
                    <InfoText>{t('mint-world-cup-nft.second-option')}</InfoText>
                    <ListItemContainer>
                        <ArrowRight />
                        <ListItem>{t('mint-world-cup-nft.follow')}</ListItem>
                    </ListItemContainer>
                    <ListItemContainer>
                        <ArrowRight />
                        <ListItem>{t('mint-world-cup-nft.retweet')}</ListItem>
                    </ListItemContainer>
                    <ListItemContainer>
                        <ArrowRight />
                        <ListItem>{t('mint-world-cup-nft.tag-3-friends')}</ListItem>
                    </ListItemContainer>
                    <GoToTwitterContainer>
                        <StyledButton onClick={() => window.open('https://twitter.com/OvertimeMarkets')}>
                            {t('mint-world-cup-nft.go-to-twitter')}
                        </StyledButton>
                    </GoToTwitterContainer>
                </InfoContent>
            </InfoContainer>
        </>
    );
};

export default NotEligible;