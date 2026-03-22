'use client';

import { useState, useMemo } from 'react';
import { CopyWebsite, CopyWebsiteInsert, CopyContentType } from '@/types/copy-website';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shared/ui/dialog';
import { CopyForm } from '@/components/features/copy-admin/CopyForm';
import { createCopyItem, updateCopyItem, deleteCopyItem } from './actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Pencil, Trash2, Folder, ChevronLeft } from 'lucide-react';
import { toast } from '@/lib/domains/notifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';

export function CopyAdminClient({ items }: { items: CopyWebsite[] }) {
  const [editingItem, setEditingItem] = useState<CopyWebsite | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    router.replace(`?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteCopyItem(id);
        toast.success('Deleted successfully');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete');
      }
    }
  };

  // Group items by page
  const pageGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    items.forEach(item => {
      groups[item.page] = (groups[item.page] || 0) + 1;
    });
    return Object.entries(groups).map(([page, count]) => ({ page, count }));
  }, [items]);

  // Filter items for selected page
  const filteredItems = useMemo(() => {
    if (!selectedPage) return items;
    return items.filter(item => item.page === selectedPage);
  }, [items, selectedPage]);

  // View: Page Selection Grid
  if (!selectedPage && !searchParams.get('q')) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search all content..."
              className="pl-8"
              defaultValue={searchParams.get('q') || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pageGroups.map(({ page, count }) => (
            <Card 
              key={page} 
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              onClick={() => setSelectedPage(page)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate" title={page}>
                  {page}
                </CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  items
                </p>
              </CardContent>
            </Card>
          ))}
          {pageGroups.length === 0 && (
             <div className="col-span-full text-center py-12 text-muted-foreground">
               No pages found. Click "Add New" to start.
             </div>
          )}
        </div>

        <CreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>
    );
  }

  // View: Items List (Specific Page or Search Results)
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          {selectedPage && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedPage(null)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="relative max-w-sm w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search..."
              className="pl-8"
              defaultValue={searchParams.get('q') || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {selectedPage && <h2 className="text-lg font-bold hidden md:block">Page: {selectedPage}</h2>}
           <Button onClick={() => setIsCreateOpen(true)}>
             <Plus className="mr-2 h-4 w-4" /> Add New
           </Button>
        </div>
      </div>

      <div className="border rounded-md bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              {!selectedPage && <TableHead>Page</TableHead>}
              <TableHead>Section</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                {!selectedPage && <TableCell>{item.page}</TableCell>}
                <TableCell>{item.section}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.key}</TableCell>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground" title={item.content || ''}>
                  {item.content}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingItem(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={selectedPage ? 5 : 6} className="text-center h-24 text-muted-foreground">
                  No copy found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} defaultPage={selectedPage || undefined} />

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Copy</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <CopyForm
              defaultValues={{
                page: editingItem.page,
                section: editingItem.section,
                key: editingItem.key,
                label: editingItem.label,
                content: editingItem.content || undefined,
                content_type: editingItem.content_type,
                locale: editingItem.locale,
              }}
              onSubmit={async (values) => {
                await updateCopyItem(editingItem.id, {
                  content: values.content,
                  label: values.label,
                  content_type: values.content_type,
                });
                setEditingItem(null);
              }}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateDialog({ 
  open, 
  onOpenChange, 
  defaultPage 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  defaultPage?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Copy</DialogTitle>
        </DialogHeader>
        <CopyForm
          defaultValues={{ page: defaultPage }}
          onSubmit={async (values) => {
            await createCopyItem(values);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}


