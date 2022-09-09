import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { getIsWalletConnected, getNetworkId, getWalletAddress } from 'redux/modules/wallet';
import { FlexDivCentered, FlexDivColumn, FlexDivRowCentered } from 'styles/common';
import { useTranslation } from 'react-i18next';
// import { truncateAddress } from 'utils/formatters/string';
// import onboardConnector from 'utils/onboardConnector';
import { getIsAppReady } from 'redux/modules/app';
import { PAYMENT_CURRENCY } from 'constants/currency';
import { formatCurrency, formatCurrencyWithKey } from 'utils/formatters/number';
// import OutsideClickHandler from 'react-outside-click-handler';
// import useSUSDWalletBalance from 'queries/wallet/usesUSDWalletBalance';
import useOvertimeVoucherQuery from 'queries/wallet/useOvertimeVoucherQuery';
import Tooltip from 'components/Tooltip';
import OvertimeVoucherPopup from 'components/OvertimeVoucherPopup';
import ConnectButton from 'components/ConnectButton';

const WalletInfo: React.FC = () => {
    const { t } = useTranslation();
    const networkId = useSelector((state: RootState) => getNetworkId(state));
    const isAppReady = useSelector((state: RootState) => getIsAppReady(state));
    const isWalletConnected = useSelector((state: RootState) => getIsWalletConnected(state));
    const walletAddress = useSelector((state: RootState) => getWalletAddress(state)) || '';
    // const [showWalletOptions, setShowWalletOptions] = useState<boolean>(false);

    // const sUSDBalanceQuery = useSUSDWalletBalance(walletAddress, networkId, {
    //     enabled: isAppReady && isWalletConnected,
    // });
    // const sUSDBalance = useMemo(() => {
    //     if (sUSDBalanceQuery.data) {
    //         return formatCurrency(sUSDBalanceQuery?.data, 2);
    //     }
    //     return 0;
    // }, [sUSDBalanceQuery.data]);

    const overtimeVoucherQuery = useOvertimeVoucherQuery(walletAddress, networkId, {
        enabled: isAppReady && isWalletConnected,
    });
    const overtimeVoucher = useMemo(() => {
        if (overtimeVoucherQuery.isSuccess && overtimeVoucherQuery.data) {
            return overtimeVoucherQuery.data;
        }
        return undefined;
    }, [overtimeVoucherQuery.isSuccess, overtimeVoucherQuery.data]);

    return (
        <Container hasVoucher={!!overtimeVoucher}>
            <FlexDivColumn>
                <ConnectButton />
                {overtimeVoucher && (
                    <Tooltip
                        overlay={
                            <OvertimeVoucherPopup
                                title={t('common.voucher.overtime-voucher')}
                                imageSrc={overtimeVoucher.image}
                                text={`${t('common.voucher.remaining-amount')}: ${formatCurrencyWithKey(
                                    PAYMENT_CURRENCY,
                                    overtimeVoucher.remainingAmount
                                )}`}
                            />
                        }
                        component={
                            <VoucherContainer>
                                <Wallet>
                                    <VoucherInfo>{t('common.voucher.voucher')}:</VoucherInfo>
                                </Wallet>
                                <VoucherBalance>
                                    <Info>{formatCurrency(overtimeVoucher.remainingAmount, 2)}</Info>
                                    <Currency>{PAYMENT_CURRENCY}</Currency>
                                </VoucherBalance>
                            </VoucherContainer>
                        }
                        overlayClassName="overtime-voucher-overlay"
                    />
                )}
            </FlexDivColumn>
        </Container>
    );
};

