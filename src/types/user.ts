// types/user.ts
import type { Business } from './business'

export type User = {
    id: number
    name: string
    email: string
    role: string
    reviewReplyTokens: number
    businesses: Business[]
    phone?: string | null
    created_at: string
    updated_at: string
    // backend’in döndürdüğü diğer alanlar (isteğe bağlı):
    // name?: string
    // roles?: string[]
    // createdAt?: string
    // vs.
}
