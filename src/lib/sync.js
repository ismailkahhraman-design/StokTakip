import { supabase } from "./supabase";

function boom(where, error){
  console.error(where, error);
  alert(`[Supabase] ${where}: ` + (error?.message || JSON.stringify(error)));
}

export async function pullAll() {
  if (!supabase) return null;
  const [w, p, m] = await Promise.all([
    supabase.from("warehouses").select("*").order("created_at"),
    supabase.from("products").select("*").order("created_at"),
    supabase.from("movements").select("*").order("at", { ascending:false }),
  ]);
  if (w.error) boom("select warehouses", w.error);
  if (p.error) boom("select products", p.error);
  if (m.error) boom("select movements", m.error);
  if (w.error || p.error || m.error) return null;
  return { warehouses: w.data, products: p.data, movements: m.data };
}

export async function upsertWarehouse(wh) {
  const { data, error } = await supabase.from("warehouses").upsert(wh).select().single();
  if (error) boom("upsert warehouse", error);
  return data;
}

export async function upsertProduct(pr) {
  const { data, error } = await supabase.from("products").upsert(pr).select().single();
  if (error) boom("upsert product", error);
  return data;
}

export async function insertMovement(mv) {
  const { data, error } = await supabase.from("movements").insert(mv).select().single();
  if (error) boom("insert movement", error);
  return data;
}

export async function deleteMovement(id) {
  const { error } = await supabase.from("movements").delete().eq("id", id);
  if (error) boom("delete movement", error);
}

export function subscribeRealtime(onChange) {
  if (!supabase) return () => {};
  const ch = supabase
    .channel("stock-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "warehouses" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "products"   }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "movements"  }, onChange)
    .subscribe();
  return () => supabase.removeChannel(ch);
}
