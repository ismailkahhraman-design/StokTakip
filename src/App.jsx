import React, { useEffect, useMemo, useState } from "react";

/**
 * Stok Takip Uygulaması – İyileştirilmiş Tasarım + Kullanıcı Yönetimi (BUGÜN ÇÖZÜMÜ)
 * - Light/Dark toggle (Tailwind: darkMode:'class')
 * - Daha okunaklı renkler (light: koyu metin, dark: açık metin)
 * - Modern buton ve kart stilleri
 * - Kullanıcılar paneli:
 *    * Herkes: Kendi şifresini değiştirebilir
 *    * Admin: Kullanıcı ekle/sil, rol değiştirme, şifre sıfırlama
 * - Veriler localStorage'da tutulur (LS_KEY = 'stokapp_v2')
 */

// --- Utilities ---
const LS_KEY = "stokapp_v2";
const THEME_KEY = "darkmode";
const nowIso = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleString();
const toCSV = (rows) => {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => String(v ?? "").replaceAll('"', '""');
  const lines = [headers.join(",")].concat(
    rows.map((r) => headers.map((h) => `"${esc(r[h])}"`).join(","))
  );
  return lines.join("\n");
};
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const obj = {};
    headers.forEach((h, i) => (obj[h] = (cols[i] ?? "").trim()));
    return obj;
  });
};

// --- Default Data ---
const defaultData = {
  users: [
    { username: "admin", password: "admin", role: "admin" },
    { username: "user", password: "user", role: "user" },
  ],
  warehouses: [],
  products: [],
  movements: [],
};

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed };
  } catch {
    return defaultData;
  }
}
function saveData(d) {
  localStorage.setItem(LS_KEY, JSON.stringify(d));
}

// --- Main App ---
export default function App() {
  const [data, setData] = useState(loadData);
  const [currentUser, setCurrentUser] = useState(null);
  const [dark, setDark] = useState(localStorage.getItem(THEME_KEY) === "true");
  const [showUsers, setShowUsers] = useState(false);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(THEME_KEY, dark);
  }, [dark]);

  const handleLogin = (u, p) => {
    const user = data.users.find((x) => x.username === u && x.password === p);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };
  const resetAll = () => {
    if (!confirm("Tüm veriler sıfırlansın mı?")) return;
    setData(defaultData);
    setCurrentUser(null);
  };

  if (!currentUser) return <LoginModal onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 selection:bg-yellow-200 selection:text-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Stok Takip</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm hidden sm:inline">Merhaba, <b>{currentUser.username}</b> ({currentUser.role})</span>
            <IconButton onClick={() => setShowUsers(true)} title="Kullanıcılar">👤</IconButton>
            <IconButton onClick={() => setDark(!dark)} title="Tema değiştir">{dark ? "☀️" : "🌙"}</IconButton>
            <Button variant="danger" onClick={resetAll} title="Tüm verileri sıfırla">Sıfırla</Button>
          </div>
        </header>

        <main className="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-5">
          <section className="xl:col-span-1 space-y-5">
            <Card title="Depo Yönetimi"><WarehouseManager data={data} setData={setData} /></Card>
            <Card title="İçe/Dışa Aktar"><ImportExport data={data} setData={setData} role={currentUser.role} /></Card>
            <Card title="Depolar Arası Transfer"><TransferForm data={data} setData={setData} role={currentUser.role} /></Card>
          </section>
          <section className="xl:col-span-2 grid grid-cols-1 gap-5">
            <Card title="Ürünler (Depo Bazlı Bakiye)"><ProductManager data={data} setData={setData} /></Card>
            <Card title="Stok Hareketleri"><MovementManager data={data} setData={setData} role={currentUser.role} /></Card>
          </section>
        </main>
      </div>

      {showUsers && (
        <UserManager
          data={data}
          setData={setData}
          currentUser={currentUser}
          onClose={() => setShowUsers(false)}
          onMe={(me)=>setCurrentUser(me)}
        />
      )}
    </div>
  );
}

