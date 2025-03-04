import { memo, useMemo } from 'react'
import { Card, Link } from '@mui/material'
import { makeStyles } from '@masknet/theme'
import { useWeb3Others, useNetworkDescriptor } from '@masknet/web3-hooks-base'
import type { Web3Helper } from '@masknet/web3-helpers'
import { NetworkPluginID, type Wallet } from '@masknet/shared-base'
import { AssetPreviewer, ImageIcon } from '@masknet/shared'
import { NETWORK_DESCRIPTORS } from '@masknet/web3-shared-evm'
import type { SourceType } from '@masknet/web3-shared-base'
import { ActionsBarNFT } from '../ActionsBarNFT.js'

const useStyles = makeStyles()((theme) => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px 8px 0 0',
        position: 'absolute',
        zIndex: 1,
        backgroundColor: theme.palette.mode === 'light' ? '#F7F9FA' : '#2F3336',
        width: '100%',
        height: '100%',
    },
    icon: {
        top: theme.spacing(1),
        right: theme.spacing(1),
        position: 'absolute',
        zIndex: 1,
        backgroundColor: `${theme.palette.background.paper} !important`,
    },
    fallbackImage: {
        minHeight: '0 !important',
        maxWidth: 'none',
        width: 30,
        height: 30,
    },
    blocker: {
        position: 'absolute',
        zIndex: 2,
        width: '100%',
        height: '100%',
    },
    linkWrapper: {
        position: 'relative',
        display: 'block',
    },
    networkIcon: {
        position: 'absolute',
        top: 6,
        left: 6,
    },
}))

export interface CollectibleCardProps {
    className?: string
    provider: SourceType
    wallet?: Wallet
    asset: Web3Helper.NonFungibleAssetAll
    link?: string
    readonly?: boolean
    pluginID?: NetworkPluginID
    disableLink?: boolean
    showNetworkIcon?: boolean
}

export const CollectibleCard = memo(function CollectibleCard({
    className,
    wallet,
    asset,
    readonly,
    pluginID,
    disableLink,
    showNetworkIcon,
    ...rest
}: CollectibleCardProps) {
    const { classes, cx } = useStyles()
    const Others = useWeb3Others()

    const networkDescriptor = useNetworkDescriptor(pluginID)

    const networkIcon = useMemo(() => {
        // None is better than incorrect.
        if (!pluginID) return
        if (pluginID === NetworkPluginID.PLUGIN_EVM) {
            return NETWORK_DESCRIPTORS.find((network) => network?.chainId === asset.chainId)?.icon
        }
        return networkDescriptor?.icon
    }, [asset.chainId, pluginID, networkDescriptor?.icon])

    const content = (
        <>
            <div className={classes.blocker} />
            <Card className={classes.root}>
                {readonly || !wallet ? null : (
                    <ActionsBarNFT classes={{ more: classes.icon }} wallet={wallet} asset={asset} />
                )}
                <div>
                    <AssetPreviewer
                        url={asset.metadata?.mediaURL || asset.metadata?.imageURL}
                        classes={{
                            fallbackImage: classes.fallbackImage,
                        }}
                    />
                    {networkIcon ? (
                        <ImageIcon icon={networkIcon} size={24} classes={{ icon: classes.networkIcon }} />
                    ) : null}
                </div>
            </Card>
        </>
    )

    if (disableLink) return <div className={cx(classes.linkWrapper, className)}>{content}</div>

    return (
        <Link
            target="_blank"
            rel="noopener noreferrer"
            href={
                asset.link ?? Others.explorerResolver.nonFungibleTokenLink(asset.chainId, asset.address, asset.tokenId)
            }
            className={cx(classes.linkWrapper, className)}
            {...rest}>
            {content}
        </Link>
    )
})

CollectibleCard.displayName = 'CollectibleCard'
