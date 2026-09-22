const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export interface ApiProduct { _id: string; name: string; ref: string; note: string; description: string; price: number; stock: number; images: Array<{ url: string; alt?: string }>; category?: { name: string; slug: string }; }
export interface SessionUser { id: string; name: string; email: string; role: "customer" | "admin"; wishlist: string[]; }
export interface ApiCartItem { _id: string; quantity: number; product: ApiProduct; size?: string; color?: string; }
export interface VerifiedOrder { orderNumber: string; status: string; total: number; subtotal: number; shippingFee: number; currency: string; createdAt: string; items: Array<{ name: string; image?: string; price: number; quantity: number; size?: string; color?: string }>; shippingAddress: { fullName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; country: string; postalCode?: string }; }
export interface CountryLocation { code: string; name: string; dialCode: string; phoneFormat: string; flagEmoji: string; flagImage: string; }
interface ApiResult<T> { success: boolean; message: string; data: T; }

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options.headers } });
  if (response.status === 401 && path !== "/auth/refresh" && !retried) {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } });
    if (refreshResponse.ok) return request<T>(path, options, true);
  }
  const result = await response.json() as ApiResult<T>;
  if (!response.ok || !result.success) throw new Error(result.message || "Request failed");
  return result.data;
}

export const api = {
  products: () => request<{ products: ApiProduct[] }>("/products?limit=100"),
  session: () => request<{ user: SessionUser }>("/auth/me"),
  login: (email: string, password: string) => request<{ user: SessionUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) => request<{ user: SessionUser }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  logout: () => request<undefined>("/auth/logout", { method: "POST" }),
  cart: () => request<{ items: ApiCartItem[] }>("/cart"),
  addCartItem: (productId: string, quantity = 1) => request<{ items: ApiCartItem[] }>("/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (itemId: string, quantity: number) => request<{ items: ApiCartItem[] }>(`/cart/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) }),
  removeCartItem: (itemId: string) => request<{ items: ApiCartItem[] }>(`/cart/items/${itemId}`, { method: "DELETE" }),
  wishlist: () => request<ApiProduct[]>("/wishlist"),
  toggleWishlist: (productId: string) => request<{ wishlisted: boolean }>(`/wishlist/${productId}`, { method: "PUT" }),
  checkout: (shippingAddress: Record<string, string>) => request<{ payment: { authorization_url: string } }>("/orders", { method: "POST", body: JSON.stringify({ shippingAddress }) }),
  verifyPayment: (reference: string) => request<VerifiedOrder>(`/payments/verify/${encodeURIComponent(reference)}`),
  countries: () => request<CountryLocation[]>("/locations/countries"),
  formatPhone: (countryCode: string, phone: string) => request<{ e164: string; international: string; isValid: boolean }>("/locations/phones/format", { method: "POST", body: JSON.stringify({ countryCode, phone }) }),
};