// --- Shared UI ---
function Card({ title, children }) {
  return (
    <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
function Button({ children, onClick, variant="primary", className="", ...props }) {
  const base = "inline-flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium shadow-sm transition active:scale-95";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    neutral: "bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100",
  };
  return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}
function IconButton({ children, onClick, className="", ...props }) {
  return <button onClick={onClick} className={`px-2 py-1 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 shadow-sm transition active:scale-95 ${className}`} {...props}>{children}</button>;
}

function TextInput(props) {
  return <input {...props} className={`w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 ${props.className||""}`} />;
}
function Select(props) {
  return <select {...props} className={`w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 ${props.className||""}`} />;
}
function TextArea(props) {
  return <textarea {...props} className={`w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 font-mono ${props.className||""}`} />;
}

function LoginModal({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const submit = (e) => { e.preventDefault(); const ok = onLogin(u, p); if (!ok) setErr("Kullanıcı adı veya şifre hatalı"); };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        <h2 className="text-xl font-bold mb-4">Giriş Yap</h2>
        <div className="space-y-2 mb-2">
          <TextInput placeholder="Kullanıcı adı (admin/user)" value={u} onChange={(e) => setU(e.target.value)} />
          <TextInput type="password" placeholder="Şifre (admin/user)" value={p} onChange={(e) => setP(e.target.value)} />
        </div>
        {err && <p className="text-sm text-rose-600 mb-2">{err}</p>}
        <Button className="w-full">Giriş</Button>
        <p className="text-xs text-gray-500 mt-2">Demo: admin/admin veya user/user</p>
      </form>
    </div>
  );
}

// --- Warehouses ---
function WarehouseManager({ data, setData }) {
  const [name, setName] = useState("");
  const add = () => {
    const n = name.trim(); if (!n) return;
    const exists = data.warehouses.some((w) => w.name.toLowerCase() === n.toLowerCase());
    if (exists) return alert("Aynı isimde depo mevcut");
    const id = crypto.randomUUID();
    setData((d) => ({ ...d, warehouses: [...d.warehouses, { id, name: n }] }));
    setName("");
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <TextInput placeholder="Depo adı" value={name} onChange={(e) => setName(e.target.value)} />
        <Button variant="success" onClick={add}>Ekle</Button>
      </div>
      <ul className="list-disc pl-5 text-sm">
        {data.warehouses.map((w) => (<li key={w.id}>{w.name}</li>))}
      </ul>
    </div>
  );
}

// --- Products ---
function ProductManager({ data, setData }) {
  const [form, setForm] = useState({ id: null, sku: "", name: "", unit: "Adet", minStock: 0, warehouseId: "" });
  const save = () => {
    if (!form.sku.trim() || !form.name.trim()) return alert("Zorunlu alanlar boş");
    const exists = data.products.some((p) => p.sku.toLowerCase() === form.sku.toLowerCase() && p.id !== form.id);
    if (exists) return alert("Aynı SKU mevcut");
    if (form.id) {
      setData((d) => ({ ...d, products: d.products.map((x) => (x.id === form.id ? { ...form, minStock: Number(form.minStock) || 0 } : x)) }));
    } else {
      if (!form.warehouseId) return alert("Depo seçiniz (ilk stoğun tutulacağı depo)");
      const id = crypto.randomUUID();
      setData((d) => ({ ...d, products: [...d.products, { ...form, id, minStock: Number(form.minStock) || 0 }] }));
    }
    setForm({ id: null, sku: "", name: "", unit: "Adet", minStock: 0, warehouseId: "" });
  };
  const balances = useMemo(() => calcBalancesByWarehouse(data.products, data.movements), [data.products, data.movements]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
        <TextInput placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <TextInput placeholder="Ürün adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
        <TextInput placeholder="Birim (Adet/Kg/Koli)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <TextInput type="number" placeholder="Min stok" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
        <Select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
          <option value="">(İlk stok deposu) Depo seçiniz</option>
          {data.warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
        </Select>
        <div className="md:col-span-6"><Button onClick={save}>{form.id ? "Güncelle" : "Ekle"}</Button></div>
      </div>

      <div className="overflow-auto border border-gray-200 dark:border-gray-800 rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800/70">
            <tr>
              <th className="p-2 text-left">SKU</th>
              <th className="p-2 text-left">Ürün</th>
              {data.warehouses.map((w) => (<th key={w.id} className="p-2 text-right">{w.name}</th>))}
              <th className="p-2 text-right">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p) => {
              const row = balances[p.id] || {};
              const toplam = Object.values(row).reduce((a, b) => a + b, 0);
              const low = p.minStock && toplam < p.minStock;
              return (
                <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-2 font-mono">{p.sku}</td>
                  <td className="p-2">{p.name}</td>
                  {data.warehouses.map((w) => (
                    <td key={w.id} className={`p-2 text-right ${low ? 'text-rose-600 font-semibold' : ''}`}>{row[w.id] || 0}</td>
                  ))}
                  <td className={`p-2 text-right ${low ? 'text-rose-600 font-semibold' : ''}`}>{toplam}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Movements ---
function MovementManager({ data, setData, role }) {
  const [filter, setFilter] = useState({ from: "", to: "" });
  const movements = useMemo(() => {
    let arr = [...data.movements];
    if (filter.from) arr = arr.filter((m) => m.at >= filter.from);
    if (filter.to) arr = arr.filter((m) => m.at <= (filter.to.length === 10 ? filter.to + "T23:59:59" : filter.to));
    arr.sort((a, b) => new Date(b.at) - new Date(a.at));
    return arr;
  }, [data.movements, filter]);
  const editMove = (id) => {
    if (role !== "admin") return alert("Yetkiniz yok (sadece admin düzenleyebilir)");
    const m = data.movements.find((x) => x.id === id); if (!m) return;
    const qty = Number(prompt("Yeni miktar", m.qty)); if (!qty || qty <= 0) return;
    const note = prompt("Not (boş bırakılabilir)", m.note || "") || "";
    setData((d) => ({ ...d, movements: d.movements.map((x) => (x.id === id ? { ...x, qty, note } : x)) }));
  };
  const removeMove = (id) => {
    if (role !== "admin") return alert("Yetkiniz yok (sadece admin silebilir)");
    if (!confirm("Bu hareket silinsin mi?")) return;
    setData((d) => ({ ...d, movements: d.movements.filter((m) => m.id !== id) }));
  };
  const csvRows = movements.map((m) => ({
    type: m.type,
    product: data.products.find((p) => p.id === m.productId)?.name || m.productId,
    warehouse: data.warehouses.find((w) => w.id === m.warehouseId)?.name || m.warehouseId,
    qty: m.qty, at: m.at, note: m.note || "",
  }));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm">Başlangıç</label>
        <TextInput type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} className="w-auto" />
        <label className="text-sm">Bitiş</label>
        <TextInput type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} className="w-auto" />
        <Button variant="neutral" onClick={() => { setFilter({ from: "", to: "" }); }}>Temizle</Button>
        <Button variant="primary" onClick={() => downloadText(toCSV(csvRows), `hareketler_${new Date().toISOString().slice(0,10)}.csv`)}>CSV İndir</Button>
      </div>
      <div className="overflow-auto border border-gray-200 dark:border-gray-800 rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800/70">
            <tr>
              <th className="p-2 text-left">Tür</th>
              <th className="p-2 text-left">Ürün</th>
              <th className="p-2 text-left">Depo</th>
              <th className="p-2 text-right">Miktar</th>
              <th className="p-2 text-left">Not</th>
              <th className="p-2 text-left">Tarih</th>
              <th className="p-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => {
              const p = data.products.find((x) => x.id === m.productId);
              const w = data.warehouses.find((x) => x.id === m.warehouseId);
              return (
                <tr key={m.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className={`p-2 ${m.type === 'OUT' ? 'text-rose-600' : 'text-emerald-600'} font-semibold`}>{m.type}</td>
                  <td className="p-2">{p ? `${p.name} (${p.sku})` : "-"}</td>
                  <td className="p-2">{w?.name || "-"}</td>
                  <td className="p-2 text-right">{m.qty}</td>
                  <td className="p-2">{m.note || ""}</td>
                  <td className="p-2">{fmtDate(m.at)}</td>
                  <td className="p-2">
                    {role === "admin" ? (
                      <div className="flex gap-2">
                        <Button variant="neutral" onClick={() => editMove(m.id)}>Düzenle</Button>
                        <Button variant="danger" onClick={() => removeMove(m.id)}>Sil</Button>
                      </div>
                    ) : <span className="text-xs text-gray-500">Sadece görüntüleme</span>}
                  </td>
                </tr>
              );
            })}
            {movements.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-gray-500">Kayıt yok</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Transfer ---
function TransferForm({ data, setData, role }) {
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [prod, setProd] = useState(""); const [qty, setQty] = useState("");
  const submit = () => {
    if (role !== "admin") return alert("Sadece admin transfer yapabilir");
    const q = Number(qty); if (!from || !to || !prod || !q || q <= 0) return alert("Eksik veya hatalı alan");
    if (from === to) return alert("Kaynak ve hedef depo farklı olmalı");
    const idOut = crypto.randomUUID(); const idIn = crypto.randomUUID();
    setData((d) => ({ ...d, movements: [
      { id: idOut, type: "OUT", productId: prod, warehouseId: from, qty: q, note: "Transfer OUT", at: nowIso() },
      { id: idIn, type: "IN", productId: prod, warehouseId: to, qty: q, note: "Transfer IN", at: nowIso() },
      ...d.movements,
    ] })); setQty("");
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
      <Select value={from} onChange={(e) => setFrom(e.target.value)}><option value="">Kaynak depo</option>{data.warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}</Select>
      <Select value={to} onChange={(e) => setTo(e.target.value)}><option value="">Hedef depo</option>{data.warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}</Select>
      <Select value={prod} onChange={(e) => setProd(e.target.value)}><option value="">Ürün</option>{data.products.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.sku})</option>))}</Select>
      <TextInput type="number" placeholder="Miktar" value={qty} onChange={(e) => setQty(e.target.value)} />
      <Button variant="success" onClick={submit}>Transfer Yap</Button>
    </div>
  );
}

