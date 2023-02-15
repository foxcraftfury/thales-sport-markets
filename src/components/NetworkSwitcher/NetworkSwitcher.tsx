import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { getIsWalletConnected, getNetworkId, getWalletAddress, updateNetworkSettings } from 'redux/modules/wallet';
import { RootState } from 'redux/rootReducer';
import styled from 'styled-components';
import { truncateAddress } from 'utils/formatters/string';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import OutsideClickHandler from 'react-outside-click-handler';
import { hasEthereumInjected } from 'utils/network';
import { NETWORK_SWITCHER_SUPPORTED_NETWORKS } from 'constants/network';
import { NetworkId } from 'types/network';

const NetworkSwitcher: React.FC = () => {
    const { t } = useTranslation();
    const networkId = useSelector((state: RootState) => getNetworkId(state));
    const isWalletConnected = useSelector((state: RootState) => getIsWalletConnected(state));
    const walletAddress = useSelector((state: RootState) => getWalletAddress(state)) || '';
    const [dropDownOpen, setDropDownOpen] = useState(false);
    const dispatch = useDispatch();

    // const isMobile = useSelector((state: RootState) => getIsMobile(state));

    return (
        <RainbowConnectButton.Custom>
            {({ openConnectModal, openAccountModal, mounted }) => {
                return (
                    <div
                        {...(!mounted && {
                            'aria-hidden': true,
                            style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                                position: 'relative',
                            },
                        })}
                    >
                        <Wrapper>
                            {isWalletConnected && (
                                <Text onClick={openAccountModal}>{truncateAddress(walletAddress, 5, 5)}</Text>
                            )}
                            {!isWalletConnected && (
                                <Text onClick={openConnectModal}>{t('common.wallet.connect-your-wallet')}</Text>
                            )}
                            <OutsideClickHandler onOutsideClick={() => setDropDownOpen(false)}>
                                <NetworkIconWrapper onClick={() => setDropDownOpen(!dropDownOpen)}>
                                    <NetworkIcon className={`icon ${networkId === 42161 ? 'icon--arb' : 'icon--op'}`} />
                                    <DownIcon className={`icon icon--arrow-down`} />
                                </NetworkIconWrapper>
                                {dropDownOpen && (
                                    <NetworkDropDown>
                                        {NETWORK_SWITCHER_SUPPORTED_NETWORKS.map((network) => (
                                            <NetworkWrapper
                                                key={network.shortChainName}
                                                onClick={async () => {
                                                    if (networkId !== network.networkId) {
                                                        if (hasEthereumInjected()) {
                                                            await (window.ethereum as any).request({
                                                                method: 'wallet_switchEthereumChain',
                                                                params: [{ chainId: network.chainId }],
                                                            });
                                                        } else {
                                                            dispatch(
                                                                updateNetworkSettings({
                                                                    networkId: network.networkId as NetworkId,
                                                                })
                                                            );
                                                        }
                                                    }

                                                    setDropDownOpen(false);
                                                }}
                                            >
                                                <NetworkIcon className={network.iconClassName} />
                                                <NetworkText>
                                                    {networkId === network.networkId && <NetworkSelectedIndicator />}
                                                    {network.shortChainName}
                                                </NetworkText>
                                            </NetworkWrapper>
                                        ))}
                                    </NetworkDropDown>
                                )}
                            </OutsideClickHandler>
                        </Wrapper>
                    </div>
                );
            }}
        </RainbowConnectButton.Custom>
    );
};

const Wrapper = styled.div`
    display: flex;
    border-radius: 20px;
    border: 2px solid #39caf8;
    min-width: 160px;
    height: 28px;
    justify-content: space-between;
    align-items: center;
    padding-left: 10px;
`;

const NetworkIconWrapper = styled.div`
    background: #39caf7;
    height: 28px;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    gap: 4px;
    align-items: center;
    max-width: 65px;
    min-width: 65px;
    cursor: pointer;
    margin-right: -1px;
`;

const Text = styled.span`
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 800;
    font-size: 10.8px;
    line-height: 13px;
    color: #39caf7;
    cursor: pointer;
`;

const NetworkText = styled.span`
    position: relative;
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 800;
    font-size: 10.8px;
    line-height: 13px;
    cursor: pointer;
    color: #1a1c2b;
    text-align: left;
`;

const NetworkIcon = styled.i`
    font-size: 24px;
    color: #1a1c2b;
    &.icon--arb {
        position: relative;
        left: -2px;
    }
`;
const DownIcon = styled.i`
    font-size: 12px;
    color: #1a1c2b;
`;

const NetworkDropDown = styled.div`
    z-index: 1000;
    position: absolute;
    top: 30px;
    left: 0px;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    background: #39caf8;
    min-width: 160px;
    padding: 10px;
    justify-content: center;
    align-items: center;
    gap: 10px;
`;

const NetworkWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    width: 100%;
`;

const NetworkSelectedIndicator = styled.div`
    position: absolute;
    background: #1a1c2b;
    border-radius: 20px;
    width: 6px;
    height: 6px;
    left: -45px;
    top: 3px;
`;

export default NetworkSwitcher;
