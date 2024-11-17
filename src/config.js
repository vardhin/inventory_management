import dotenv from 'dotenv'
dotenv.config()

export const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL
export const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY 