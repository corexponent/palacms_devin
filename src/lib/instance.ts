import { self } from './pocketbase/PocketBase'

export type InstanceInfo = {
        id: string
        version: string
        telemetry_enabled: boolean
        smtp_enabled: boolean
}

let cachedInstance: InstanceInfo | undefined
let pendingRequest: Promise<InstanceInfo> | undefined

async function fetchInstanceInfo(): Promise<InstanceInfo> {
        const response = await fetch(new URL('/api/palacms/info', self.baseURL))

        if (!response.ok) {
                throw new Error('Failed to fetch instance info')
        }

        return response.json()
}

export async function getInstance(): Promise<InstanceInfo> {
        if (cachedInstance) {
                return cachedInstance
        }

        if (!pendingRequest) {
                pendingRequest = fetchInstanceInfo().then((info) => {
                        cachedInstance = info
                        return info
                })
        }

        return pendingRequest
}

export function clearInstanceCache(): void {
        cachedInstance = undefined
        pendingRequest = undefined
}
