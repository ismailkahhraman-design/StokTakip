import React, { useEffect, useMemo, useState } from "react";

/** ... Full app code moved from canvas ... */
// To keep this archive concise here, we'll create a simple placeholder if needed.
// But we will include full code below (same as canvas).

const LS_KEY = "stokapp_v1";
const nowIso = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleString();
const toCSV = (rows) => {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => String(v ?? "").replaceAll('"','""');
  const lines = [headers.join(",")].concat(
    rows.map((r) => headers.map((h) => `"${esc(r[h])}"`).join(","))
  );
  return lines.join("\n");
};

const defaultData = {
  users: [{ username: "admin", password: "admin", role: "admin" }],
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
  } catch { return defaultData; }
}
function saveData(d){ localStorage.setItem(LS_KEY, JSON.stringify(d)); }

export default function App(){
  const [data,setData] = useState(loadData);
  const [currentUser,setCurrentUser] = useState(null);
  useEffect(()=>{ saveData(data); },[data]);

  const handleLogin=(u,p)=>{
    const user = data.users.find(x=>x.username===u && x.password===p);
    if(user){ setCurrentUser(user); return true; }
    return false;
  };
  const resetAll=()=>{
    if(!confirm("Tüm veriler sıfırlansın mı?")) return;
    setData(defaultData); setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {!currentUser && <LoginModal onLogin={handleLogin} />}
      <header className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Stok Takip Uygulaması</h1>
        <div className="flex items-center gap-2">
          {currentUser && <span className="text-sm text-gray-600">Merhaba, <b>{currentUser.username}</b></span>}
          <button onClick={resetAll} className="px-3 py-2 rounded-2xl bg-red-600 text-white text-sm shadow">Sıfırla</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-1">
          <Card title="Depo Yönetimi"><WarehouseManager data={data} setData={setData} /></Card>
          <Card title="İçe/Dışa Aktar"><ImportExport data={data} setData={setData} /></Card>
        </section>
        <section className="xl:col-span-2 grid grid-cols-1 gap-4">
          <Card title="Ürünler"><ProductManager data={data} setData={setData} /></Card>
          <Card title="Stok Hareketleri"><MovementManager data={data} setData={setData} /></Card>
        </section>
      </main>
      <footer className="max-w-7xl mx-auto mt-6 text-xs text-gray-500">
        Demo amaçlıdır. Veriler tarayıcı <code>localStorage</code>'da saklanır.
      </footer>
    </div>
  );
}

function Card({ title, children }){
  return (<div className="bg-white rounded-2xl shadow p-4">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>{children}</div>);
}

function LoginModal({ onLogin }){
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState("");
  const submit=(e)=>{ e.preventDefault(); const ok=onLogin(u,p); if(!ok) setErr("Kullanıcı adı veya şifre hatalı"); };
  return (<div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
    <form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Giriş Yap</h2>
      <div className="space-y-3">
        <div><label className="text-sm text-gray-600">Kullanıcı Adı</label>
        <input value={u} onChange={e=>setU(e.target.value)} className="w-full border rounded-xl px-3 py-2" placeholder="admin" /></div>
        <div><label className="text-sm text-gray-600">Şifre</label>
        <input type="password" value={p} onChange={e=>setP(e.target.value)} className="w-full border rounded-xl px-3 py-2" placeholder="admin" /></div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="w-full bg-blue-600 text-white py-2 rounded-2xl shadow">Giriş</button>
        <p className="text-xs text-gray-500">Demo: <b>admin / admin</b></p>
      </div>
    </form></div>);
}

function WarehouseManager({ data, setData }){
  const [name,setName]=useState("");
  const add=()=>{
    const n=name.trim(); if(!n) return;
    const exists=data.warehouses.some(w=>w.name.toLowerCase()===n.toLowerCase());
    if(exists) return alert("Aynı isimde depo mevcut");
    const id=crypto.randomUUID();
    setData(d=>({...d, warehouses:[...d.warehouses,{id,name:n}]})); setName("");
  };
  const remove=(id)=>{
    const hasProducts=data.products.some(p=>p.warehouseId===id);
    const hasMoves=data.movements.some(m=>m.warehouseId===id);
    if(hasProducts||hasMoves){ if(!confirm("Bu depoda ürün veya hareket var. Yine de silinsin mi?")) return; }
    setData(d=>({
      ...d,
      warehouses:d.warehouses.filter(w=>w.id!==id),
      products:d.products.filter(p=>p.warehouseId!==id),
      movements:d.movements.filter(m=>m.warehouseId!==id),
    }));
  };
  return (<div className="space-y-3">
    <div className="flex gap-2">
      <input className="flex-1 border rounded-xl px-3 py-2" placeholder="Depo adı" value={name} onChange={e=>setName(e.target.value)} />
      <button onClick={add} className="px-3 py-2 rounded-2xl bg-emerald-600 text-white shadow">Ekle</button>
    </div>
    <ul className="divide-y">
      {data.warehouses.length===0 && <li className="py-2 text-sm text-gray-500">Hiç depo eklenmedi.</li>}
      {data.warehouses.map(w=>(<li key={w.id} className="py-2 flex items-center justify-between">
        <span>{w.name}</span><button onClick={()=>remove(w.id)} className="text-red-600 text-sm">Sil</button></li>))}
    </ul>
  </div>);
}

