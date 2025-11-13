import { v4 as uuidv4 } from "uuid";
import { emitRoomUpdate } from "./useRoomStore";

class RoomState {
  constructor() {
    this.reset();
  }

  // === Create a new empty room ===
  createNewRoom() {
    this.reset();
    this.data.id = uuidv4();
    this.data.name = "Untitled Room";
    this.data.created_at = new Date().toISOString();
    emitRoomUpdate();
    return this.data.id;
  }

  // === Load existing room + posters from Supabase (hydrated shape) ===
  loadRoom(roomData, posters = []) {
    this.reset();
    this.data = { ...this.data, ...roomData };

    this.posters = posters.map((p) => ({
      id: p.id || uuidv4(),
      // accept either hydrated {url, transform} or raw Supabase {file_url, position,...}
      url: p.url || p.file_url,
      size: p.size || "A0",
      transform:
        p.transform ||
        (p.position
          ? {
              position: p.position,
              rotation: p.rotation || [0, 0, 0],
              scale: p.scale || [1, 1, 1],
            }
          : null),
    }));

    emitRoomUpdate();
  }

  // === Reset to empty state ===
  reset() {
    this.data = {
      id: null,
      name: "",
      description: "",
      scan_draco_url: "",
      raw_url: "",
      camera_position: [0, 2, 5],
      camera_target: [0, 0, 0],
      theme: "default",
    };
    this.posters = [];
    emitRoomUpdate();
  }

  // === Add a new poster (immutable push) ===
  addPoster(url, size = "A0") {
    const poster = { id: uuidv4(), url, size, transform: null };
    this.posters = [...this.posters, poster];
    emitRoomUpdate();
    return poster;
  }

  // === Update a specific poster (immutable merge) ===
  updatePoster(index, partial) {
    if (!this.posters[index]) return;
    const next = this.posters.slice();
    next[index] = {
      ...next[index],
      ...partial,
      transform: {
        ...next[index].transform,
        ...partial.transform,
      },
    };
    this.posters = next;
    emitRoomUpdate();
  }

  // === Remove poster at index (immutable) ===
  removePoster(index) {
    if (index < 0 || index >= this.posters.length) return;
    this.posters = this.posters.filter((_, i) => i !== index);
    emitRoomUpdate();
  }

  // === Replace all posters ===
  setPosters(newPosters) {
    this.posters = Array.isArray(newPosters) ? [...newPosters] : [];
    emitRoomUpdate();
  }

  // === Serialize to save to Supabase ===
  serialize() {
    return {
      room: { ...this.data },
      posters: this.posters.map((p) => ({
        file_url: p.url,
        size: p.size,
        position: p.transform?.position || null,
        rotation: p.transform?.rotation || null,
        scale: p.transform?.scale || null,
      })),
    };
  }
}

export const roomState = new RoomState();