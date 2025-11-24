// lib/auth.ts
import { User } from "../types/user";
import { Business } from "../types/business";

// LocalStorage anahtarları
export const TOKEN_KEY = "commentius_access_token";
export const USER_KEY = "commentius_user";
export const BUSINESSES = "commentius_businesses";

/**
 * Token ve kullanıcı bilgisini kaydeder.
 */
export function saveToken(token: string, user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Yeni: Business id ve name'leri ayrı kaydet
  if (user && user.businesses && Array.isArray(user.businesses)) {
    const businessList = (user.businesses as Business[]).map((b) => ({
      id: b.id,
      name: b.name,
    }));
    localStorage.setItem(BUSINESSES, JSON.stringify(businessList));
  } else {
    localStorage.removeItem(BUSINESSES);
  }
}

/**
 * Token ve kullanıcı bilgisini siler.
 */
export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Saklı access token'ı döner.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
/**
 * Saklı kullanıcı bilgisini döner.
 */
export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem(USER_KEY);
  try {
    return userJson ? (JSON.parse(userJson) as User) : null;
  } catch {
    return null;
  }
}
