import SimpleLoader from 'components/SimpleLoader';
import useMarketQuery from 'queries/markets/useMarketQuery';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import { getIsAppReady } from 'redux/modules/app';
import { RootState } from 'redux/rootReducer';
import styled from 'styled-components';
import { FlexDivColumn } from 'styles/common';
import { MarketData } from 'types/markets';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import MarketDetailsV2 from './MarketDetailsV2';

type MarketProps = RouteComponentProps<{
    marketAddress: string;
}>;

const Market: React.FC<MarketProps> = (props) => {
    const isAppReady = useSelector((state: RootState) => getIsAppReady(state));
    const [lastValidMarket, setLastValidMarket] = useState<MarketData | undefined>(undefined);
    const { trackPageView } = useMatomo();

    const { params } = props.match;
    const marketAddress = params && params.marketAddress ? params.marketAddress : '';

    const marketQuery = useMarketQuery(marketAddress, {
        enabled: isAppReady,
    });

    useEffect(() => {
        if (marketQuery.isSuccess && marketQuery.data) {
            setLastValidMarket(marketQuery.data);
        }
    }, [marketQuery.isSuccess, marketQuery.data]);

    const market: MarketData | undefined = useMemo(() => {
        if (marketQuery.isSuccess && marketQuery.data) {
            return marketQuery.data;
        }
        return lastValidMarket;
    }, [marketQuery.isSuccess, marketQuery.data, lastValidMarket]);

    useEffect(() => {
        trackPageView({});
    }, [trackPageView]);

    return <Container>{market ? <MarketDetailsV2 market={market} /> : <SimpleLoader />}</Container>;
};

const Container = styled(FlexDivColumn)`
    position: relative;
    align-items: center;
    width: 100%;
`;

export default Market;
