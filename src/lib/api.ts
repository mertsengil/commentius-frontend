// lib/api.ts
import { toast } from "sonner";
import { getToken, removeToken } from "@/lib/auth";
import type { Card } from "@/types/card";
import type { User } from "@/types/user";
import type { ApiKey } from "@/types/api-key";
import type { ReportSummary, ReportDetail } from '@/types/reports'
import type { BusinessWithCards } from "@/types/business";
import { AspectListResponse, AspectStat, AspectDetailResponse } from '@/types/aspect';
import type { PaginatedReviewResponse } from '@/features/reviews/reviewsSlice'
import type { LastReview } from '@/types/review';
import type { RadarSeries } from '@/features/dashboard/dashboardSlice'


import type {

  CategorySummary,
  CategoryDetailResponse,
} from '@/types/category';


// ----------------------------------------------------------------------------
// Generic API response wrapper
// ----------------------------------------------------------------------------
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// ----------------------------------------------------------------------------
// Core fetch helper (always adds Authorization header if token exists)
// ----------------------------------------------------------------------------
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://shipsupply.kodlanabilir.com";

async function apiRequest<T>(
  endpoint: string,
  {
    method = "GET",
    body,
    headers = {},
  }: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Add selected business id from localStorage if exists
  if (typeof window !== 'undefined') {
    const selectedBusinessId = localStorage.getItem('selected_business_id');
    if (selectedBusinessId) {
      defaultHeaders['x-business-id'] = selectedBusinessId;
    }
  }

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: defaultHeaders,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    console.error("Network error:", e);
    toast.error("Sunucuyla bağlantı kurulamadı");
    return { data: null, error: "Sunucuyla bağlantı kurulamadı", status: 0 };
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    await res.text();
    return { data: null, error: "Sunucudan geçersiz yanıt alındı", status: res.status };
  }

  const json = await res.json();

  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    return { data: null, error: "Oturum süresi doldu", status: 401 };
  }

  if (!res.ok) {
    const msg = json.message || "İşlem sırasında bir hata oluştu";
    toast.error(msg);
    return { data: null, error: msg, status: res.status };
  }

  return { data: json as T, error: null, status: res.status };
}

// ----------------------------------------------------------------------------
// CRUD convenience wrappers
// ----------------------------------------------------------------------------
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "GET" }),
  post: <T, U>(endpoint: string, body: U) =>
    apiRequest<T>(endpoint, { method: "POST", body }),
  put: <T, U>(endpoint: string, body: U) =>
    apiRequest<T>(endpoint, { method: "PUT", body }),
  patch: <T, U>(endpoint: string, body: U) =>
    apiRequest<T>(endpoint, { method: "PATCH", body }),
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
};

// ----------------------------------------------------------------------------
// Authentication endpoints
// ----------------------------------------------------------------------------
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }, { email: string; password: string }>(
      "/auth/login",
      { email, password }
    ),
  me: () => api.get<User>("/auth/me"),
  logout: () => api.post<void>("/auth/logout", {}),
};

// ----------------------------------------------------------------------------
// Cards endpoints

export const cardsAPI = {
  /* mevcut metodlar */
  fetchAll: () => api.get<Card[]>("/cards"),
  fetchById: (id: number) => api.get<Card>(`/cards/${id}`),

  // ✅ YENİ: Business rolü için detay
  // /cards/business/:id → { card:{…}, relatedCards:[…] }
  fetchByIdForBusiness: (id: number) =>
    api.get<{ card: Card; relatedCards: Card[] }>(`/cards/${id}`),

  fetchByBusiness: (businessId: number) =>
    api.get<Card[]>(`/cards`),



  create: (data: { redirect_url: string; businessId: number }) =>
    api.post<Card, typeof data>("/cards", data),

  update: (id: number, data: { redirect_url: string }) =>
    api.put<Card, typeof data>(`/cards/${id}`, data),

  remove: (id: number) => api.delete<{ message: string }>(`/cards/${id}`),
  /* cardsAPI.ts */

  fetchBusinessDashboard: () =>
    api.get<{
      cardCount: number;
      readCountByCard: {
        card: {
          id: number;
          name: string;
          redirect_url: string;
          created_at: string;
        };
        readCount: number;
      }[];
      cardReads: {
        id: number;
        readAt: string;
        userAgent: string;
        ip: string;
        cardId: number;
      }[];
    }>('/cards/reports'),
  fetchCardReads: (id: number) =>
    api.get<{ business: any[]; reads: any[] }>(`/cards/${id}`)
};




// ----------------------------------------------------------------------------
// Businesses endpoints
// ----------------------------------------------------------------------------
export const businessAPI = {
  fetchAll: () => api.get<BusinessWithCards[]>("/business"),
  fetchById: (id: number) => api.get<BusinessWithCards>(`/business/${id}`),
  create: (data: { name: string; email: string; password: string }) =>
    api.post<BusinessWithCards, typeof data>("/business", data),
  update: (
    id: number,
    data: {
      name?: string;
      email?: string;
      password?: string;
      active?: boolean;
    }
  ) =>
    api.put<BusinessWithCards, typeof data>(`/business/${id}`, data),
  remove: (id: number) => api.delete<{ message: string }>(`/business/${id}`),
  // fetch one business *including* its `cards[]`
  getWithCards: (id: number) => api.get<BusinessWithCards>(`/business/${id}`),

  enqueue: (businessId: number | string, mode: 'incremental' | 'full') =>
    api.post<void, void>(`/reviews/enqueue/${businessId}/${mode}`, undefined),

  fetchUnassigned: () => api.get<BusinessWithCards[]>('/business/unassigned'),

  bulkUpdate: (payload: { ids: number[]; dto: Partial<Omit<Business, 'id'>> }) =>
    api.put<BusinessWithCards[], typeof payload>('/business/bulk', payload),
};

