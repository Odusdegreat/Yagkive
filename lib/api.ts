const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export interface ApiProduct {
  _id: string;
  name: string;
  ref: string;
  note: string;
  description: string;
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  isPublished: boolean;
  images: Array<{ url: string; alt?: string }>;
  category?: { name: string; slug: string };
}
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  wishlist: string[];
}
export interface ApiCartItem {
  _id: string;
  quantity: number;
  product: ApiProduct | null;
  size?: string;
  color?: string;
}
export interface VerifiedOrder {
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  currency: string;
  createdAt: string;
  items: Array<{
    name: string;
    image?: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
}
export interface CountryLocation {
  code: string;
  name: string;
  dialCode: string;
  phoneFormat: string;
  flagEmoji: string;
  flagImage: string;
}
export interface CheckoutQuote {
  fingerprint: string;
  total: number;
  shippingFee: number;
  currency: string;
  chargeAmount: number;
  chargeCurrency: string;
  exchangeRate: number;
  quoteToken: string;
}
interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
let refreshPromise: Promise<Response> | null = null;
async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (
    response.status === 401 &&
    !["/auth/refresh", "/auth/login", "/auth/register"].includes(path) &&
    !retried
  ) {
    refreshPromise ??= fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).finally(() => {
      refreshPromise = null;
    });
    if ((await refreshPromise).ok) return request<T>(path, options, true);
  }
  let result: ApiResult<T>;
  try {
    result = (await response.json()) as ApiResult<T>;
  } catch {
    throw new ApiError(
      "The service returned an unexpected response. Please retry.",
      response.status,
    );
  }
  if (!response.ok || !result.success)
    throw new ApiError(result.message || "Request failed", response.status);
  return result.data;
}
export const api = {
  products: async () => {
    const products: ApiProduct[] = [];
    let page = 1;
    let pages = 1;
    do {
      const data = await request<{
        products: ApiProduct[];
        pagination: { pages: number };
      }>(`/products?limit=100&page=${page}`);
      products.push(...data.products);
      pages = data.pagination.pages;
      page++;
    } while (page <= pages);
    return { products };
  },
  categories: () =>
    request<Array<{ name: string; slug: string }>>("/categories"),
  session: () => request<{ user: SessionUser }>("/auth/me"),
  login: (email: string, password: string) =>
    request<{ user: SessionUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ user: SessionUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  logout: () => request<undefined>("/auth/logout", { method: "POST" }),
  cart: () => request<{ items: ApiCartItem[] }>("/cart"),
  addCartItem: (
    productId: string,
    quantity = 1,
    size?: string,
    color?: string,
  ) =>
    request<{ items: ApiCartItem[] }>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, size, color }),
    }),
  updateCartItem: (itemId: string, quantity: number) =>
    request<{ items: ApiCartItem[] }>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (itemId: string) =>
    request<{ items: ApiCartItem[] }>(`/cart/items/${itemId}`, {
      method: "DELETE",
    }),
  wishlist: () => request<ApiProduct[]>("/wishlist"),
  toggleWishlist: (productId: string) =>
    request<{ wishlisted: boolean }>(`/wishlist/${productId}`, {
      method: "PUT",
    }),
  quote: () => request<CheckoutQuote>("/orders/quote"),
  checkout: (
    shippingAddress: Record<string, string>,
    quoteToken: string,
    key: string,
  ) =>
    request<{ payment: { authorization_url: string } }>("/orders", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify({ shippingAddress, quoteToken }),
    }),
  verifyPayment: (reference: string) =>
    request<VerifiedOrder>(`/payments/verify/${encodeURIComponent(reference)}`),
  countries: () => request<CountryLocation[]>("/locations/countries"),
  formatPhone: (countryCode: string, phone: string) =>
    request<{ e164: string; international: string; isValid: boolean }>(
      "/locations/phones/format",
      { method: "POST", body: JSON.stringify({ countryCode, phone }) },
    ),
};
