import { Icons } from '@masknet/icons'
import type { ReactNode } from 'react'
import type { useI18N } from '../locales/index.js'

export enum SecurityMessageLevel {
    High = 'High',
    Medium = 'Medium',
    Safe = 'Safe',
}

type DefineMapping = {
    [key in SecurityMessageLevel]: {
        i18nKey: keyof ReturnType<typeof useI18N>
        bgColor: string
        titleColor: string
        icon(size?: number): ReactNode
    }
}

export const DefineMapping: DefineMapping = {
    [SecurityMessageLevel.High]: {
        i18nKey: 'high_risk',
        titleColor: '#FF5F5F',
        bgColor: 'rgba(255, 53, 69, 0.1)',
        icon: (size: number) => <Icons.SecurityRisk size={size ?? 24} />,
    },
    [SecurityMessageLevel.Medium]: {
        i18nKey: 'medium_risk',
        titleColor: '#FFB100',
        bgColor: 'rgba(255, 177, 0, 0.1)',
        // TODO: Merge duplicate icon in a another PR.
        icon: (size: number) => <Icons.SecurityWarning size={size ?? 24} color="#FFB915" />,
    },
    [SecurityMessageLevel.Safe]: {
        i18nKey: 'low_risk',
        titleColor: '#60DFAB',
        bgColor: 'rgba(119, 224, 181, 0.1)',
        icon: (size: number) => <Icons.Success size={size ?? 24} />,
    },
}
