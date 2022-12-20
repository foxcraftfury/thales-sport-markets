import styled from 'styled-components';
import { FlexDivRow, FlexDivColumn } from 'styles/common';

export const Container = styled(FlexDivColumn)`
    padding: 0 10px;
    :not(:last-of-type) {
        border-right: 3px solid #5f6180;
    }
    :last-of-type {
        padding: 0;
    }
    :last-of-type:not(:first-child) {
        padding: 0 0 0 10px;
    }
    :first-child:not(:last-of-type) {
        padding: 0 10px 0 0;
    }
`;

export const Title = styled.span`
    font-size: 10px;
    text-transform: uppercase;
    margin-bottom: 5px;
    text-align: center;
`;

export const OddsContainer = styled(FlexDivRow)`
    align-items: center;
`;