function ProductManager({ data, setData }){
  const [f,setF]=useState({ q:"", wh:"all", sort:"name" });
  const [form,setForm]=useState({ id:null, sku:"", name:"", unit:"Adet", minStock:0, warehouseId:"" });
  const warehouses=data.warehouses;
  const filtered = useMemo(()=>{
    let list=[...data.products];
    if(f.q){ const q=f.q.toLowerCase(); list=list.filter(p=>p.sku.toLowerCase().includes(q)||p.name.toLowerCase().includes(q)); }
    if(f.wh!=="all") list=list.filter(p=>p.warehouseId===f.wh);
    if(f.sort==="name") list.sort((a,b)=>a.name.localeCompare(b.name));
    if(f.sort==="sku") list.sort((a,b)=>a.sku.localeCompare(b.sku));
    return list;
  },[data.products,f]);
  const balances = useMemo(()=>calcBalances(data.products, data.movements),[data.products,data.movements]);
  const startEdit=(p)=>setForm(p);
  const cancelEdit=()=>setForm({ id:null, sku:"", name:"", unit:"Adet", minStock:0, warehouseId:"" });
  const save=()=>{
    if(!form.sku.trim()||!form.name.trim()) return alert("SKU ve Ürün adı zorunlu");
    if(!form.warehouseId) return alert("Depo seçiniz");
    if(form.id){
      setData(d=>({...d, products:d.products.map(x=>x.id===form.id?{...form, minStock:Number(form.minStock)||0}:x)}));
    }else{
      const id=crypto.randomUUID();
      setData(d=>({...d, products:[...d.products,{...form,id, minStock:Number(form.minStock)||0}]}));
    }
    cancelEdit();
  };
  const remove=(id)=>{
    const hasMoves=data.movements.some(m=>m.productId===id);
    if(hasMoves && !confirm("Bu ürünün hareketleri var, yine de silinsin mi?")) return;
    setData(d=>({
      ...d,
      products:d.products.filter(p=>p.id!==id),
      movements:d.movements.filter(m=>m.productId!==id),
    }));
  };
  return (<div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      <input className="border rounded-xl px-3 py-2" placeholder="Ara: SKU / Ad" value={f.q} onChange={e=>setF({...f,q:e.target.value})} />
      <select className="border rounded-xl px-3 py-2" value={f.wh} onChange={e=>setF({...f,wh:e.target.value})}>
        <option value="all">Tüm Depolar</option>
        {warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <select className="border rounded-xl px-3 py-2" value={f.sort} onChange={e=>setF({...f,sort:e.target.value})}>
        <option value="name">İsme göre</option>
        <option value="sku">SKU'ya göre</option>
      </select>
      <button onClick={cancelEdit} className="px-3 py-2 rounded-2xl bg-gray-200">Yeni / Temizle</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
      <input className="border rounded-xl px-3 py-2" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} />
      <input className="border rounded-xl px-3 py-2 md:col-span-2" placeholder="Ürün Adı" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
      <input className="border rounded-xl px-3 py-2" placeholder="Birim (Adet, Koli, Kg)" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} />
      <input type="number" className="border rounded-xl px-3 py-2" placeholder="Min Stok" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} />
      <select className="border rounded-xl px-3 py-2" value={form.warehouseId} onChange={e=>setForm({...form,warehouseId:e.target.value})}>
        <option value="">Depo seçiniz</option>
        {warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <div className="md:col-span-6 flex gap-2">
        <button onClick={save} className="px-3 py-2 rounded-2xl bg-blue-600 text-white shadow">{form.id?'Güncelle':'Ekle'}</button>
        {form.id && <button onClick={cancelEdit} className="px-3 py-2 rounded-2xl bg-gray-200">Vazgeç</button>}
      </div>
    </div>
    <div className="overflow-auto border rounded-2xl">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">SKU</th>
            <th className="text-left p-2">Ürün</th>
            <th className="text-left p-2">Depo</th>
            <th className="text-right p-2">Bakiye</th>
            <th className="text-right p-2">Min</th>
            <th className="text-left p-2">Birim</th>
            <th className="p-2">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p=>{
            const wh=data.warehouses.find(w=>w.id===p.warehouseId);
            const bal=balances[p.id]??0;
            const low=p.minStock && bal<p.minStock;
            return (<tr key={p.id} className="border-t">
              <td className="p-2 font-mono">{p.sku}</td>
              <td className="p-2">{p.name}</td>
              <td className="p-2">{wh?.name||'-'}</td>
              <td className={`p-2 text-right ${low?'text-red-600 font-semibold':''}`}>{bal}</td>
              <td className="p-2 text-right">{p.minStock??0}</td>
              <td className="p-2">{p.unit}</td>
              <td className="p-2">
                <div className="flex gap-2">
                  <button onClick={()=>setForm(p)} className="text-blue-600">Düzenle</button>
                  <button onClick={()=>remove(p.id)} className="text-red-600">Sil</button>
                </div>
              </td>
            </tr>);
          })}
          {filtered.length===0 && (<tr><td colSpan={7} className="p-4 text-center text-gray-500">Kayıt yok</td></tr>)}
        </tbody>
      </table>
    </div>
  </div>);
}

