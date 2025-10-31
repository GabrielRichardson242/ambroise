import { supabase } from '../lib/supabaseClient'

export type PosterInput = {
  id?: string
  room_id: string
  file_url: string
  position: number[]
  rotation: number[]
  scale: number[]
  size?: string
  title?: string
  description?: string
}

export type RoomInput = {
  id: string
  name: string
  description?: string
  scan_draco_url: string
  raw_url?: string
  camera_position?: number[]
  camera_target?: number[]
  theme?: string
}

// 1) Save draft (edit mode). Not public.
export async function saveRoomDraft(room: RoomInput, posters: PosterInput[]) {
  const { error: roomErr } = await supabase.from('rooms').upsert({
    id: room.id,
    name: room.name,
    description: room.description ?? null,
    scan_draco_url: room.scan_draco_url ?? null,
    raw_url: room.raw_url ?? null,
    camera_position: room.camera_position ?? null,
    camera_target: room.camera_target ?? null,
    theme: room.theme ?? null,
    is_preview: false,
    updated_at: new Date().toISOString(),
  })
  if (roomErr) throw roomErr

  // Simple, reliable poster persistence: replace all posters for this room
  const { error: delErr } = await supabase.from('posters').delete().eq('room_id', room.id)
  if (delErr) throw delErr

  if (posters.length) {
    const { error: postersErr } = await supabase.from('posters').insert(posters)
    if (postersErr) throw postersErr
  }
}

// 2) Publish (set preview on for public listing)
export async function publishRoom(roomId: string) {
  const { error } = await supabase
    .from('rooms')
    .update({
      is_preview: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId)
  if (error) throw error
}

// 3) Fetch room + posters
export async function fetchRoomWithPosters(roomId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, posters(*)')
    .eq('id', roomId)
    .single()
  if (error) throw error
  return data
}

// 4) Fetch homepage previews only
export async function fetchPreviewRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, name, description, thumbnail_url')
    .eq('is_preview', true)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}