const Container = styled(FlexDivCentered)<{ hasVoucher: boolean }>`
    border: 1px solid ${(props) => props.theme.borderColor.tertiary};
    color: ${(props) => props.theme.textColor.primary};
    background: ${(props) => props.theme.background.secondary};
    border-radius: 5px;
    position: relative;
    justify-content: end;
    min-width: fit-content;
    margin-bottom: ${(props) => (props.hasVoucher ? '-28px' : '0px')};
    @media (max-width: 767px) {
        min-width: auto;
        margin-bottom: ${(props) => (props.hasVoucher ? '-10px' : '0px')};
    }
`;

// const WalletContainer = styled(FlexDivRowCentered)<{ hasVoucher: boolean }>`
//     height: 28px;
//     padding: 0 20px;
//     cursor: pointer;
//     .wallet-info-hover {
//         display: none;
//     }
//     :hover {
//         background: ${(props) => props.theme.background.tertiary};
//         color: ${(props) => props.theme.textColor.primary};
//         i {
//             :before {
//                 color: ${(props) => props.theme.button.textColor.primary};
//             }
//         }
//         .wallet-info {
//             display: none;
//         }
//         .wallet-info-hover {
//             display: inline;
//         }
//     }
//     border-radius: ${(props) => (props.hasVoucher ? '5px 5px 0px 0px' : '5px')};
//     overflow: hidden;
// `;

const Wallet = styled(FlexDivRowCentered)`
    padding-right: 10px;
    width: 95px;
    text-align: center;
`;

// const Balance = styled(FlexDivRowCentered)<{ hasVoucher: boolean }>`
//     border-left: 1px solid ${(props) => (props.hasVoucher ? 'transparent' : props.theme.borderColor.secondary)};
//     padding-left: 10px;
// `;

const Info = styled.span`
    font-style: normal;
    font-weight: 400;
    font-size: 12.5px;
    line-height: 17px;
`;

const Currency = styled(Info)`
    font-weight: bold;
    margin-left: 4px;
`;

// const WalletOptions = styled(FlexDivColumn)`
//     position: absolute;
//     top: 0;
//     right: 0;
//     width: 254px;
//     height: 84px;
//     border-radius: 5px;
//     z-index: 100;
//     background: ${(props) => props.theme.background.secondary};
//     color: ${(props) => props.theme.button.textColor.primary};
// `;
//
// const WalletOptionsHeader = styled(FlexDivCentered)`
//     position: relative;
//     font-style: normal;
//     font-weight: 600;
//     font-size: 15px;
//     line-height: 17px;
//     text-align: center;
//     padding: 6px;
//     border-bottom: 1px solid ${(props) => props.theme.button.borderColor.primary};
//     /* text-transform: ; */
// `;
//
// const WalletOptionsContent = styled(FlexDivColumn)``;
//
// const WalletOption = styled(FlexDivCentered)`
//     font-style: normal;
//     font-weight: 600;
//     font-size: 15px;
//     line-height: 17px;
//     padding: 5px;
//     text-align: center;
//     cursor: pointer;
//     color: ${(props) => props.theme.textColor.primary};
//     :hover {
//         background: ${(props) => props.theme.background.tertiary};
//         :last-child {
//             border-radius: 0px 0px 5px 5px;
//         }
//     }
// `;
//
// const CloseIcon = styled.i`
//     font-size: 10px;
//     cursor: pointer;
//     position: absolute;
//     top: 6px;
//     right: 10px;
//     &:before {
//         font-family: ExoticIcons !important;
//         content: '\\004F';
//         color: ${(props) => props.theme.textColor.primary};
//     }
// `;

export const VoucherImage = styled.img`
    height: 150px;
`;

const VoucherContainer = styled(FlexDivRowCentered)`
    height: 28px;
    margin: 0 10px;
    cursor: pointer;
    border-top: 1px solid ${(props) => props.theme.borderColor.secondary};
`;

const VoucherInfo = styled(Info)`
    text-transform: uppercase;
    padding-left: 10px;
`;

const VoucherBalance = styled(FlexDivRowCentered)`
    padding-left: 10px;
    padding-right: 10px;
`;

export default WalletInfo;
