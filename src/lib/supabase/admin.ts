import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Service-role Supabase client. BYPASSES row-level security.
 *
 * SERVER-ONLY. Only import this from Route Handlers / Server Actions that run
 * on the server. Never import it into a Client Component or anything that ships
 * to the browser — it would leak the service-role secret.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
