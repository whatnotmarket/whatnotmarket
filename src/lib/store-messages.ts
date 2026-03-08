import { createClient } from '@/lib/supabase'
import { ChatMessage } from '@/hooks/use-realtime-chat'

export async function storeMessages(messages: ChatMessage[], roomName: string) {
  const supabase = createClient()
  const lastMessage = messages[messages.length - 1]
  if (!lastMessage) return

  // We assume the messages table exists with these columns
  const { error } = await supabase
    .from('messages')
    .insert({
      id: lastMessage.id,
      content: lastMessage.content,
      user_name: lastMessage.user.name,
      room_id: roomName,
      created_at: lastMessage.createdAt
    })

  if (error) {
    console.error('Error storing message:', error)
  }
}
