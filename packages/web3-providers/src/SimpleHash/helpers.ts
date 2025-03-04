import {
    SourceType,
    TokenType,
    type NonFungibleAsset,
    type NonFungibleCollection,
    ActivityType,
} from '@masknet/web3-shared-base'
import { ChainId, SchemaType, WNATIVE, chainResolver, isValidChainId, resolveImageURL } from '@masknet/web3-shared-evm'
import { ChainId as SolanaChainId } from '@masknet/web3-shared-solana'
import { ChainId as FlowChainId } from '@masknet/web3-shared-flow'
import { isEmpty } from 'lodash-es'
import { createPermalink } from '../NFTScan/helpers/EVM.js'
import { fetchJSON, getAssetFullName } from '../entry-helpers.js'
import { SIMPLE_HASH_URL } from './constants.js'
import { ActivityType as ActivityTypeSimpleHash, type Asset, type Collection } from './type.js'
import { NetworkPluginID, createLookupTableResolver, queryClient } from '@masknet/shared-base'
import type { Web3Helper } from '@masknet/web3-helpers'
import { TrendingAPI } from '../entry-types.js'
import { unreachable } from '@masknet/kit'

export async function fetchFromSimpleHash<T>(path: string, init?: RequestInit) {
    return queryClient.fetchQuery<T>({
        queryKey: [path],
        staleTime: 10_000,
        queryFn: async () => {
            return fetchJSON<T>(
                `${SIMPLE_HASH_URL}${path}`,
                {
                    method: 'GET',
                    mode: 'cors',
                    headers: { 'content-type': 'application/json' },
                },
                {
                    enableSquash: true,
                },
            )
        },
    })
}

export function createNonFungibleAsset(asset: Asset): NonFungibleAsset<ChainId, SchemaType> | undefined {
    if (isEmpty(asset)) return
    const chainId = resolveChainId(asset.chain)
    const address = asset.contract_address
    if (!chainId || !isValidChainId(chainId) || !address || asset.collection.spam_score === 100) return
    const schema = asset.contract.type === 'ERC721' ? SchemaType.ERC721 : SchemaType.ERC1155
    const name = asset.name || getAssetFullName(asset.contract_address, asset.contract.name, asset.name, asset.token_id)

    return {
        id: address,
        chainId,
        link: createPermalink(chainId, address, asset.token_id),
        tokenId: asset.token_id,
        type: TokenType.NonFungible,
        address,
        schema,
        creator: {
            address: asset.contract.deployed_by,
        },
        owner: {
            address: asset.owners?.[0].owner_address,
        },
        priceInToken: asset.last_sale
            ? {
                  amount: asset.last_sale.total_price?.toString() || '',
                  // FIXME: cannot get payment token
                  token:
                      asset.last_sale.payment_token?.symbol === 'ETH'
                          ? chainResolver.nativeCurrency(chainId) ?? WNATIVE[chainId]
                          : WNATIVE[chainId],
              }
            : undefined,
        metadata: {
            chainId,
            name,
            tokenId: asset.token_id,
            symbol: asset.contract.symbol,
            description: asset.description,
            imageURL: resolveImageURL(
                asset.image_url || asset.previews.image_large_url,
                asset.name,
                asset.collection.name,
                asset.contract_address,
            ),
            previewImageURL: resolveImageURL(
                asset.previews.image_small_url,
                asset.name,
                asset.collection.name,
                asset.contract_address,
            ),
            blurhash: asset.previews.blurhash,
            mediaURL: asset.image_url || asset.previews.image_large_url,
        },
        contract: {
            chainId,
            schema,
            address: asset.contract_address,
            name: asset.contract.name,
            symbol: asset.contract.symbol,
        },
        collection: {
            chainId,
            name: asset.collection.name || '',
            slug: asset.contract.name,
            description: asset.collection.description,
            address: asset.contract_address,
            iconURL: asset.collection.image_url,
            verified: Boolean(asset.collection.marketplace_pages?.some((x) => x.verified)),
            createdAt: new Date(asset.created_date).getTime(),
        },
        source: SourceType.SimpleHash,
    }
}

