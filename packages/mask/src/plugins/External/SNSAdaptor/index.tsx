import type { Plugin } from '@masknet/plugin-infra'
import { Suspense } from 'react'
import { ExternalPluginLoader } from '../components/Container.js'
import type { ExternalPluginLoadDetails } from '../types.js'
import { base } from '../base.js'
import { ThirdPartyPluginCompositionEntry } from '../components/CompositionEntry.js'
import { ExternalPluginMessages } from '../messages.js'
import { isLocalContext } from '../sns-context.js'
import { makeTypedMessageText } from '@masknet/typed-message'
import { MaskMessages } from '@masknet/shared-base'

const sns: Plugin.SNSAdaptor.Definition = {
    ...base,
    init(signal) {
        const a = ExternalPluginMessages.ping.on((data) => {
            if (!isLocalContext(data.context)) return
            ExternalPluginMessages.pong.sendToContentScripts(data.challenge)
        })
        const b = ExternalPluginMessages.appendComposition.on((data) => {
            if (!isLocalContext(data.context)) return

            // TODO: should ask for user.
            MaskMessages.events.replaceComposition.sendToLocal(makeTypedMessageText(data.appendText, data.payload))
        })
        signal.addEventListener('abort', a)
        signal.addEventListener('abort', b)
    },
    DecryptedInspector: function Comp(props) {
        const tm = props.message
        if (!tm.meta) return null
        const JSX: ExternalPluginLoadDetails[] = []
        for (const [key, meta] of tm.meta) {
            if (!key.startsWith('plugin:')) continue
            const [url, metaKey] = parse(key)
            JSX.push({ meta, metaKey, url })
        }
        // Loader itself has some async work and no need to display loading fallback
        return (
            <Suspense fallback={null}>
                <ExternalPluginLoader plugins={JSX} />
            </Suspense>
        )
    },
    CompositionDialogEntry: { label: '\uD83E\uDDE9 Third-party Plugins', dialog: ThirdPartyPluginCompositionEntry },
    CompositionDialogMetadataBadgeRender: (key, val) =>
        key.startsWith('plugin:')
            ? {
                  text: `External plugin (${key.slice('plugin:'.length)})`,
                  tooltip: `It's inner content: ${JSON.stringify(val)}`,
              }
            : null,
}

export default sns
// plugin:dimensiondev.github.io/Mask-Plugin-Example/@v1
function parse(x: string) {
    // eslint-disable-next-line prefer-const
    let [address, ...key] = x.slice('plugin:'.length).split('@')
    if (!address.endsWith('/')) address += '/'
    const isLocalhost = new URL('https://' + address).hostname
    return [(isLocalhost ? 'http://' : 'https://') + address, key.join('@')]
}
