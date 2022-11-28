import SPAAnchor from 'components/SPAAnchor';
import ROUTES from 'constants/routes';
import React, { useCallback, useState } from 'react';
import { buildHref } from 'utils/routes';
import {
    Container,
    ItemContainer,
    ItemIcon,
    ParlayButton,
    DropdownContainer,
    DropDown,
    DropDownItem,
    Label,
} from './styled-components';
import ConnectWalletButtonMobile from 'components/ConnectWalletButtonMobile';
import { ParlaysMarketPosition } from 'types/markets';
import { t } from 'i18next';
import { FlexDivCentered } from 'styles/common';
import { OddsType, ODDS_TYPES } from 'constants/markets';
import { setOddsType } from 'redux/modules/ui';
import { useDispatch } from 'react-redux';
import OutsideClickHandler from 'react-outside-click-handler';

type FooterSidebarMobileProps = {
    setParlayMobileVisibility: (value: boolean) => void;
    setShowBurger: (value: boolean) => void;
    parlayMarkets: ParlaysMarketPosition[];
};

const FooterSidebarMobile: React.FC<FooterSidebarMobileProps> = ({
    setParlayMobileVisibility,
    setShowBurger,
    parlayMarkets,
}) => {
    const dispatch = useDispatch();

    const [dropdownIsOpen, setDropdownIsOpen] = useState<boolean>(false);

    const setSelectedOddsType = useCallback(
        (oddsType: OddsType) => {
            return dispatch(setOddsType(oddsType));
        },
        [dispatch]
    );

    return (
        <OutsideClickHandler onOutsideClick={() => setDropdownIsOpen(false)}>
            <Container>
                <ItemContainer>
                    <ItemIcon
                        className="icon icon--odds"
                        onClick={() => {
                            setDropdownIsOpen(true);
                        }}
                    />
                </ItemContainer>
                {dropdownIsOpen && (
                    <DropdownContainer>
                        <DropDown>
                            {ODDS_TYPES.map((item: any, index: number) => (
                                <DropDownItem
                                    key={index}
                                    onClick={() => {
                                        setSelectedOddsType(item);
                                        setDropdownIsOpen(false);
                                    }}
                                >
                                    <FlexDivCentered>
                                        <Label> {t(`common.odds.${item}`)}</Label>
                                    </FlexDivCentered>
                                </DropDownItem>
                            ))}
                        </DropDown>
                    </DropdownContainer>
                )}

                <ItemContainer>
                    <SPAAnchor href={buildHref(ROUTES.Profile)}>
                        <ItemIcon className="icon icon--profile" />
                    </SPAAnchor>
                </ItemContainer>
                <ItemContainer>
                    <ParlayButton onClick={() => setParlayMobileVisibility(true)}>{parlayMarkets.length}</ParlayButton>
                </ItemContainer>
                <ItemContainer>
                    <ItemIcon
                        className="icon icon--filters"
                        onClick={() => {
                            setShowBurger(true);
                        }}
                    />
                </ItemContainer>
                <ItemContainer>
                    <ConnectWalletButtonMobile />
                </ItemContainer>
            </Container>
        </OutsideClickHandler>
    );
};

export default FooterSidebarMobile;
