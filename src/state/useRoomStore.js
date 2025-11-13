import { useSyncExternalStore } from "react";
import { roomState } from "./roomState";

let listeners = new Set();

// subscribe / unsubscribe
function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// emit updates to all subscribed components
export function emitRoomUpdate() {
  for (const cb of listeners) cb();
}

// Hook: used by components
export function useRoomStore(selector = (s) => s) {
  return useSyncExternalStore(
    subscribe,
    () => selector(roomState)
  );
}