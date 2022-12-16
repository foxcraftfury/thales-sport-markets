import useUsersStatsQuery from 'queries/wallet/useUsersStatsQuery';
import React from 'react';
import { useSelector } from 'react-redux';
import { getIsWalletConnected, getNetworkId, getWalletAddress } from 'redux/modules/wallet';
import { RootState } from 'redux/rootReducer';
import styled from 'styled-components';
import { formatCurrencyWithKey } from 'utils/formatters/number';

const UserStats: React.FC<{ openPositionsValue: number }> = ({ openPositionsValue }) => {
    const walletAddress = useSelector((state: RootState) => getWalletAddress(state)) || '';
    const isWalletConnected = useSelector((state: RootState) => getIsWalletConnected(state));
    const networkId = useSelector((state: RootState) => getNetworkId(state));
    const userStatQuery = useUsersStatsQuery(walletAddress.toLowerCase(), networkId, { enabled: isWalletConnected });
    const user = userStatQuery.isSuccess ? userStatQuery.data[0] : { id: '', trades: 0, volume: 0, pnl: 0 };

    return (
        <Wrapper>
            <SectionWrapper>
                <Section>
                    <Label>Trades:</Label>
                    <Value>{!user ? 0 : user.trades}</Value>
                </Section>
                <Section>
                    <Label>P&L:</Label>
                    <Value>{!user ? 0 : formatCurrencyWithKey('USD', user.pnl + openPositionsValue, 2)}</Value>
                </Section>
            </SectionWrapper>
            <SectionWrapper>
                <Section>
                    <Label>Total Volume:</Label>
                    <Value>{!user ? 0 : formatCurrencyWithKey('USD', user.volume, 2)}</Value>
                </Section>
                <Section></Section>
            </SectionWrapper>
        </Wrapper>
    );
};

const Wrapper = styled.div`
    margin-top: 30px;
    display: flex;
    background: #303656;
    border-radius: 5px;
    width: 100%;
    flex-wrap: wrap;
    flex-direction: column;
    padding: 8px 14px;
    gap: 4px;
`;

const SectionWrapper = styled.div`
    display: flex;
    gap: 30px;
    @media (max-width: 400px) {
        flex-direction: column;
        gap: 4px;
    }
`;

const Section = styled.div`
    display: flex;
    justify-content: space-between;
    flex: 1;
    align-items: center;
`;

const Label = styled.span`
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 400;
    font-size: 10.585px;
    letter-spacing: 0.025em;
    text-transform: uppercase;
    color: #64d9fe;
`;

const Value = styled.span`
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 800;
    font-size: 10.585px;
    letter-spacing: 0.025em;
    text-transform: uppercase;
    color: white;
    text-align: right;
`;

export default UserStats;
