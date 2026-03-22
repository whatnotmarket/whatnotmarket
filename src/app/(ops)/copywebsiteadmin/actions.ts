'use server';

import { createClient } from '@/lib/infra/supabase/supabase-server';
import { CopyWebsite, CopyWebsiteInsert, CopyWebsiteUpdate } from '@/types/copy-website';
import { revalidatePath } from 'next/cache';

export async function getCopyItems(query?: string) {
  const supabase = await createClient();
  let queryBuilder = supabase
    .from('copy_website')
    .select('*')
    .order('updated_at', { ascending: false });

  if (query) {
    queryBuilder = queryBuilder.or(`key.ilike.%${query}%,content.ilike.%${query}%,page.ilike.%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(error.message);
  }

  return data as CopyWebsite[];
}

export async function createCopyItem(item: Omit<CopyWebsiteInsert, 'locale'> & { locale?: string }) {
  const supabase = await createClient();
  
  // Check auth (optional as RLS handles it, but good for feedback)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase.from('Copy website').insert({
    ...item,
    locale: item.locale || 'it',
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/copywebsiteadmin');
  revalidatePath(`/${item.page}`); // Optimistic revalidation
}

export async function updateCopyItem(id: string, updates: CopyWebsiteUpdate) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('copy_website')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/copywebsiteadmin');
  // Since we don't know the page here easily without fetching, we might miss revalidating the public page unless we fetch it first.
  // But for now, just revalidating admin is enough for feedback.
  // To revalidate public page, we could fetch the item first.
}

export async function deleteCopyItem(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('copy_website').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/copywebsiteadmin');
}

