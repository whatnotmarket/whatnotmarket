import { useState, useRef, useCallback } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [permission, setPermission] = useState<PermissionState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const requestPermission = useCallback(async () => {
    setError(null)
    try {
      if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
        const msg = 'Audio API non supportata. Assicurati di usare HTTPS o localhost.'
        console.error(msg)
        setError(msg)
        setPermission('denied')
        return msg
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermission('granted')
      stream.getTracks().forEach(track => track.stop()) 
      return true
    } catch (err: any) {
      console.error('Error requesting microphone permission:', err)
      setPermission('denied')
      
      let msg = err.message || 'Errore sconosciuto'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Permesso negato. Controlla le impostazioni del browser.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'Nessun microfono trovato.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = 'Impossibile accedere al microfono. Forse è in uso?'
      }
      
      setError(msg)
      return msg
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('MediaDevices API not supported')
        setPermission('denied')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermission('granted')
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error starting recording:', err)
      setPermission('denied')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const clearAudio = useCallback(() => {
    setAudioBlob(null)
    chunksRef.current = []
  }, [])

  return {
    isRecording,
    audioBlob,
    permission,
    error,
    requestPermission,
    startRecording,
    stopRecording,
    clearAudio
  }
}
