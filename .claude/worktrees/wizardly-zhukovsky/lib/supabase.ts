import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://fyjnqnzrtfuuwrkfksof.supabase.co'
const supabaseAnonKey = 'sb_publishable_QL2JIByX8ypBuL41S0W20g_4N5q7Yk0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})