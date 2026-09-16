import { useEffect, useState, type FormEvent } from "react";
import { demoProducts, demoOrders, money, request, type Product, type DemoOrder, type Profile, type Session } from "./api";

export default function App() {
  const [live, setLive] = useState(false);
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [orders, setOrders] = useState<DemoOrder[]>(demoOrders);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [reload, setReload] = useState(0);
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("bloom123");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    setProfile(null); setError(""); setProducts([]); setOrders([]);
    if (!live) { setProducts(demoProducts); setOrders(demoOrders); setLoading(false); return; }
    setLoading(true);
    Promise.all([request<Product[]>("/products"), request<DemoOrder[]>("/orders/demo")])
      .then(([p, o]) => { if (active) { setProducts(p); setOrders(o); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [live, reload]);

  async function login(event: FormEvent) {
    event.preventDefault(); setError(""); setProfile(null); setSigning(true);
    try {
      const session = await request<Session>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      const user = await request<Profile>("/auth/me", { headers: { Authorization: "Bearer " + session.token } });
      setProfile(user);
    } catch (err) { setError((err as Error).message); }
    finally { setSigning(false); }
  }

  return <>
    <header><div><div className="brand">bloom studio.</div><p>Không gian quản trị · bản khởi đầu</p></div>
      <label>Nguồn dữ liệu<select aria-label="Nguồn dữ liệu" value={live ? "api" : "demo"} disabled={signing} onChange={e => setLive(e.target.value === "api")}><option value="demo">Demo · chạy độc lập</option><option value="api">API · kết nối Gateway</option></select></label>
    </header>
    <main>
      <span className="eyebrow">Tổng quan cửa hàng</span><h1>Mọi thứ trong tầm mắt.</h1>
      <div className="banner">{live ? "Sản phẩm và đơn mẫu được tải qua Gateway :18080." : "Chế độ demo: dữ liệu mẫu có sẵn, không cần backend."} Đây là giao diện chỉ đọc dữ liệu công khai/demo; chức năng quản trị có phân quyền sẽ làm ở bước sau.</div>
      <div className="stats"><div className="card stat">Mẫu hoa<strong>{products.length}</strong></div><div className="card stat">Tổng tồn kho mẫu<strong>{products.reduce((sum, p) => sum + p.stockQuantity, 0)}</strong></div><div className="card stat">Đơn minh họa<strong>{orders.length}</strong></div></div>
      <nav aria-label="Chức năng">{[["products", "Sản phẩm"], ["orders", "Đơn mẫu"], ["account", "Kết nối tài khoản"]].map(([id, label]) => <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); setError(""); }}>{label}</button>)}</nav>
      {error && <div role="alert" className="error">{error}</div>}
      {loading && <p role="status">Đang tải dữ liệu…</p>}
      {tab === "products" && <section className="panel"><div className="toolbar"><label>Tìm sản phẩm<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nhập tên hoa" /></label><button disabled={loading || signing} onClick={() => setReload(n => n + 1)}>Tải lại</button></div><div className="table-wrap"><table><thead><tr><th>Mã</th><th>Sản phẩm</th><th>Giá</th><th>Tồn kho</th></tr></thead><tbody>{products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => <tr key={p.id}><td>#{p.id}</td><td>{p.name}</td><td>{money(p.price)}</td><td>{p.stockQuantity}</td></tr>)}</tbody></table></div></section>}
      {tab === "orders" && <section className="panel"><h2>Đơn hàng minh họa</h2><p className="muted">Dữ liệu cố định để dựng giao diện, chưa có lưu đơn hàng.</p><div className="table-wrap"><table><thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Số lượng</th><th>Tổng</th><th>Trạng thái</th></tr></thead><tbody>{orders.map(o => <tr key={o.id}><td>{o.id}</td><td>{o.productName}</td><td>{o.quantity}</td><td>{money(o.total)}</td><td>{o.status}</td></tr>)}</tbody></table></div></section>}
      {tab === "account" && <section className="panel account"><h2>Thử kết nối Auth Service</h2><p className="muted">Chọn chế độ API để thử đăng nhập và xác thực JWT. Tài khoản demo mang quyền CUSTOMER, chưa có quyền quản trị.</p><form className="panel" onSubmit={login}><label>Tên đăng nhập<input autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} /></label><label>Mật khẩu<input autoComplete="current-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={!live || signing}>{signing ? "Đang đăng nhập…" : "Đăng nhập thử"}</button></form>{profile && <div role="status" className="banner">Đã xác thực: {profile.username} · {profile.role} · ID {profile.id}</div>}</section>}
      <footer>Phụ trách: Nguyễn Ngọc Minh Thu · Giai đoạn 1: bảng dữ liệu, đơn mẫu và kết nối tài khoản.</footer>
    </main>
  </>;
}

