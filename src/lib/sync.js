import { supabase } from "./supabase";

export async function pullAll() {
  const [w, p, m] = await Promise.all([
    supabase.from("warehouses").select("*").order("created_at"),
    supabase.from("products").select("*").order("created_at"),
    supabase.from("movements").select("*").order("at", { ascending: false }),
  ]);
  if (w.error || p.error || m.error) throw (w.error||p.error||m.error);
  return { warehouses: w.data, products: p.data, movements: m.data };
}

export async function upsertWarehouse(wh) {
  const { data, error } = await supabase.from("warehouses").upsert(wh).select().single();
  if (error) throw error; return data;
}

export async function upsertProduct(pr) {
  const { data, error } = await supabase.from("products").upsert(pr).select().single();
  if (error) throw error; return data;
}

export async function insertMovement(mv) {
  const { data, error } = await supabase.from("movements").insert(mv).select().single();
  if (error) throw error; return data;
}

export async function deleteMovement(id) {
  const { error } = await supabase.from("movements").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeRealtime(onChange) {
  const ch = supabase
    .channel("stock-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "warehouses" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "products"   }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "movements"  }, onChange)
    .subscribe();
  return () => supabase.removeChannel(ch);
}
