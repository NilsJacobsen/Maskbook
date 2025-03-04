import { createPluginMessage, type PluginMessageEmitter, createPluginRPC } from '@masknet/plugin-infra'
import { serializer } from '@masknet/shared-base'
import { PLUGIN_ID } from './constants.js'
export interface PetMessage {
    setResult: number
    rpc: unknown
}

if (import.meta.webpackHot) import.meta.webpackHot.accept()
export const PluginMessages: {
    events: PluginMessageEmitter<PetMessage>
} = {
    events: createPluginMessage<PetMessage>(PLUGIN_ID, serializer),
}

export const PluginScamRPC = createPluginRPC(PLUGIN_ID, () => import('./Services/index.js'), PluginMessages.events.rpc)
