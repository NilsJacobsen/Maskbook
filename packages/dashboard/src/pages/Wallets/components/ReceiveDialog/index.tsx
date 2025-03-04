import { memo } from 'react'
import { useCopyToClipboard } from 'react-use'
import { MaskColorVar, MaskDialog, makeStyles } from '@masknet/theme'
import { QRCode, useSnackbarCallback } from '@masknet/shared'
import { DialogContent, Typography, DialogActions, Button } from '@mui/material'
import { useChainContext, useReverseAddress, useWeb3Others } from '@masknet/web3-hooks-base'
import type { Web3Helper } from '@masknet/web3-helpers'
import { chainResolver } from '@masknet/web3-shared-evm'
import { WalletQRCodeContainer } from '../../../../components/WalletQRCodeContainer/index.js'
import { useDashboardI18N } from '../../../../locales/index.js'

const useStyles = makeStyles()((theme) => ({
    paper: {
        width: '100%',
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    addressTitle: {
        marginTop: theme.spacing(1.5),
        color: MaskColorVar.normalText,
    },
    address: {
        marginTop: theme.spacing(1.5),
        fontWeight: 600,
    },
}))

export interface ReceiveDialogProps {
    open: boolean
    address: string
    onClose: () => void
}

export const ReceiveDialog = memo<ReceiveDialogProps>(({ open, address, onClose }) => {
    const Others = useWeb3Others()

    const { chainId } = useChainContext()
    const { data: domain } = useReverseAddress(undefined, address)

    return (
        <ReceiveDialogUI
            open={open}
            chainId={chainId}
            address={address}
            domain={Others.formatDomainName(domain)}
            onClose={onClose}
        />
    )
})

export interface ReceiveDialogUIProps extends ReceiveDialogProps {
    chainId: Web3Helper.ChainIdAll
    domain?: string
}

export const ReceiveDialogUI = memo<ReceiveDialogUIProps>(({ open, chainId, address, domain, onClose }) => {
    const t = useDashboardI18N()
    const { classes } = useStyles()
    const [, copyToClipboard] = useCopyToClipboard()
    const copyAddress = useSnackbarCallback({
        executor: async (address: string) => copyToClipboard(address),
        deps: [],
        successText: t.wallets_address_copied(),
    })
    // TODO: The <QRCode /> text prop protocol maybe correct and requires confirmation
    return (
        <MaskDialog
            open={open}
            title={t.wallets_balance_Receive()}
            onClose={onClose}
            DialogProps={{
                classes: { paper: classes.paper },
            }}>
            <DialogContent className={classes.container}>
                <Typography sx={{ marginBottom: 3.5 }}>
                    {t.wallets_receive_tips({ chainName: chainResolver.chainName(chainId as number) ?? '' })}
                </Typography>
                <WalletQRCodeContainer width={286} height={286} border={{ borderWidth: 15, borderHeight: 2 }}>
                    <QRCode
                        text={`${chainResolver.chainPrefix(chainId as number)}:${address}`}
                        options={{ width: 282 }}
                        canvasProps={{
                            style: { display: 'block', margin: 'auto' },
                        }}
                    />
                </WalletQRCodeContainer>
                <Typography variant="body2" className={classes.addressTitle}>
                    {t.wallets_address()}
                </Typography>

                {domain ? (
                    <Typography variant="body2" className={classes.address}>
                        {domain}
                    </Typography>
                ) : null}

                <Typography variant="body2" className={classes.address}>
                    {address}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button size="medium" onClick={() => copyAddress(address)}>
                    {t.wallets_address_copy()}
                </Button>
            </DialogActions>
        </MaskDialog>
    )
})
