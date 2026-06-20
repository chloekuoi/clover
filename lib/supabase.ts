import 'react-native-url-polyfill/auto'
import { LogBox } from 'react-native'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://fyjnqnzrtfuuwrkfksof.supabase.co'
const supabaseAnonKey = 'sb_publishable_QL2JIByX8ypBuL41S0W20g_4N5q7Yk0'

if (__DEV__) {
  // Auth removes a non-retryable stale session automatically. Avoid turning
  // that expected one-time cleanup into a blocking React Native error overlay.
  LogBox.ignoreLogs([
    'AuthApiError: Invalid Refresh Token: Refresh Token Not Found',
  ])
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

fetch('https://fyjnqnzrtfuuwrkfksof.supabase.co/rest/v1/', {
  headers: {
    apikey: supabaseAnonKey,
  },
})
  .then((res) => console.log('Supabase reachability:', res.status))
  .catch((err) => console.log('Supabase reachability failed:', err))
