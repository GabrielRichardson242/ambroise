import { useEffect, useState } from "react";
import { roomActions } from "../state/roomActions";
import { roomState } from "../state/roomState";

export function useSupabaseRoom(roomId) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    let isMounted = true;

    (async () => {
      try {
        await roomActions.loadRoomFromSupabase(roomId);
        if (isMounted) setLoading(false);
      } catch (err) {
        console.error("[useSupabaseRoom] Failed to load room:", err);
      }
    })();

    return () => { isMounted = false };
  }, [roomId]);

  return {
    room: roomState.data,
    posters: roomState.posters,
    loading,
  };
}