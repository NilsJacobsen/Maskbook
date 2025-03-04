import QuoterABI from '@masknet/web3-contracts/abis/Quoter.json'
import type { Quoter } from '@masknet/web3-contracts/types/Quoter.js'
import { type ChainId, useTraderConstants } from '@masknet/web3-shared-evm'
import { useContract } from '@masknet/web3-hooks-evm'
import type { AbiItem } from 'web3-utils'

export function useQuoterContract(chainId?: ChainId) {
    const { UNISWAP_V3_QUOTER_ADDRESS } = useTraderConstants(chainId)
    return useContract<Quoter>(chainId, UNISWAP_V3_QUOTER_ADDRESS, QuoterABI as AbiItem[])
}
