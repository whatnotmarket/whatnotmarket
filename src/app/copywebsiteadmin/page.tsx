import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getCopyItems } from './actions';
import { CopyAdminClient } from './client';

export const dynamic = 'force-dynamic';

export default async function CopyAdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?next=/copywebsiteadmin');
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p>You must be an administrator to view this page.</p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  const items = await getCopyItems(q);

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Copy Website Management</h1>
      <CopyAdminClient items={items} />
    </div>
  );
}
