import { createClient } from "@supabase/supabase-js";
import 'dotenv/config'

// Create a single supabase client for interacting with your file storage
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SECRET_KEY as string,
);

export { supabase };