import { createClient } from '@/lib/infra/supabase/supabase-server';
import { CopyWebsite } from '@/types/copy-website';
import { cache } from 'react';

export type CopyMap = Record<string, Record<string, string>>;

// Cache the fetch to avoid multiple requests on the same render
export const getCopyByPage = cache(async (page: string, locale: string = 'it'): Promise<CopyMap> => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('copy_website')
    .select('section, key, content')
    .eq('page', page)
    .eq('locale', locale);

  if (error) {
    console.error(`Error fetching copy for page ${page}:`, error);
    return {};
  }

  const copyMap: CopyMap = {};
  
  data?.forEach((item: any) => {
    if (!copyMap[item.section]) {
      copyMap[item.section] = {};
    }
    copyMap[item.section][item.key] = item.content || '';
  });

  return copyMap;
});

export const getCopyItem = cache(async (key: string, page: string, locale: string = 'it'): Promise<string | null> => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('copy_website')
    .select('content')
    .eq('key', key)
    .eq('page', page)
    .eq('locale', locale)
    .single();

  if (error) {
    // Don't log error for missing keys as it might be expected
    return null;
  }

  return data?.content || null;
});

