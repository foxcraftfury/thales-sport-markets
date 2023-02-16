import { useQuery, UseQueryOptions } from 'react-query';
import { Position } from '../../constants/options';
import { AMMPosition } from '../../types/markets';
import QUERY_KEYS from '../../constants/queryKeys';
import networkConnector from '../../utils/networkConnector';
import { bigNumberFormatter, bigNumberFormmaterWithDecimals } from '../../utils/formatters/ethers';
import { NetworkId } from 'types/network';
import { getCollateralAddress, getDefaultDecimalsForNetwork } from 'utils/collaterals';
import { isMultiCollateralSupportedForNetwork } from 'utils/network';
import { STABLE_DECIMALS } from 'constants/currency';
import { ethers } from 'ethers';

const usePositionPriceDetailsQuery = (
    marketAddress: string,
    position: Position,
    amount: number,
    stableIndex: number,
    networkId: NetworkId,
    options?: UseQueryOptions<AMMPosition>
) => {
    return useQuery<AMMPosition>(
        QUERY_KEYS.PositionDetails(marketAddress, position, amount, stableIndex, networkId),
        async () => {
            try {
                const isMultiCollateral = isMultiCollateralSupportedForNetwork(networkId);

                const sportsAMMContract = networkConnector.sportsAMMContract;
                const parsedAmount = ethers.utils.parseEther(amount.toString());

                const collateralAddress =
                    isMultiCollateral &&
                    getCollateralAddress(stableIndex ? stableIndex !== 0 : false, networkId, stableIndex);
                const [availableToBuy, buyFromAmmQuote, buyPriceImpact, buyFromAMMQuoteCollateral] = await Promise.all([
                    await sportsAMMContract?.availableToBuyFromAMM(marketAddress, position),
                    await sportsAMMContract?.buyFromAmmQuote(marketAddress, position, parsedAmount),
                    await sportsAMMContract?.buyPriceImpact(marketAddress, position, parsedAmount),
                    collateralAddress
                        ? await sportsAMMContract?.buyFromAmmQuoteWithDifferentCollateral(
                              marketAddress,
                              position,
                              parsedAmount,
                              collateralAddress
                          )
                        : 0,
                ]);

                return {
                    available: bigNumberFormatter(availableToBuy),
                    quote: bigNumberFormmaterWithDecimals(
                        stableIndex == 0 ? buyFromAmmQuote : buyFromAMMQuoteCollateral[0],
                        isMultiCollateral
                            ? (STABLE_DECIMALS as any)[stableIndex]
                            : getDefaultDecimalsForNetwork(networkId)
                    ),
                    priceImpact: bigNumberFormatter(buyPriceImpact),
                };
            } catch (e) {
                console.log('Error ', e);
                return {
                    available: 0,
                    quote: 0,
                    priceImpact: 0,
                };
            }
        },
        {
            ...options,
        }
    );
};

export default usePositionPriceDetailsQuery;
