import { supabase } from './supabase';

export async function fetchCoachingInsight() {
  const { data, error } = await supabase.functions.invoke('generate-coaching');
  if (error) throw error;
  return data?.insight ?? null;
}

export async function fetchReflection(type = 'weekly') {
  const { data, error } = await supabase.functions.invoke('generate-reflection', {
    body: { type },
  });
  if (error) throw error;
  return data?.insight ?? null;
}
