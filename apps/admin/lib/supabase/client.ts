import { createBrowserClient } from "@supabase/ssr";
import { adminCookieOptions } from "@/lib/supabase/cookie-config";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: adminCookieOptions },
  );
}
