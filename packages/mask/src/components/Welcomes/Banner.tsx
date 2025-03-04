import { Icons } from '@masknet/icons'
import { useCurrentPersonaConnectStatus } from '@masknet/shared'
import { DashboardRoutes, MaskMessages, currentPersonaIdentifier } from '@masknet/shared-base'
import { useValueRef } from '@masknet/shared-base-ui'
import { MaskColors, makeStyles } from '@masknet/theme'
import { IconButton } from '@mui/material'
import { useCallback, useState } from 'react'
import { useMount } from 'react-use'
import Services from '../../extension/service.js'
import { activatedSocialNetworkUI, globalUIState } from '../../social-network/index.js'
import { useLastRecognizedIdentity } from '../DataSource/useActivatedUI.js'
import { usePersonasFromDB } from '../DataSource/usePersonasFromDB.js'

interface BannerUIProps extends withClasses<'header' | 'content' | 'actions' | 'buttonText'> {
    description?: string
    nextStep:
        | 'hidden'
        | {
              onClick(): void
          }
    username?:
        | 'hidden'
        | {
              isValid(username: string): boolean
              value: string
              defaultValue: string
              onChange(nextValue: string): void
          }
    iconType?: string
}

const ICON_MAP: Record<string, JSX.Element> = {
    minds: <Icons.MaskInMinds size={18} />,
    default: <Icons.SharpMask size={17} color={MaskColors.light.maskColor.publicTwitter} />,
}
const useStyles = makeStyles()({
    buttonText: {
        width: 38,
        height: 38,
        margin: '10px 0',
    },
})

export function BannerUI(props: BannerUIProps) {
    const { classes } = useStyles(undefined, { props })

    return props.nextStep === 'hidden' ? null : (
        <IconButton size="large" className={classes.buttonText} onClick={props.nextStep.onClick}>
            {ICON_MAP?.[props?.iconType ?? 'default']}
        </IconButton>
    )
}

export interface BannerProps extends Partial<BannerUIProps> {}

export function Banner(props: BannerProps) {
    const lastRecognizedIdentity = useLastRecognizedIdentity()
    const allPersonas = usePersonasFromDB()
    const currentIdentifier = useValueRef(currentPersonaIdentifier)
    const { value: personaConnectStatus } = useCurrentPersonaConnectStatus(
        allPersonas,
        currentIdentifier,
        Services.Helper.openDashboard,
        lastRecognizedIdentity,
        MaskMessages,
    )
    const { nextStep } = props
    const networkIdentifier = activatedSocialNetworkUI.networkIdentifier
    const identities = useValueRef(globalUIState.profiles)
    const [value, onChange] = useState('')
    const defaultNextStep = useCallback(() => {
        if (nextStep === 'hidden') return
        if (!networkIdentifier) {
            nextStep?.onClick()
            nextStep ?? console.warn('You must provide one of networkIdentifier or nextStep.onClick')
            return
        }

        Services.Helper.openDashboard(
            personaConnectStatus.hasPersona ? DashboardRoutes.Personas : DashboardRoutes.Setup,
        )
    }, [networkIdentifier, nextStep])
    const defaultUserName = networkIdentifier
        ? {
              defaultValue: lastRecognizedIdentity.identifier?.userId ?? '',
              value,
              onChange,
              isValid: activatedSocialNetworkUI.utils.isValidUsername || (() => true),
          }
        : ('hidden' as const)

    const [mounted, setMounted] = useState(false)
    useMount(() => setMounted(true))

    return identities.length === 0 && mounted ? (
        <BannerUI
            {...props}
            username={props.username ?? defaultUserName}
            nextStep={props.nextStep ?? { onClick: defaultNextStep }}
        />
    ) : null
}
