import { forwardRef, useCallback, useMemo, useState, useEffect } from 'react'
import { useAsync } from 'react-use'
import { noop } from 'lodash-es'
import format from 'date-fns/format'
import { Icons } from '@masknet/icons'
import { useChainContext, useWeb3Others, useWeb3State } from '@masknet/web3-hooks-base'
import type { Web3Helper } from '@masknet/web3-helpers'
import { makeStyles, MaskColorVar } from '@masknet/theme'
import {
    isSameAddress,
    type RecentTransactionComputed,
    TransactionStatusType,
    type Transaction,
} from '@masknet/web3-shared-base'
import { getContractOwnerDomain } from '@masknet/web3-shared-evm'
import { Grid, type GridProps, Link, List, ListItem, type ListProps, Stack, Typography } from '@mui/material'
import { useSharedI18N } from '../../../index.js'

const useStyles = makeStyles()((theme) => ({
    list: {
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        padding: 0,
    },
    listItem: {
        height: 52,
        backgroundColor: theme.palette.background.paper,
        padding: theme.spacing(1, 1),
        '&:nth-of-type(even)': {
            backgroundColor: theme.palette.background.default,
        },
    },
    transaction: {
        width: '100%',
    },
    methodName: {
        fontWeight: 500,
        textTransform: 'capitalize',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    },
    timestamp: {
        lineHeight: '18px',
    },
    cell: {
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        color: theme.palette.text.primary,
        boxSizing: 'border-box',
    },
    linkText: {
        lineHeight: '18px',
    },
    link: {
        display: 'flex',
    },
    linkIcon: {
        // TODO: replace with theme color
        color: theme.palette.mode === 'dark' ? '#F5F5F5' : '#07101B',
        width: 17.5,
        height: 17.5,
        marginLeft: theme.spacing(0.5),
    },
    clear: {
        color: MaskColorVar.blue,
        cursor: 'pointer',
    },
}))

const statusTextColorMap: Record<TransactionStatusType, string> = {
    [TransactionStatusType.NOT_DEPEND]: '#FFB915',
    [TransactionStatusType.SUCCEED]: '#60DFAB',
    [TransactionStatusType.FAILED]: '#FF5F5F',
}

interface TransactionProps extends GridProps {
    chainId: Web3Helper.ChainIdAll
    transaction: RecentTransactionComputed<Web3Helper.ChainIdAll, Web3Helper.TransactionAll>
    onClear?(tx: RecentTransactionComputed<Web3Helper.ChainIdAll, Web3Helper.TransactionAll>): void
}
function Transaction({ chainId, transaction: tx, onClear = noop, ...rest }: TransactionProps) {
    const t = useSharedI18N()
    const { classes, theme } = useStyles()

    const statusTextMap: Record<TransactionStatusType, string> = {
        [TransactionStatusType.NOT_DEPEND]: t.recent_transaction_pending(),
        [TransactionStatusType.SUCCEED]: t.recent_transaction_success(),
        [TransactionStatusType.FAILED]: t.recent_transaction_failed(),
    }

    const Others = useWeb3Others()
    const { TransactionFormatter, TransactionWatcher } = useWeb3State()

    const address = ((tx._tx as Transaction<Web3Helper.ChainIdAll, Web3Helper.SchemaTypeAll>).to || '').toLowerCase()

    const { value: functionName } = useAsync(async () => {
        const formattedTransaction = await TransactionFormatter?.formatTransaction(chainId, tx._tx)
        return formattedTransaction?.title ?? 'Contract Interaction'
    }, [TransactionFormatter])

    const handleClear = useCallback(() => {
        onClear(tx)
    }, [onClear, tx])

    const domainOrAddress = useMemo(() => getContractOwnerDomain(address), [address])

    const [txStatus, setTxStatus] = useState(tx.status)

    useEffect(() => {
        const off = TransactionWatcher?.emitter.on('progress', (chainId, id, status, transaction) => {
            setTxStatus(status)
        })

        return () => {
            off?.()
        }
    }, [tx.id, TransactionWatcher])

    return (
        <Grid container {...rest}>
            <Grid item className={classes.cell} textAlign="left" md={4}>
                <Stack overflow="hidden">
                    <Typography
                        className={classes.methodName}
                        title={functionName || ''}
                        variant="body1"
                        fontWeight={500}>
                        {functionName}
                    </Typography>
                    <Typography className={classes.timestamp} variant="body1" color={theme.palette.text.secondary}>
                        {format(tx.createdAt, 'yyyy.MM.dd HH:mm')}
                    </Typography>
                </Stack>
            </Grid>
            <Grid item className={classes.cell} flexGrow={1} md={4} justifyContent="right">
                <Typography variant="body1" className={classes.linkText}>
                    {address && isSameAddress(domainOrAddress, address)
                        ? Others.formatAddress(address, 4)
                        : domainOrAddress || address}
                </Typography>
                <Link
                    className={classes.link}
                    href={Others.explorerResolver.transactionLink?.(chainId, tx.id)}
                    target="_blank"
                    rel="noopener noreferrer">
                    <Icons.LinkOut className={classes.linkIcon} />
                </Link>
            </Grid>
            <Grid item className={classes.cell} md={2} justifyContent="center">
                <Typography fontWeight={400} justifyContent="center" color={statusTextColorMap[txStatus]} fontSize={14}>
                    {statusTextMap[txStatus]}
                </Typography>
            </Grid>
            <Grid item className={classes.cell} md={2} justifyContent="right">
                {txStatus === TransactionStatusType.NOT_DEPEND ? (
                    <Typography fontWeight={300} className={classes.clear} onClick={handleClear}>
                        {t.wallet_status_pending_clear()}
                    </Typography>
                ) : null}
            </Grid>
        </Grid>
    )
}

interface Props extends ListProps {
    transactions: Array<RecentTransactionComputed<Web3Helper.ChainIdAll, Web3Helper.TransactionAll>>
    onClear?(tx: RecentTransactionComputed<Web3Helper.ChainIdAll, Web3Helper.TransactionAll>): void
}

export const TransactionList = forwardRef<HTMLUListElement, Props>(
    ({ className, transactions, onClear = noop, ...rest }, ref) => {
        const { classes, cx } = useStyles()
        const { chainId } = useChainContext()
        if (!transactions.length) return null
        return (
            <List className={cx(classes.list, className)} {...rest} ref={ref}>
                {transactions.map((tx) => (
                    <ListItem key={tx.id} className={classes.listItem}>
                        <Transaction
                            className={classes.transaction}
                            transaction={tx}
                            chainId={chainId}
                            onClear={onClear}
                        />
                    </ListItem>
                ))}
            </List>
        )
    },
)
