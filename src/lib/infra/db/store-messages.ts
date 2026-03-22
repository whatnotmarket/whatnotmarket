import { createClient } from '@/lib/infra/supabase/supabase'
import { ChatMessage } from '@/hooks/use-realtime-chat'

export async function storeMessages(messages: ChatMessage[], roomName: string, updatedMessage?: ChatMessage | ChatMessage[]) {
  const supabase = createClient()
  
  const messagesToStore = Array.isArray(updatedMessage) 
      ? updatedMessage 
      : (updatedMessage ? [updatedMessage] : [messages[messages.length - 1]])

  for (const messageToStore of messagesToStore) {
    if (!messageToStore) continue

    try {
      const payload = {
        id: messageToStore.id,
        room_id: roomName,
        sender_id: messageToStore.user.id,
        content: messageToStore.content,
        type: messageToStore.type || 'text',
        is_read: messageToStore.status === 'read',
        created_at: messageToStore.createdAt,
        metadata: {
          audioUrl: messageToStore.audioUrl,
          reactions: messageToStore.reactions,
          status: messageToStore.status,
        }
      }

      // Use upsert to prevent duplicate key errors and handle updates in one call
      const { error } = await supabase
        .from('chat_messages')
        .upsert(payload, { onConflict: 'id' })

      if (error) {
        console.error('Error storing message:', JSON.stringify(error, null, 2))
      }

    } catch (err) {
      console.error('Failed to store message:', err)
    }
  }
}

