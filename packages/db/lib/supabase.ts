import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your file storage
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY as string,
);

export { supabase };
