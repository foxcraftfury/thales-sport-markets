import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import App from 'pages/Root/App';
import dotenv from 'dotenv';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react';
import '@rainbow-me/rainbowkit/dist/index.css';
import { connectorsForWallets, wallet, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import WalletDisclaimer from 'components/WalletDisclaimer';
import { merge } from 'lodash';
import { ethers } from 'ethers';

dotenv.config();

type RootProps = {
    store: Store;
};

type RpcProvider = {
    ankr: string;
    chainnode: string;
};

const CHAIN_TO_RPC_PROVIDER_NETWORK_NAME: Record<number, RpcProvider> = {
    10: {
        ankr: 'optimism',
        chainnode: 'optimism-mainnet',
    },
    420: { ankr: 'optimism_testnet', chainnode: 'optimism-goerli' },
    42161: { ankr: 'arbitrum', chainnode: 'arbitrum-one' },
};

const { chains, provider } = configureChains(
    [chain.optimism, chain.optimismGoerli, chain.arbitrum],
    [
        //  Use it at our own risk as this will probably break depending on what wallet you allow users to connect with and what your project is trying to do
        (chain: any) => {
            return {
                chain: chain,
                provider: () => {
                    // check if window.ethereum is available and use it as the provider
                    if (typeof window !== 'undefined' && window.ethereum) {
                        const provider = new ethers.providers.Web3Provider(window.ethereum as any, {
                            chainId: chain.id,
                            name: chain.network,
                            ensAddress: chain.contracts?.ensRegistry?.address,
                        });
                        return Object.assign(provider);
                    }
                },
            };
        },
        alchemyProvider({ stallTimeout: 2000 }),
        infuraProvider({ stallTimeout: 2000 }),
        jsonRpcProvider({
            rpc: (chain) => ({
                http: `https://rpc.ankr.com/${CHAIN_TO_RPC_PROVIDER_NETWORK_NAME[chain.id].ankr}/${
                    process.env.REACT_APP_ANKR_PROJECT_ID
                }`,
            }),
        }),
        infuraProvider({ apiKey: process.env.REACT_APP_INFURA_PROJECT_ID, stallTimeout: 2000 }),
        jsonRpcProvider({
            rpc: (chain) => ({
                http: `https://${CHAIN_TO_RPC_PROVIDER_NETWORK_NAME[chain.id].chainnode}.chainnodes.org/${
                    process.env.REACT_APP_CHAINNODE_PROJECT_ID
                }`,
            }),
        }),
        publicProvider(),
    ]
);

const connectors = connectorsForWallets([
    {
        groupName: 'Recommended',
        wallets: [
            wallet.metaMask({ chains }),
            wallet.walletConnect({ chains }),
            wallet.brave({ chains }),
            wallet.ledger({ chains }),
            wallet.trust({ chains }),
            wallet.injected({ chains }),
            wallet.coinbase({ appName: 'Overtime', chains }),
            wallet.rainbow({ chains }),
            wallet.imToken({ chains }),
        ],
    },
]);

const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
});

const instance = createInstance({
    urlBase: 'https://data.thalesmarket.io',
    siteId: process.env.REACT_APP_SITE_ID ? Number(process.env.REACT_APP_SITE_ID) : 6,
    trackerUrl: 'https://data.thalesmarket.io/p.php', // optional, default value: `${urlBase}matomo.php`
    srcUrl: 'https://data.thalesmarket.io/p.js', //
    configurations: {
        disableCookies: true,
        setSecureCookie: true,
        setRequestMethod: 'POST',
    },
    disabled: false, // optional, false by default. Makes all tracking calls no-ops if set to true.
    heartBeat: {
        active: true, // optional, default value: true
        seconds: 10, // optional, default value: `15
    },
    linkTracking: true, // optional, default value: true
});

const customTheme = merge(darkTheme(), { colors: { modalBackground: '#1A1C2B' } });

const Root: React.FC<RootProps> = ({ store }) => {
    return (
        <Provider store={store}>
            <MatomoProvider value={instance}>
                <WagmiConfig client={wagmiClient}>
                    <RainbowKitProvider
                        chains={chains}
                        theme={customTheme}
                        appInfo={{
                            appName: 'Overtime',
                            disclaimer: WalletDisclaimer,
                        }}
                    >
                        <App />
                    </RainbowKitProvider>
                </WagmiConfig>
            </MatomoProvider>
        </Provider>
    );
};

export default Root;