function MovementManager({ data, setData }){
  const [filter,setFilter]=useState({ wh:"all", prod:"all" });
  const [mv,setMv]=useState({ type:"IN", productId:"", warehouseId:"", qty:"", note:"" });
  const products = React.useMemo(()=>{
    if(filter.wh==="all") return data.products;
    return data.products.filter(p=>p.warehouseId===filter.wh);
  },[data.products, filter.wh]);
  const movements = React.useMemo(()=>{
    let list=[...data.movements];
    if(filter.wh!=="all") list=list.filter(m=>m.warehouseId===filter.wh);
    if(filter.prod!=="all") list=list.filter(m=>m.productId===filter.prod);
    list.sort((a,b)=> new Date(b.at)-new Date(a.at));
    return list;
  },[data.movements, filter]);
  const balances = useMemo(()=>calcBalances(data.products, data.movements),[data.products, data.movements]);
  const submit=()=>{
    if(!mv.productId) return alert("Ürün seçiniz");
    if(!mv.warehouseId) return alert("Depo seçiniz");
    const qty=Number(mv.qty); if(!qty||qty<=0) return alert("Miktar (>0) giriniz");
    if(mv.type==="OUT"){
      const bal=balances[mv.productId]??0;
      if(qty>bal){ if(!confirm(`Çıkış miktarı (${qty}) bakiyeden (${bal}) büyük. Yine de devam?`)) return; }
    }
    const id=crypto.randomUUID();
    setData(d=>({...d, movements:[{ id, type:mv.type, productId:mv.productId, warehouseId:mv.warehouseId, qty, note:mv.note?.trim()||"", at: nowIso() }, ...d.movements]}));
    setMv({ type: mv.type, productId:"", warehouseId: filter.wh==='all'? "" : filter.wh, qty:"", note:"" });
  };
  const productsForSelect = filter.wh==="all"? data.products : data.products.filter(p=>p.warehouseId===filter.wh);
  return (<div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      <select className="border rounded-xl px-3 py-2" value={filter.wh} onChange={e=>setFilter({...filter, wh:e.target.value, prod:'all'})}>
        <option value="all">Tüm Depolar</option>
        {data.warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <select className="border rounded-xl px-3 py-2" value={filter.prod} onChange={e=>setFilter({...filter, prod:e.target.value})}>
        <option value="all">Tüm Ürünler</option>
        {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <ExportCSVButton data={movements.map(m=>({
        id:m.id,
        type:m.type,
        product: data.products.find(p=>p.id===m.productId)?.name||m.productId,
        warehouse: data.warehouses.find(w=>w.id===m.warehouseId)?.name||m.warehouseId,
        qty:m.qty, note:m.note, at:m.at,
      }))} label="Hareketleri CSV İndir" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
      <select className="border rounded-xl px-3 py-2" value={mv.type} onChange={e=>setMv({...mv, type:e.target.value})}>
        <option value="IN">Giriş (+)</option>
        <option value="OUT">Çıkış (-)</option>
      </select>
      <select className="border rounded-xl px-3 py-2" value={mv.warehouseId} onChange={e=>setMv({...mv, warehouseId:e.target.value})}>
        <option value="">Depo</option>
        {data.warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <select className="border rounded-xl px-3 py-2 md:col-span-2" value={mv.productId} onChange={e=>setMv({...mv, productId:e.target.value})}>
        <option value="">Ürün</option>
        {productsForSelect.map(p=><option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
      </select>
      <input type="number" className="border rounded-xl px-3 py-2" placeholder="Miktar" value={mv.qty} onChange={e=>setMv({...mv, qty:e.target.value})} />
      <input className="border rounded-xl px-3 py-2" placeholder="Not (opsiyonel)" value={mv.note} onChange={e=>setMv({...mv, note:e.target.value})} />
      <div className="md:col-span-6">
        <button onClick={submit} className="px-3 py-2 rounded-2xl bg-emerald-600 text-white shadow">Kaydet</button>
      </div>
    </div>
    <div className="overflow-auto border rounded-2xl">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">Tür</th>
            <th className="text-left p-2">Depo</th>
            <th className="text-left p-2">Ürün</th>
            <th className="text-right p-2">Miktar</th>
            <th className="text-left p-2">Not</th>
            <th className="text-left p-2">Tarih</th>
          </tr>
        </thead>
        <tbody>
          {movements.map(m=>{
            const wh=data.warehouses.find(w=>w.id===m.warehouseId);
            const p=data.products.find(x=>x.id===m.productId);
            return (<tr key={m.id} className="border-t">
              <td className={`p-2 ${m.type==='OUT' ? 'text-red-600' : 'text-emerald-700'}`}>{m.type==='OUT'? 'Çıkış' : 'Giriş'}</td>
              <td className="p-2">{wh?.name ?? '-'}</td>
              <td className="p-2">{p? `${p.name} (${p.sku})` : '-'}</td>
              <td className="p-2 text-right">{m.qty}</td>
              <td className="p-2">{m.note}</td>
              <td className="p-2">{fmtDate(m.at)}</td>
            </tr>);
          })}
          {movements.length===0 && (<tr><td colSpan={6} className="p-4 text-center text-gray-500">Kayıt yok</td></tr>)}
        </tbody>
      </table>
    </div>
  </div>);
}

function ImportExport({ data, setData }){
  const downloadProductsCSV=()=>{
    const rows=data.products.map(p=>({
      id:p.id, sku:p.sku, name:p.name, unit:p.unit, minStock:p.minStock,
      warehouse:(data.warehouses.find(w=>w.id===p.warehouseId)?.name)||p.warehouseId,
    }));
    const csv=toCSV(rows);
    downloadText(csv, `urunler_${new Date().toISOString().slice(0,10)}.csv`);
  };
  const downloadJSON=()=>{
    const json=JSON.stringify(data,null,2);
    downloadText(json, `stokveri_${new Date().toISOString().slice(0,10)}.json`);
  };
  const [jsonText,setJsonText]=useState("");
  const importJSON=()=>{
    try{
      const parsed=JSON.parse(jsonText);
      if(!parsed || typeof parsed!=='object') throw new Error();
      if(!parsed.users || !parsed.warehouses || !parsed.products || !parsed.movements) throw new Error();
      if(!confirm("Mevcut verilerinizin ÜZERİNE yazılacaktır. Devam edilsin mi?")) return;
      setData(parsed); setJsonText(""); alert("İçe aktarma tamamlandı");
    }catch{ alert("Geçersiz JSON"); }
  };
  return (<div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      <button onClick={downloadProductsCSV} className="px-3 py-2 rounded-2xl bg-blue-600 text-white shadow">Ürünleri CSV İndir</button>
      <button onClick={downloadJSON} className="px-3 py-2 rounded-2xl bg-gray-800 text-white shadow">Tüm Veriyi JSON İndir</button>
    </div>
    <div>
      <label className="block text-sm text-gray-600 mb-1">JSON İçe Aktar (yapıştır)</label>
      <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} rows={4} className="w-full border rounded-xl p-2 font-mono" placeholder='{\n  "users": [],\n  "warehouses": [],\n  "products": [],\n  "movements": []\n}'></textarea>
      <div className="mt-2 flex gap-2">
        <button onClick={importJSON} className="px-3 py-2 rounded-2xl bg-emerald-600 text-white shadow">İçe Aktar</button>
        <button onClick={()=>setJsonText("")} className="px-3 py-2 rounded-2xl bg-gray-200">Temizle</button>
      </div>
    </div>
  </div>);
}

function ExportCSVButton({ data, label }){
  const download=()=>{
    const csv=toCSV(data);
    downloadText(csv, `${label.replaceAll(' ','_').toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`);
  };
  return (<button onClick={download} className="px-3 py-2 rounded-2xl bg-indigo-600 text-white shadow">{label}</button>);
}

function downloadText(text, filename){
  const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function calcBalances(products, movements){
  const bal={}; for(const p of products) bal[p.id]=0;
  for(const m of movements){ if(!(m.productId in bal)) bal[m.productId]=0; bal[m.productId]+= m.type==='IN'? Number(m.qty) : -Number(m.qty); }
  return bal;
}
