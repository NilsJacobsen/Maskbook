import {
    useChainId,
    useCurrentWeb3NetworkPluginID,
    useProviderDescriptor,
    useRecentTransactions,
    useNetworkDescriptor,
    useAccount,
    useWallet,
    useReverseAddress,
    useWeb3State,
    useProviderType,
    Web3Helper,
} from '@masknet/plugin-infra/web3'
import { WalletMessages } from '@masknet/plugin-wallet'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import { NetworkPluginID, TransactionStatusType } from '@masknet/web3-shared-base'
import { Box, Button } from '@mui/material'
import { useI18N } from '../../i18n-next-ui.js'
import { Icons } from '@masknet/icons'
import { memo, PropsWithChildren, useCallback, useMemo } from 'react'
import { ProviderType } from '@masknet/web3-shared-evm'
import { WalletDescription } from './WalletDescription.js'
import { Action } from './Action.js'
import { useStatusBarStyles } from './styles.js'

interface WalletStatusBarProps<T extends NetworkPluginID> extends PropsWithChildren<{}> {
    className?: string
    onClick?: (ev: React.MouseEvent<HTMLDivElement>) => void
    expectedPluginID?: T
    expectedChainId?: Web3Helper.Definition[T]['ChainId']
}

export const PluginWalletStatusBar = memo<WalletStatusBarProps<NetworkPluginID>>(
    ({ className, onClick, expectedPluginID, expectedChainId, children }) => {
        const { t } = useI18N()
        const currentPluginId = useCurrentWeb3NetworkPluginID()

        const account = useAccount()
        const wallet = useWallet()

        const chainId = useChainId()
        const { classes, cx } = useStatusBarStyles()

        const providerDescriptor = useProviderDescriptor()

        const providerType = useProviderType()
        const networkDescriptor = useNetworkDescriptor(currentPluginId, chainId)
        const expectedNetworkDescriptor = useNetworkDescriptor(expectedPluginID, expectedChainId)
        const { value: domain } = useReverseAddress(currentPluginId, account)
        const { Others } = useWeb3State()

        const { setDialog: setSelectProviderDialog } = useRemoteControlledDialog(
            WalletMessages.events.selectProviderDialogUpdated,
        )

        const openSelectProviderDialog = useCallback(() => {
            setSelectProviderDialog({
                open: true,
                network: expectedNetworkDescriptor,
            })
        }, [expectedNetworkDescriptor])

        const { openDialog: openWalletStatusDialog } = useRemoteControlledDialog(
            WalletMessages.events.walletStatusDialogUpdated,
        )

        const pendingTransactions = useRecentTransactions(currentPluginId, TransactionStatusType.NOT_DEPEND)

        const walletName = useMemo(() => {
            if (domain) return domain
            if (providerType === ProviderType.MaskWallet && wallet?.name) return wallet?.name

            return providerDescriptor?.name || Others?.formatAddress(account, 4)
        }, [providerType, domain, wallet?.name, providerDescriptor?.name, Others?.formatAddress, account])

        if (!account) {
            return (
                <Box className={cx(classes.root, className)}>
                    <Button fullWidth onClick={openSelectProviderDialog}>
                        <Icons.ConnectWallet className={classes.connection} /> {t('plugin_wallet_connect_a_wallet')}
                    </Button>
                </Box>
            )
        }

        return (
            <Box className={cx(classes.root, className)}>
                <WalletDescription
                    pending={!!pendingTransactions.length}
                    providerIcon={providerDescriptor?.icon}
                    networkIcon={networkDescriptor?.icon}
                    iconFilterColor={providerDescriptor?.iconFilterColor}
                    name={walletName}
                    formattedAddress={Others?.formatAddress(account, 4)}
                    addressLink={Others?.explorerResolver.addressLink?.(chainId, account)}
                    onClick={onClick ?? openSelectProviderDialog}
                    onPendingClick={openWalletStatusDialog}
                />
                <Action openSelectWalletDialog={openSelectProviderDialog}>{children}</Action>
            </Box>
        )
    },
)
