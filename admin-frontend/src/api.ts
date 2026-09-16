export type Product = { id: number; name: string; price: number; categoryId: number; stockQuantity: number };
export type DemoOrder = { id: string; productName: string; quantity: number; total: number; status: string };
export type Profile = { id: number; username: string; role: string };
export type Session = { token: string; user: Profile };
export type Quote = { productId: number; productName: string; quantity: number; unitPrice: number; total: number; note: string };
export const API_URL = "http://localhost:18080/api";
export const demoProducts: Product[] = [
  { id: 1, name: "Bo hong do", price: 350000, categoryId: 1, stockQuantity: 20 },
  { id: 2, name: "Gio huong duong", price: 420000, categoryId: 2, stockQuantity: 12 },
  { id: 3, name: "Chau lan trang", price: 650000, categoryId: 3, stockQuantity: 8 },
];
export const demoOrders: DemoOrder[] = [
  { id: "DEMO-001", productName: "Bo hong do", quantity: 2, total: 700000, status: "DEMO" },
];
export const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(8000),
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
  } catch {
    throw new Error("Chưa kết nối được Gateway ở cổng 18080. Hãy chạy backend hoặc chuyển sang Demo.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? (data ? Object.values(data).join("; ") : "Yêu cầu thất bại: " + response.status));
  }
  return data as T;
}

