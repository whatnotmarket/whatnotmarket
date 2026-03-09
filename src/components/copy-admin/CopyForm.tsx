'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CopyWebsiteInsert } from '@/types/copy-website';
import { useTransition } from 'react';
import { toast } from 'sonner';

const formSchema = z.object({
  page: z.string().min(1, 'Page is required'),
  section: z.string().min(1, 'Section is required'),
  key: z.string().min(1, 'Key is required'),
  label: z.string().min(1, 'Label is required'),
  content: z.string().optional(),
  content_type: z.enum(['plain', 'textarea', 'title', 'button', 'meta_title', 'meta_description']),
  locale: z.string().default('it'),
});

interface CopyFormProps {
  defaultValues?: Partial<CopyWebsiteInsert>;
  onSubmit: (values: CopyWebsiteInsert) => Promise<void>;
  onCancel?: () => void;
}

export function CopyForm({ defaultValues, onSubmit, onCancel }: CopyFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      page: defaultValues?.page ?? '',
      section: defaultValues?.section ?? '',
      key: defaultValues?.key ?? '',
      label: defaultValues?.label ?? '',
      content: defaultValues?.content ?? '',
      content_type: defaultValues?.content_type ?? 'plain',
      locale: defaultValues?.locale ?? 'it',
    },
  });

  const contentType =
    useWatch({
      control: form.control,
      name: 'content_type',
    }) ?? 'plain';

  const handleSubmit = (values: z.input<typeof formSchema>) => {
    startTransition(async () => {
      try {
        const data: CopyWebsiteInsert = {
          page: values.page,
          section: values.section,
          key: values.key,
          label: values.label,
          content: values.content || null,
          content_type: values.content_type,
          locale: values.locale ?? 'it',
        };
        await onSubmit(data);
        toast.success('Saved successfully');
        if (onCancel) onCancel();
      } catch (error) {
        toast.error('Failed to save');
        console.error(error);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => handleSubmit(values))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="page"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page</FormLabel>
                <FormControl>
                  <Input placeholder="/home" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section</FormLabel>
                <FormControl>
                  <Input placeholder="hero" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key</FormLabel>
                <FormControl>
                  <Input placeholder="title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label (Admin only)</FormLabel>
                <FormControl>
                  <Input placeholder="Main Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="content_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="plain">Plain Text</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="button">Button Label</SelectItem>
                  <SelectItem value="meta_title">Meta Title</SelectItem>
                  <SelectItem value="meta_description">Meta Description</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                {contentType === 'textarea' || contentType === 'meta_description' ? (
                  <Textarea placeholder="Content..." {...field} />
                ) : (
                  <Input placeholder="Content..." {...field} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
