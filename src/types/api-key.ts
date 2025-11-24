export interface ApiKey {
    id: number
    token: string           // Tam token
    maskedKey: string       // UI’de göstermek için (••• ile)
    balance: string         // "12.34"
    createdAt: string
    updatedAt: string
}

export const maskToken = (t: string, visible = 3): string => {
    if (!t) return ''
    const head = t.slice(0, visible)
    const tail = t.slice(-visible)
    return `${head}${'•'.repeat(Math.max(0, t.length - 2 * visible))}${tail}`
}

/* Request body’ler */
export interface CreateApiKeyPayload { token: string }
export interface UpdateApiKeyPayload { token: string }