// --- Import/Export ---
function ImportExport({ data, setData, role }) {
  const downloadProductsCSV = () => {
    const rows = data.products.map((p) => ({
      id: p.id, sku: p.sku, name: p.name, unit: p.unit, minStock: p.minStock,
      warehouse: (data.warehouses.find((w) => w.id === p.warehouseId)?.name) || p.warehouseId,
    }));
    const csv = toCSV(rows); downloadText(csv, `urunler_${new Date().toISOString().slice(0, 10)}.csv`);
  };
  const downloadJSON = () => {
    const json = JSON.stringify(data, null, 2);
    downloadText(json, `stokveri_${new Date().toISOString().slice(0, 10)}.json`);
  };
  const [jsonText, setJsonText] = useState("");
  const importJSON = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object") throw new Error();
      if (!parsed.users || !parsed.warehouses || !parsed.products || !parsed.movements) throw new Error();
      if (!confirm("Mevcut verilerin ÜZERİNE yazılacak. Devam?")) return;
      setData(parsed); setJsonText(""); alert("JSON içe aktarma tamam");
    } catch { alert("Geçersiz JSON"); }
  };
  const onCSVChange = async (e) => {
    if (role !== "admin") return alert("Sadece admin CSV içe aktarabilir");
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text(); const rows = parseCSV(text);
    const need = ["sku", "name", "unit", "minStock", "warehouseName"];
    const ok = need.every((k) => Object.prototype.hasOwnProperty.call(rows[0] || {}, k));
    if (!ok) return alert("CSV başlıkları: sku,name,unit,minStock,warehouseName olmalı");
    let next = { ...data };
    for (const r of rows) {
      let wh = next.warehouses.find((w) => w.name.toLowerCase() === String(r.warehouseName || "").toLowerCase());
      if (!wh) { wh = { id: crypto.randomUUID(), name: r.warehouseName || "Genel" }; next.warehouses.push(wh); }
      const exists = next.products.some((p) => p.sku.toLowerCase() === String(r.sku).toLowerCase());
      if (exists) continue;
      next.products.push({ id: crypto.randomUUID(), sku: r.sku, name: r.name, unit: r.unit || "Adet", minStock: Number(r.minStock) || 0, warehouseId: wh.id });
    }
    setData(next); e.target.value = ""; alert("CSV içe aktarma tamamlandı");
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={downloadProductsCSV}>Ürünleri CSV İndir</Button>
        <Button variant="neutral" onClick={downloadJSON}>Tüm Veriyi JSON İndir</Button>
        <label className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer transition active:scale-95">
          CSV ile Ürün Yükle
          <input type="file" accept=".csv" className="hidden" onChange={onCSVChange} />
        </label>
      </div>
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">JSON İçe Aktar (yapıştır)</label>
        <TextArea rows={4} value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder='{"users":[],"warehouses":[],"products":[],"movements":[]}' />
        <div className="mt-2 flex gap-2">
          <Button variant="success" onClick={importJSON}>JSON İçe Aktar</Button>
          <Button variant="neutral" onClick={() => setJsonText("")}>Temizle</Button>
        </div>
      </div>
    </div>
  );
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// --- Balance helpers ---
function calcBalancesByWarehouse(products, movements) {
  const map = {}; for (const p of products) map[p.id] = {};
  for (const m of movements) {
    if (!map[m.productId]) map[m.productId] = {};
    const cur = map[m.productId][m.warehouseId] || 0;
    map[m.productId][m.warehouseId] = cur + (m.type === 'IN' ? Number(m.qty) : -Number(m.qty));
  }
  return map;
}

