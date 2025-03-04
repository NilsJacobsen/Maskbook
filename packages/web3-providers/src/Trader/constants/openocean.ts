import { ChainId } from '@masknet/web3-shared-evm'

export const OPENOCEAN_BASE_URL = 'https://ethapi.openocean.finance/v2/'

// https://docs.openocean.finance/api/openocean-dex-api-2.0
export const OPENOCEAN_SUPPORTED_CHAINS = [
    ChainId.Mainnet,
    ChainId.BSC,
    ChainId.xDai,
    ChainId.Matic,
    ChainId.Fantom,
    ChainId.Arbitrum,
    ChainId.Avalanche,
]