export const reviewsAPI = {
  /**
   * Yorumları sayfalı getirir.
   * -> GET /business/reviews?page=1&limit=10
   */
  updateReply: (id: number, content: string) =>
    api.put<{ id: number; reviewId: number; content: string }, { content: string }>(
      `/reviews-replys/${id}`,
      { content }
    ),

  /** Dashboard için özet veriler  -> GET /reviews/dashboard */
  getDashboard: () =>
    api.get<{
      lastReviews: LastReview[];
      topAspects: AspectStat[];
    }>('/reviews/dashboard'),

  fetchPaged: (params: { page?: number; limit?: number } = {}) => {
    const page = params.page ?? 1
    const limit = params.limit ?? 10
    const qs = `?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`
    return api.get<PaginatedReviewResponse>(`/reviews${qs}`)
  },

  getCategoriesAll: () =>
    api.get<{
      /** endpoint artık DİZİ döndürüyor */
      name: string;
      categoryStats: {
        category: string;
        positiveReviews: number;
        negativeReviews: number;
        neutralReviews: number;
      }[];
    }[]>('/reviews/categories/all'),

  getAspectCompare: (businessIds?: number[]) => {
    const qs = businessIds && businessIds.length
      ? `?businessIds=${businessIds.join(',')}`
      : '';
    return api.get<{
      businessNamesWithIds: { id: number; name: string }[];
      datas: {
        aspect: string;
        stats: Record<number,
          { positive: number; negative: number; neutral: number }>;
      }[];
    }>(`/reviews/aspects/compare${qs}`);
  },
};
export const aiRepliesAPI = {

  generate: (reviewId: number) =>
    api.post<
      { reviewId: number; content: string; tokensLeft: number },
      undefined
    >(`/reviews-replys/${reviewId}`, undefined),
};


// src/lib/api.ts (veya apiKeysAPI tanımladığınız dosya)
export const apiKeysAPI = {
  fetchAll: () => api.get<ApiKey[]>('/apify-tokens'),
  fetchById: (id: number) => api.get<ApiKey>(`/apify-tokens/${id}`),
  create: (token: string) => api.post<ApiKey, { token: string }>('/apify-tokens', { token }),
  update: (id: number, token: string) => api.put<ApiKey, { token: string }>(`/apify-tokens/${id}`, { token }),
  remove: (id: number) => api.delete<{ message: string }>(`/apify-tokens/${id}`),

  /* ⬇️ YENİ: kullanım/bakiye yenile */
  refreshUsage: (id: number) =>
    api.get<{ balance: number }>(`/apify-tokens/${id}/usage`),
};

/* ------------------------------------------------------------------ */
/*  src/lib/api/categoriesAPI.ts (veya ilgili dosyan)                 */
/* ------------------------------------------------------------------ */
export const categoriesAPI = {
  /* /reviews/category → CategorySummary[] */
  fetchAll: () =>
    api
      .get<{ categoryStats: CategorySummary[] }>('/reviews/categories')
      .then(r => r.data.categoryStats),

  /* /reviews/category/:category → CategoryDetailResponse */
  fetchDetail: (category: string) =>
    api
      .get<CategoryDetailResponse>(
        `/reviews/categories/${encodeURIComponent(category)}`,
      )
      .then(r => r.data),               // ← SADECE VERİYİ DÖN!
};
import type { AspectStat, AspectDetailResponse } from '@/types/aspect';

export const aspectAPI = {
  fetchAll: () =>
    api
      .get<AspectListResponse>('/reviews/aspect')
      .then(r => r.data),          // TAM objeyi döndür
  fetchDetail: (id: number | string) =>
    api
      .get<AspectDetailResponse>(`/reviews/aspect/${id}`)
      .then(res => res.data),
};

export const reportsAPI = {
  /** Liste için: sadece id ve meta bilgilerini döner */
  fetchAll: () =>
    api
      .get<ReportSummary[]>('/reviews/reports')
      .then(res => res.data),

  /** Tek bir raporun detayını döner */
  fetchById: (id: number | string) =>
    api
      .get<ReportDetail>(`/reviews/reports/${id}`)
      .then(res => res.data),
};


export const usersAPI = {
  /** Tüm kullanıcılar */
  fetchAll: () => api.get<User[]>('/users'),

  /** Yeni kullanıcı oluştur (şifre zorunluysa ekle) */
  create: (data: Pick<User, 'name' | 'email' | 'password' | 'role'>) =>
    api.post<User, typeof data>('/users', data),

  /** Güncelle */
  update: (id: number, data: Partial<Omit<User, 'id'>>) =>
    api.put<User, typeof data>(`/users/${id}`, data),

  /** Sil */
  remove: (id: number) =>
    api.delete<{ message: string }>(`/users/${id}`),
}