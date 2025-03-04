import { useMount } from 'react-use'
import { type Unresolved, resolve } from '@masknet/shared-base'
import { type EventID, EventType } from '@masknet/web3-telemetry/types'
import { useTelemetry } from './useTelemetry.js'

/**
 * Log an access event
 */
export function useMountReport(eventID: Unresolved<EventID>) {
    const telemetry = useTelemetry()

    useMount(() => {
        telemetry.captureEvent(EventType.Access, resolve(eventID))
    })
}
