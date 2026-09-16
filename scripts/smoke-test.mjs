import assert from "node:assert/strict";

const base = "http://localhost:18080";
let passed = 0;
async function check(name, action) {
  await action();
  passed++;
  console.log("PASS " + name);
}
async function call(path, options = {}, expected = 200) {
  const response = await fetch(path.startsWith("http") ? path : base + path, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, expected, path + " HTTP " + response.status);
  return response;
}
async function json(path, options = {}, expected = 200) {
  return (await call(path, options, expected)).json();
}
const post = body => ({ method: "POST", body: JSON.stringify(body) });

try {
  for (const [port, service] of [[18080, "api-gateway"], [18081, "auth-service"], [18082, "product-service"], [18083, "order-service"]]) {
    await check(service + " khoi dong", async () => {
      const data = await json("http://localhost:" + port + "/health");
      assert.equal(data.status, "UP"); assert.equal(data.service, service);
    });
  }
  let token;
  await check("Dang nhap qua Gateway", async () => {
    const session = await json("/api/auth/login", post({ username: "demo", password: "bloom123" }));
    assert.equal(session.user.role, "CUSTOMER");
    assert.ok(!("passwordHash" in session.user)); assert.equal(session.token.split(".").length, 3);
    token = session.token;
  });
  await check("JWT /me", async () => {
    const user = await json("/api/auth/me", { headers: { Authorization: "Bearer " + token } });
    assert.equal(user.username, "demo");
  });
  await check("Thieu JWT -> 401", () => call("/api/auth/me", {}, 401));
  await check("Gia mao JWT -> 401", async () => {
    const parts = token.split(".");
    parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
    await call("/api/auth/me", { headers: { Authorization: "Bearer " + parts.join(".") } }, 401);
  });
  await check("Sai mat khau -> 401", () => call("/api/auth/login", post({ username: "demo", password: "wrong123" }), 401));
  const username = "test_" + Date.now();
  await check("Dang ky -> 201, khong nhan role tu client", async () => {
    const user = await json("/api/auth/register", post({ username, password: "test1234", role: "ADMIN" }), 201);
    assert.equal(user.role, "CUSTOMER");
  });
  await check("Trung tai khoan -> 409", () => call("/api/auth/register", post({ username, password: "test1234" }), 409));
  await check("Tai khoan moi dang nhap duoc", async () => {
    const session = await json("/api/auth/login", post({ username, password: "test1234" }));
    assert.equal(session.user.username, username);
  });
  await check("Validation tai khoan -> 400", () => call("/api/auth/register", post({ username: "x", password: "x" }), 400));
  let stock;
  await check("Danh sach san pham qua Gateway", async () => {
    const products = await json("/api/products");
    assert.equal(products.length, 3); assert.equal(products[0].price, 350000);
    stock = products[0].stockQuantity;
  });
  await check("Tim kiem giu query string", async () => {
    const products = await json("/api/products?name=HONG");
    assert.equal(products.length, 1); assert.equal(products[0].id, 1);
  });
  await check("San pham khong ton tai -> 404", () => call("/api/products/9999", {}, 404));
  await check("Danh muc qua Gateway", async () => assert.equal((await json("/api/categories")).length, 3));
  await check("Don mau doc lap", async () => assert.equal((await json("http://localhost:18083/orders/demo"))[0].status, "DEMO"));
  await check("Don mau qua Gateway", async () => assert.equal((await json("/api/orders/demo"))[0].id, "DEMO-001"));
  await check("Order goi Product, khong tin gia client", async () => {
    const quote = await json("/api/orders/preview", post({ productId: 1, quantity: 2, unitPrice: 1 }));
    assert.equal(quote.total, 700000); assert.equal(quote.unitPrice, 350000);
  });
  await check("Preview khong thay doi ton kho", async () => assert.equal((await json("/api/products/1")).stockQuantity, stock));
  await check("Vuot ton kho -> 409", () => call("/api/orders/preview", post({ productId: 1, quantity: 99 }), 409));
  await check("So luong 0 -> 400", () => call("/api/orders/preview", post({ productId: 1, quantity: 0 }), 400));
  await check("Thieu productId -> 400", () => call("/api/orders/preview", post({ quantity: 1 }), 400));
  await check("Preview san pham khong ton tai -> 404", () => call("/api/orders/preview", post({ productId: 9999, quantity: 1 }), 404));
  await check("JSON hong -> 400", () => call("/api/orders/preview", { method: "POST", body: "{" }, 400));
  for (const origin of ["http://localhost:15173", "http://localhost:15174", "http://127.0.0.1:15173", "http://127.0.0.1:15174"]) {
    await check("CORS " + origin, async () => {
      const response = await call("/api/auth/login", { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type,authorization" } });
      assert.equal(response.headers.get("access-control-allow-origin"), origin);
    });
  }
  await check("Origin la bi chan -> 403", () => call("/api/products", { headers: { Origin: "http://localhost:19999" } }, 403));
  await check("Khong route /internal -> 404", () => call("/internal/products/1", {}, 404));
  console.log("\n" + passed + " kiem tra HTTP dat.");
} catch (error) {
  console.error("\nFAIL sau " + passed + " kiem tra:", error);
  process.exitCode = 1;
}
