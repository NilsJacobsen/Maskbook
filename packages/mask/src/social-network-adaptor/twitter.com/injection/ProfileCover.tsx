import { MutationObserverWatcher } from '@dimensiondev/holoflows-kit'
import { isProfilePageLike, searchProfileCoverSelector } from '../utils/selector.js'
import { attachReactTreeWithContainer, startWatch } from '../../../utils/index.js'
import { ProfileCover } from '../../../components/InjectedComponents/ProfileCover.js'

export function injectProfileCover(signal: AbortSignal) {
    const watcher = new MutationObserverWatcher(searchProfileCoverSelector())
    startWatch(watcher, {
        signal,
        missingReportRule: {
            name: 'profile page cover',
            rule: isProfilePageLike,
        },
    })
    attachReactTreeWithContainer(watcher.firstDOMProxy.afterShadow, { signal }).render(<ProfileCoverAtTwitter />)
}

export function ProfileCoverAtTwitter() {
    return <ProfileCover />
}
