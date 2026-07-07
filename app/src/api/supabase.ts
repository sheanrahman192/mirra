import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/config/env';

const fallbackUrl = 'https://example.supabase.co';
const fallbackKey = 'missing-anon-key';

export const supabase = createClient(
  isSupabaseConfigured ? env.supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? env.supabaseAnonKey : fallbackKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
