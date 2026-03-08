import { createClient } from '@/lib/supabase'
import { ChatMessage } from '@/hooks/use-realtime-chat'

export async function storeMessages(messages: ChatMessage[], roomName: string, updatedMessage?: ChatMessage | ChatMessage[]) {
  const supabase = createClient()
  
  const messagesToStore = Array.isArray(updatedMessage) 
      ? updatedMessage 
      : (updatedMessage ? [updatedMessage] : [messages[messages.length - 1]])

  for (const messageToStore of messagesToStore) {
    if (!messageToStore) continue

    try {
      const timestamp = new Date(messageToStore.createdAt).getTime()
      const filename = `${roomName}/${timestamp}_${messageToStore.id}.json`
      
      const { error } = await supabase
        .storage
        .from('chat-messages')
        .upload(filename, JSON.stringify(messageToStore), {
          contentType: 'application/json',
          upsert: true
        })

      if (error) {
        console.error('Error storing message to storage:', error)
      }
    } catch (err) {
      console.error('Failed to store message:', err)
    }
  }
}
