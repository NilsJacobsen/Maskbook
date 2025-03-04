import { memo, useCallback, useEffect, useState } from 'react'
import { useAsyncFn, useAsyncRetry } from 'react-use'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, lighten, Typography } from '@mui/material'
import { makeStyles, MaskColorVar } from '@masknet/theme'
import { Icons } from '@masknet/icons'
import { DashboardRoutes } from '@masknet/shared-base'
import { WalletMessages } from '@masknet/plugin-wallet'
import { HD_PATH_WITHOUT_INDEX_ETHEREUM } from '@masknet/web3-shared-base'
import { useDashboardI18N } from '../../../../locales/index.js'
import { MnemonicReveal } from '../../../../components/Mnemonic/index.js'
import { VerifyMnemonicDialog } from '../VerifyMnemonicDialog/index.js'
import { PluginServices } from '../../../../API.js'
import { useMnemonicWordsPuzzle } from '../../../../hooks/useMnemonicWordsPuzzle.js'

const useStyles = makeStyles()((theme) => ({
    container: {
        padding: '120px 18%',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
    },
    title: {
        fontSize: 24,
        lineHeight: 1.25,
        fontWeight: 500,
    },
    refresh: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 24,
        fontSize: 14,
        lineHeight: '20px',
        width: '100%',
        color: MaskColorVar.linkText,
    },
    words: {
        marginTop: 24,
        backgroundColor: MaskColorVar.bottom,
        padding: 30,
        width: '100%',
        borderRadius: 8,
    },
    controller: {
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 33%)',
        justifyContent: 'center',
        gridColumnGap: 10,
        padding: '27px 0',
        width: '100%',
    },
    button: {
        height: 48,
        borderRadius: 24,
        fontSize: 18,
    },
    cancelButton: {
        height: 48,
        borderRadius: 24,
        fontSize: 18,
        background: theme.palette.mode === 'dark' ? '#1A1D20' : '#F7F9FA',
        '&:hover': {
            background: `${lighten(theme.palette.mode === 'dark' ? '#1A1D20' : '#F7F9FA', 0.1)}!important`,
        },
    },
    alert: {
        marginTop: 24,
        padding: 24,
        backgroundColor: MaskColorVar.errorBackground,
        color: MaskColorVar.redMain,
    },
}))

const CreateMnemonic = memo(() => {
    const location = useLocation()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const { words, puzzleWords, indexes, answerCallback, resetCallback, refreshCallback } = useMnemonicWordsPuzzle()
    const [searchParams] = useSearchParams()
    const { value: hasPassword, loading, retry } = useAsyncRetry(PluginServices.Wallet.hasPassword, [])

    useEffect(() => {
        WalletMessages.events.walletLockStatusUpdated.on(retry)
    }, [retry])

    const onVerifyClick = useCallback(() => {
        setOpen(true)
    }, [])

    const [walletState, onSubmit] = useAsyncFn(async () => {
        const name = new URLSearchParams(location.search).get('name')
        const password = location.state?.password
        // if the name doesn't exist, navigate to form page
        if (!name) {
            resetCallback()
            navigate(DashboardRoutes.CreateMaskWalletForm)
            return
        }

        if (!hasPassword) {
            await PluginServices.Wallet.setPassword(password)
        }

        const address = await PluginServices.Wallet.recoverWalletFromMnemonic(
            name,
            words.join(' '),
            `${HD_PATH_WITHOUT_INDEX_ETHEREUM}/0`,
        )

        await PluginServices.Wallet.resolveMaskAccount([
            {
                address,
            },
        ])

        return address
    }, [location.search, words, resetCallback, hasPassword, searchParams])

    const onClose = useCallback(() => {
        refreshCallback()
        resetCallback()
        setOpen(false)
    }, [refreshCallback, resetCallback])

    useEffect(() => {
        if (!location.state?.password && !hasPassword && !loading) navigate(-1)
    }, [location.state, hasPassword, loading])

    return (
        <>
            <CreateMnemonicUI words={words} onRefreshWords={refreshCallback} onVerifyClick={onVerifyClick} />
            <VerifyMnemonicDialog
                matched={words.join(' ') === puzzleWords.join(' ')}
                onUpdateAnswerWords={answerCallback}
                indexes={indexes}
                puzzleWords={puzzleWords}
                open={open}
                onClose={onClose}
                onSubmit={onSubmit}
                loading={walletState.loading}
                address={walletState.value}
            />
        </>
    )
})

export interface CreateMnemonicUIProps {
    words: string[]
    onRefreshWords: () => void
    onVerifyClick: () => void
}

export const CreateMnemonicUI = memo<CreateMnemonicUIProps>(({ words, onRefreshWords, onVerifyClick }) => {
    const t = useDashboardI18N()
    const { classes } = useStyles()
    const navigate = useNavigate()
    const [open, setOpen] = useState(true)

    return (
        <div className={classes.container}>
            <Typography className={classes.title}>Create a wallet</Typography>
            <div className={classes.refresh}>
                <Box style={{ display: 'flex', cursor: 'pointer' }} onClick={onRefreshWords}>
                    <Icons.Refresh color="#1C68F3" />
                    <Typography>{t.wallets_create_wallet_refresh()}</Typography>
                </Box>
            </div>
            <div className={classes.words}>
                <MnemonicReveal words={words} />
            </div>
            <Box className={classes.controller}>
                <Button color="secondary" className={classes.cancelButton} onClick={() => navigate(-1)}>
                    {t.cancel()}
                </Button>
                <Button className={classes.button} onClick={onVerifyClick}>
                    {t.verify()}
                </Button>
            </Box>
            {open ? (
                <Alert icon={<Icons.Info />} severity="error" onClose={() => setOpen(false)} className={classes.alert}>
                    {t.create_wallet_mnemonic_tip()}
                </Alert>
            ) : null}
        </div>
    )
})

export default CreateMnemonic
