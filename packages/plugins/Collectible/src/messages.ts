import { PLUGIN_ID } from './constants.js'
import { createPluginMessage, createPluginRPC } from '@masknet/plugin-infra'

if (import.meta.webpackHot) import.meta.webpackHot.accept()

const PluginCollectibleMessage = createPluginMessage(PLUGIN_ID)

export const PluginCollectibleRPC = createPluginRPC(
    PLUGIN_ID,
    () => import('./services.js'),
    PluginCollectibleMessage.rpc,
)
