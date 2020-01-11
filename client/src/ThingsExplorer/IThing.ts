import { Channel } from './Channel'

/**
 * Interface describing an openHAB Thing structure
 *
 * @author Kuba Wolanin - Initial contribution
 */
export interface IThing {

    statusInfo?: { status: string; statusDetail: string }

    editable?: boolean

    label?: string

    configuration?: any

    properties?: any

    UID?: string

    thingTypeUID?: string

    channels?: Channel[]
}