// --- User Manager (TODAY solution: localStorage based) ---
function UserManager({ data, setData, currentUser, onClose, onMe }) {
  const [myOld, setMyOld] = useState("");
  const [myNew, setMyNew] = useState("");
  const [myNew2, setMyNew2] = useState("");
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "user" });

  const changeMyPass = () => {
    const me = data.users.find(u => u.username === currentUser.username && u.password === myOld);
    if (!me) return alert("Eski şifre yanlış");
    if (!myNew || myNew !== myNew2) return alert("Yeni şifreler uyuşmuyor");
    const updated = data.users.map(u => u.username === me.username ? { ...u, password: myNew } : u);
    setData({ ...data, users: updated });
    onMe?.({ ...currentUser, password: myNew });
    alert("Şifreniz değiştirildi");
    setMyOld(""); setMyNew(""); setMyNew2("");
  };

  const addUser = () => {
    if (currentUser.role !== "admin") return alert("Yetkiniz yok");
    const { username, password, role } = newUser;
    if (!username || !password) return alert("Kullanıcı adı/şifre gerekli");
    if (data.users.some(u => u.username.toLowerCase() === username.toLowerCase()))
      return alert("Aynı kullanıcı adı var");
    setData({ ...data, users: [...data.users, { username, password, role }] });
    setNewUser({ username: "", password: "", role: "user" });
  };

  const resetPass = (username) => {
    if (currentUser.role !== "admin") return alert("Yetkiniz yok");
    const p = prompt(`${username} için yeni şifre:`);
    if (!p) return;
    setData({
      ...data,
      users: data.users.map(u => u.username === username ? ({ ...u, password: p }) : u)
    });
  };

  const removeUser = (username) => {
    if (currentUser.role !== "admin") return alert("Yetkiniz yok");
    if (username === currentUser.username) return alert("Kendinizi silemezsiniz");
    if (!confirm(`${username} silinsin mi?`)) return;
    setData({ ...data, users: data.users.filter(u => u.username !== username) });
  };

  const changeRole = (username, role) => {
    if (currentUser.role !== "admin") return alert("Yetkiniz yok");
    setData({
      ...data,
      users: data.users.map(u => u.username === username ? ({ ...u, role }) : u)
    });
  };

  const wipeAll = () => {
    if (!confirm("Tüm veriler (kullanıcılar dahil) sıfırlansın mı?")) return;
    localStorage.removeItem(LS_KEY);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Kullanıcılar</h3>
          <div className="flex gap-2">
            <Button variant="neutral" onClick={wipeAll} title="Tüm verileri sıfırla (varsayılan admin/user)">Tümünü Sıfırla</Button>
            <Button variant="neutral" onClick={onClose}>Kapat</Button>
          </div>
        </div>

        {/* Kendi Şifrem */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Kendi Şifremi Değiştir</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <TextInput type="password" placeholder="Eski şifre" value={myOld} onChange={e=>setMyOld(e.target.value)} />
            <TextInput type="password" placeholder="Yeni şifre" value={myNew} onChange={e=>setMyNew(e.target.value)} />
            <TextInput type="password" placeholder="Yeni şifre (tekrar)" value={myNew2} onChange={e=>setMyNew2(e.target.value)} />
          </div>
          <Button className="mt-2" onClick={changeMyPass}>Kaydet</Button>
        </div>

        {/* Admin Panel */}
        {currentUser.role === "admin" && (
          <>
            <div className="mb-6">
              <h4 className="font-medium mb-2">Yeni Kullanıcı Ekle (admin)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <TextInput placeholder="Kullanıcı adı" value={newUser.username} onChange={e=>setNewUser({...newUser, username:e.target.value})} />
                <TextInput type="password" placeholder="Şifre" value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})} />
                <Select value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </Select>
              </div>
              <Button className="mt-2" variant="success" onClick={addUser}>Ekle</Button>
            </div>

            <div>
              <h4 className="font-medium mb-2">Kullanıcı Listesi</h4>
              <div className="overflow-auto border border-gray-200 dark:border-gray-800 rounded-2xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800/70">
                    <tr>
                      <th className="p-2 text-left">Kullanıcı</th>
                      <th className="p-2 text-left">Rol</th>
                      <th className="p-2">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map(u=>(
                      <tr key={u.username} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="p-2">{u.username}</td>
                        <td className="p-2">
                          <Select value={u.role} onChange={e=>changeRole(u.username, e.target.value)} className="w-auto">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </Select>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button variant="neutral" onClick={()=>resetPass(u.username)}>Şifre Sıfırla</Button>
                            <Button variant="danger" onClick={()=>removeUser(u.username)}>Sil</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
