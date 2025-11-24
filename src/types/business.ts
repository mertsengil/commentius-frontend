// types/business.ts
export interface BusinessWithCards {
    id: number
    name: string
    email: string
    role: string
    active: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null

    // bu uç noktadan gelecektir:
    cards: Array<{
        id: number
        redirect_url: string
        created_at: string
        deleted_at: string | null
    }>
}
export interface Business {
    id: number;
    name: string;
    phone: string | null;
    logo: string | null;
    active: boolean;
    reviewReplyPrompt: string;
    reviewReplyAuto: boolean;
    googleMapsUrl: string | null;
    yemekSepetiUrl: string | null;
    canReviewPeriod: boolean;
    lastReviewPeriodDate: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    userId: number;
}