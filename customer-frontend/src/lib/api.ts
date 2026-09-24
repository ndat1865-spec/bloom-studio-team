/**
 * Client API tap trung cho toan bo frontend.
 *
 * - Chi tro toi api-gateway (VITE_API_BASE_URL). Frontend KHONG bao gio biet
 *   auth-service / product-service / order-service chay o cong nao.
 * - Tu dinh kem "Authorization: Bearer <token>" neu da dang nhap.
 * - Gap 401 (token het han hoac hong) thi tu dang xuat va dua ve /login.
 * - Voi FormData KHONG tu dat Content-Type de trinh duyet tu sinh multipart boundary
 * - Xu ly duoc body rong (204 No Content) — khong goi response.json() vo dieu kien
 */

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
export const SERVER_ORIGIN = RAW_BASE.replace(/\/+$/, "");
export const API_BASE = `${SERVER_ORIGIN}/api`;

/** Key localStorage dung chung giua AuthContext va tang goi API nay. */
export const TOKEN_KEY = "bloom_token";
export const USER_KEY = "bloom_user";

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Loi mang / khong ket noi duoc server — phan biet voi loi HTTP co ma trang thai. */
export class NetworkError extends Error {
  constructor(message = "Khong thể kết nối tới server. Kiểm tra backend đã chạy chưa.") {
    super(message);
    this.name = "NetworkError";
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

function messageFor(status: number, payload: unknown): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const m = (payload as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (typeof payload === "string" && payload.trim()) return payload;
  switch (status) {
    case 400:
      return "Dữ liệu gửi lên không hợp lệ.";
    case 401:
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    case 403:
      return "Tài khoản của bạn không có quyền thực hiện thao tác này.";
    case 404:
      return "Không tìm thấy dữ liệu.";
    case 409:
      return "Dữ liệu bị trùng hoặc đang được tham chiếu.";
    default:
      return `Lỗi máy chủ (HTTP ${status}).`;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  const url = new URL(API_BASE + path);

  // Khong con ?role=ADMIN nhu ban monolith: role nam trong JWT da duoc
  // auth-service ky, backend tu doc ra chu khong tin tham so client gui.
  const headers: Record<string, string> = {};
  const token = readToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    // Khong dat Content-Type: de trinh duyet tu sinh boundary cua multipart
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), { method, headers, body: payload, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new NetworkError();
  }

  // 204 No Content va cac phan hoi rong: khong parse JSON
  const isEmpty =
    response.status === 204 || response.headers.get("content-length") === "0";
  const contentType = response.headers.get("content-type") ?? "";

  let data: unknown = null;
  if (!isEmpty) {
    const text = await response.text();
    if (text.length > 0) {
      data = contentType.includes("application/json") ? safeJson(text) : text;
    }
  }

  if (response.status === 401) {
    // Token het han / khong hop le -> xoa phien va dua ve trang dang nhap.
    // Backend phai tra dung 401 o day: mac dinh Spring Security tra 403 cho ca
    // truong hop thieu token, nen moi SecurityConfig deu khai authenticationEntryPoint.
    clearStoredAuth();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    const fieldErrors =
      data && typeof data === "object" && "fieldErrors" in data
        ? ((data as { fieldErrors?: Record<string, string> }).fieldErrors ?? undefined)
        : undefined;
    throw new ApiError(response.status, messageFor(response.status, data), fieldErrors);
  }

  return data as T;
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* che do rieng tu: bo qua */
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ============================================================
   Kieu du lieu khop voi response cua backend
   ============================================================ */

export type CategorySummary = { id: number; name: string };

export type Product = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  /** Backend van tra truong nay tu dau; truoc day kieu o day thieu nen khong ai dung toi. */
  stockQuantity: number;
  imageUrl: string | null;
  category: CategorySummary | null;
};

export type Category = { id: number; name: string; productCount: number };

/**
 * Khoa API cua doi tac. KHONG co truong keyValue — backend chi luu SHA-256 nen
 * khoa goc khong ton tai de ma tra ve. keyPrefix chi du de nhan ra dong nao la khoa nao.
 */
export type ApiKey = {
  id: number;
  keyPrefix: string;
  ownerName: string;
  scopes: string[];
  status: "ACTIVE" | "REVOKED";
  usable: boolean;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
};

/** Chi tra ve dung mot lan, ngay sau khi cap khoa. */
export type ApiKeyCreated = { keyValue: string; warning: string; key: ApiKey };

export type CreateApiKeyPayload = {
  ownerName: string;
  scopes: string[];
  /** null = khong het han. */
  daysValid: number | null;
};

export type Page<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

/**
 * Tai khoan dang nhap + ho so.
 *
 * Cac truong ho so co the null: tai khoan tao truoc khi co tinh nang ho so
 * van dang nhap binh thuong, chi la chua dien gi.
 */
export type AuthUser = {
  id: number;
  username: string;
  role: "ADMIN" | "CUSTOMER";
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  /** Ho ten that neu co, khong thi username. Backend tinh san. */
  displayName?: string | null;
  /** Da du phone + address de dien san form thanh toan chua. */
  hasDefaultAddress?: boolean;
};

/** Body cua PUT /users/{id}/profile. Chuoi rong = xoa trong truong do. */
export type ProfilePayload = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
};

/* ---- Tong quan ADMIN: PHAN MO RONG ngoai SOS01-SOS10 ---- */

/**
 * Ket qua POST /api/auth/login.
 *
 * Chi co token va vai thong tin toi thieu — KHONG co ho so day du va tuyet doi
 * khong co password. Ho so lay rieng bang getMe() sau khi da co token.
 */
export type LoginResponse = {
  userId: number;
  token: string;
  username: string;
  role: "ADMIN" | "CUSTOMER";
};

/** Phan so lieu do order-service tu tinh duoc tren CSDL cua chinh no. */
export type OrderOverview = Omit<
  AdminOverview,
  "totalProducts" | "totalCategories" | "totalCustomers"
>;

export type AdminOverview = {
  from: string;
  to: string;
  revenue: number;
  cancelledValue: number;
  averageOrderValue: number;
  orderCount: number;
  pendingCount: number;
  confirmedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  daily: { date: string; revenue: number; orders: number }[];
  topProducts: { productId: number; name: string; quantity: number; revenue: number }[];
  totalProducts: number;
  totalCategories: number;
  totalCustomers: number;
};

/* ---- Don hang: PHAN MO RONG ngoai SOS01-SOS10 ---- */

export type OrderItem = {
  id: number;
  productId: number | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string | null;
};

export type Order = {
  id: number;
  code: string;
  customerName: string;
  phone: string;
  address: string;
  note: string | null;
  deliveryDate: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: string;
  username: string | null;
  items: OrderItem[];
};

export type CreateOrderPayload = {
  customerName: string;
  phone: string;
  address: string;
  note: string | null;
  deliveryDate: string | null;
  /** CHI productId + quantity. Gia do backend tu doc tu CSDL va tinh lai. */
  items: { productId: number; quantity: number }[];
};

export type ProductQuery = {
  name?: string;
  categoryId?: number | null;
  page?: number;
  size?: number;
  sort?: string;
};

/* ============================================================
   Ham goi API theo tung nhom chuc nang
   ============================================================ */

export const api = {
  /**
   * Dang nhap. Tra ve JWT da ky chu KHONG tra ve ca ho so nhu ban monolith —
   * ho so lay rieng bang getMe() sau khi da co token.
   */
  login(username: string, password: string, signal?: AbortSignal) {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { username, password },
      signal,
    });
  },

  /**
   * SOS08 (phan tu nghien cuu) — dang ky tai khoan.
   * Backend luon gan role CUSTOMER, khong nhan role tu client.
   */
  register(username: string, password: string, signal?: AbortSignal) {
    return request<AuthUser>("/auth/register", {
      method: "POST",
      body: { username, password },
      signal,
    });
  },

  /**
   * Ho so cua chinh nguoi dang dang nhap.
   * Khong con truyen id tren URL nhu ban monolith: backend lay id tu token,
   * nen khong the doi so tren URL de xem ho so nguoi khac (lo hong IDOR).
   */
  getMe(signal?: AbortSignal) {
    return request<AuthUser>("/auth/me", { signal });
  },

  /**
   * Cap nhat ho so + dia chi mac dinh.
   * KHONG dung duoc de doi username/password/role — backend co endpoint rieng cho viec do.
   */
  updateProfile(payload: ProfilePayload, signal?: AbortSignal) {
    return request<AuthUser>("/auth/me/profile", {
      method: "PUT",
      body: payload,
      signal,
    });
  },

  /**
   * Don hang cua chinh toi. Khong con gui userId len nua — backend lay tu token,
   * nen khong the sua userId de xem don cua nguoi khac.
   */
  listMyOrders(page = 0, size = 10, signal?: AbortSignal) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return request<Page<Order>>(`/orders/my?${params}`, { signal });
  },

  /**
   * So lieu trang Tong quan cua ADMIN.
   *
   * Ban monolith co san GET /admin/overview dem tat ca bang mot cau truy van tren
   * cung mot CSDL. Sau khi tach, du lieu nam o ba CSDL khac nhau nen khong lam
   * vay duoc nua. Cach ghep:
   *   - So lieu don hang (doanh thu, bieu do ngay, top san pham): order-service
   *     tu tinh tren DB cua no va tra ve qua GET /api/orders/overview.
   *   - Ba con so tong (san pham, danh muc, khach hang): frontend goi song song
   *     ba service roi ghep lai o day.
   *
   * Day la API composition phia client — xem docs/blueprint-api.md.
   */
  async getAdminOverview(from?: string, to?: string, signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();

    const [orderStats, products, categories, users] = await Promise.all([
      request<OrderOverview>(`/orders/overview${query ? `?${query}` : ""}`, { signal }),
      // size=1: chi can totalElements, khong can tai ve ca danh sach
      request<Page<Product>>("/products?page=0&size=1", { signal }),
      request<Category[]>("/categories", { signal }),
      request<AuthUser[]>("/users", { signal }),
    ]);

    return {
      ...orderStats,
      totalProducts: products.totalElements,
      totalCategories: categories.length,
      totalCustomers: users.filter((u) => u.role === "CUSTOMER").length,
    } satisfies AdminOverview;
  },

  listProducts(query: ProductQuery = {}, signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (query.name?.trim()) params.set("name", query.name.trim());
    if (query.categoryId != null) params.set("categoryId", String(query.categoryId));
    params.set("page", String(query.page ?? 0));
    params.set("size", String(query.size ?? 6));
    if (query.sort) params.set("sort", query.sort);
    return request<Page<Product>>(`/products?${params.toString()}`, { signal });
  },

  getProduct(id: number, signal?: AbortSignal) {
    return request<Product>(`/products/${id}`, { signal });
  },

  createProduct(product: ProductPayload) {
    return request<Product>("/products", { method: "POST", body: product });
  },

  updateProduct(id: number, product: ProductPayload) {
    return request<Product>(`/products/${id}`, { method: "PUT", body: product });
  },

  deleteProduct(id: number) {
    return request<void>(`/products/${id}`, { method: "DELETE" });
  },

  /**
   * SOS07/SOS09 — luu file va cap nhat imageUrl, tra ve san pham da cap nhat.
   *
   * role duoc gui DUY NHAT mot lan, trong form-data, dung nhu admin.js cua SOS09.
   * KHONG truyen them options.role: neu gui ca query param lan form field, Spring gop
   * hai gia tri thanh chuoi "ADMIN,ADMIN" va phep so sanh voi "ADMIN" se that bai (403).
   */
  uploadProductImage(id: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<Product>(`/products/${id}/upload-image`, { method: "POST", body: form });
  },

  /* ---- Don hang (phan mo rong) ---- */

  createOrder(payload: CreateOrderPayload) {
    return request<Order>("/orders", { method: "POST", body: payload });
  },

  getOrder(id: number, signal?: AbortSignal) {
    return request<Order>(`/orders/${id}`, { signal });
  },

  listOrders(page = 0, size = 10, signal?: AbortSignal) {
    return request<Page<Order>>(`/orders?page=${page}&size=${size}`, { signal });
  },

  updateOrderStatus(id: number, status: string) {
    return request<Order>(`/orders/${id}/status`, { method: "PUT", body: { status } });
  },

  listCategories(signal?: AbortSignal) {
    return request<Category[]>("/categories", { signal });
  },

  createCategory(name: string) {
    return request<Category>("/categories", { method: "POST", body: { name } });
  },

  updateCategory(id: number, name: string) {
    return request<Category>(`/categories/${id}`, { method: "PUT", body: { name } });
  },

  deleteCategory(id: number) {
    return request<void>(`/categories/${id}`, { method: "DELETE" });
  },

  // ---------- API Key doi tac (ADMIN) ----------

  listApiKeys() {
    return request<ApiKey[]>("/api-keys");
  },

  /**
   * Phan hoi chua keyValue — LAN DUY NHAT khoa goc roi khoi he thong.
   * Khong luu lai o bat cu dau, chi hien cho ADMIN chep.
   */
  createApiKey(payload: CreateApiKeyPayload) {
    return request<ApiKeyCreated>("/api-keys", { method: "POST", body: payload });
  },

  revokeApiKey(id: number) {
    return request<ApiKey>(`/api-keys/${id}/revoke`, { method: "POST" });
  },

  deleteApiKey(id: number) {
    return request<void>(`/api-keys/${id}`, { method: "DELETE" });
  },
};

export type ProductPayload = {
  name: string;
  price: number;
  description: string;
  /** Bat buoc — backend co @NotNull, thieu truong nay la 400 cho moi lenh luu. */
  stockQuantity: number;
  category: { id: number } | null;
};
