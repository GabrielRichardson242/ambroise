import { supabase } from "../lib/supabaseClient";
import { roomState } from "./roomState";
import { v4 as uuidv4 } from "uuid";

export const roomActions = {
  async loadRoomFromSupabase(roomId) {
    console.log("[roomActions] Loading room:", roomId);

    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();

    if (roomErr) throw new Error("Failed to fetch room: " + roomErr.message);
    if (!room) throw new Error("No room found for id: " + roomId);

    const { data: posters, error: postersErr } = await supabase
      .from("posters")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (postersErr) {
      throw new Error("Failed to fetch posters: " + postersErr.message);
    }

    const hydratedPosters = (posters || []).map((p) => ({
      id: p.id,
      url: p.file_url,
      size: p.size || "A0",
      transform: {
        position: p.position || [0, 0, 0],
        rotation: p.rotation || [0, 0, 0],
        scale: p.scale || [1, 1, 1],
      },
    }));

    roomState.loadRoom(room, hydratedPosters);
    console.log(`[roomActions] Hydrated ${hydratedPosters.length} posters`);

    return roomState.data.id;
  },

  async createRoomIfMissing() {
    const id = roomState.data.id || uuidv4();

    const { data, error } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error("Room check failed: " + error.message);

    if (!data) {
      const { error: createErr } = await supabase.from("rooms").insert({
        id,
        name: "Untitled Room",
        description: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (createErr) {
        throw new Error("Room creation failed: " + createErr.message);
      }

      console.log("[roomActions] Created new room:", id);
    }

    roomState.data.id = id;
    return id;
  },

  // Save current roomState to Supabase, with optional extra fields (e.g. screenshot_url)
  async saveRoomToSupabase(isPreview = false, extra = {}) {
    const serialized = roomState.serialize();
    const { room, posters } = serialized;

    console.log("[roomActions] Saving room:", room.id);

    const { error: roomErr } = await supabase
      .from("rooms")
      .upsert({
        id: room.id,
        name: room.name,
        description: room.description,
        scan_draco_url: room.scan_draco_url || null,
        raw_url: room.raw_url || null,
        camera_position: room.camera_position,
        camera_target: room.camera_target,
        theme: room.theme,
        is_preview: isPreview,
        screenshot_url: extra.screenshot_url || room.screenshot_url || null,
        updated_at: new Date().toISOString(),
      });

    if (roomErr) {
      throw new Error("Room save failed: " + roomErr.message);
    }

    const { data: existing, error: fetchErr } = await supabase
      .from("posters")
      .select("id")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true });

    if (fetchErr) {
      throw new Error("Poster fetch failed: " + fetchErr.message);
    }

    if (!existing?.length) {
      const inserts = posters.map((p) => ({
        id: uuidv4(),
        room_id: room.id,
        file_url: p.file_url,
        size: p.size,
        position: p.position,
        rotation: p.rotation,
        scale: p.scale,
        created_at: new Date().toISOString(),
      }));

      const { error: insertErr } = await supabase
        .from("posters")
        .insert(inserts);

      if (insertErr) {
        throw new Error("Poster insert failed: " + insertErr.message);
      }
    } else {
      const n = Math.min(existing.length, posters.length);

      for (let i = 0; i < n; i++) {
        const p = posters[i];

        const { error: updateErr } = await supabase
          .from("posters")
          .update({
            size: p.size,
            position: p.position,
            rotation: p.rotation,
            scale: p.scale,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing[i].id);

        if (updateErr) {
          console.error("Poster update failed:", updateErr.message);
        }
      }
    }

    console.log("[roomActions] Save complete:", room.id);
    return room.id;
  },
};