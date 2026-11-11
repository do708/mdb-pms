import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (client) {
        return client;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

    if (!url || !key) {
        throw new Error("Supabase is niet geconfigureerd");
    }

    client = createClient(url, key);
    return client;
}

/** Lui: gooit niet bij import, alleen bij echt gebruik. */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop, _receiver) {
        const real = getSupabaseAdmin();
        const value = Reflect.get(real, prop, real);
        return typeof value === "function" ? value.bind(real) : value;
    },
});