export function createNonFungibleCollection(collection: Collection): NonFungibleCollection<ChainId, SchemaType> {
    const chainId = resolveChainId(collection.chain)!

    const verifiedMarketplaces = collection.marketplace_pages?.filter((x) => x.verified) || []
    return {
        id: collection.id,
        chainId,
        name: collection.name || '',
        slug: collection.name,
        schema: SchemaType.ERC721,
        balance: collection.distinct_nfts_owned,
        iconURL: collection.image_url,
        ownersTotal: collection.total_quantity,
        source: SourceType.SimpleHash,
        address: collection.top_contracts?.[0]?.split('.')?.[1] ?? '',
        verified: verifiedMarketplaces.length > 0,
        verifiedBy: verifiedMarketplaces.map((x) => x.marketplace_name),
    }
}

export function resolveChainId(chain: string): ChainId | undefined {
    // Some of the `chainResolver.chainId()` results do not match.
    switch (chain) {
        case 'ethereum':
            return ChainId.Mainnet
        case 'polygon':
            return ChainId.Matic
        case 'arbitrum':
            return ChainId.Arbitrum
        case 'optimism':
            return ChainId.Optimism
        case 'avalanche':
            return ChainId.Avalanche
        case 'gnosis':
            return ChainId.xDai
        case 'bsc':
            return ChainId.BSC
        default:
            return undefined
    }
}

const ChainNameMap: Record<NetworkPluginID, Record<number, string>> = {
    [NetworkPluginID.PLUGIN_EVM]: {
        [ChainId.Mainnet]: 'ethereum',
        [ChainId.BSC]: 'bsc',
        [ChainId.Matic]: 'polygon',
        [ChainId.Arbitrum]: 'arbitrum',
        [ChainId.Optimism]: 'optimism',
        [ChainId.Avalanche]: 'avalanche',
        [ChainId.xDai]: 'gnosis',
    },
    [NetworkPluginID.PLUGIN_SOLANA]: {
        [SolanaChainId.Mainnet]: 'solana',
    },
    [NetworkPluginID.PLUGIN_FLOW]: {
        [FlowChainId.Mainnet]: 'flow',
    },
}

export const getAllChainNames = (pluginID: NetworkPluginID) => {
    return Object.values(ChainNameMap[pluginID]).join(',')
}

export function resolveChain(pluginId: NetworkPluginID, chainId: Web3Helper.ChainIdAll): string | undefined {
    return ChainNameMap[pluginId][chainId]
}

export const SIMPLE_HASH_HISTORICAL_PRICE_START_TIME = 1669852800

export const resolveSimpleHashRange = createLookupTableResolver<TrendingAPI.Days, number>(
    {
        [TrendingAPI.Days.ONE_DAY]: 60 * 60 * 24,
        [TrendingAPI.Days.ONE_WEEK]: 60 * 60 * 24 * 7,
        [TrendingAPI.Days.ONE_MONTH]: 60 * 60 * 24 * 30,
        [TrendingAPI.Days.THREE_MONTHS]: 60 * 60 * 24 * 90,
        [TrendingAPI.Days.ONE_YEAR]: 0,
        [TrendingAPI.Days.MAX]: 0,
    },
    () => 0,
)

export function resolveEventType(event: ActivityTypeSimpleHash) {
    switch (event) {
        case ActivityTypeSimpleHash.Sale:
            return ActivityType.Sale
        case ActivityTypeSimpleHash.Transfer:
            return ActivityType.Transfer
        case ActivityTypeSimpleHash.Burn:
            return ActivityType.Burn
        case ActivityTypeSimpleHash.Mint:
            return ActivityType.Mint
        default:
            unreachable(event)
    }
}
