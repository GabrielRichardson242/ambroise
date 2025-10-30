import { createContext, useContext, useRef, useState } from "react";

const LiDARContext = createContext(null);

export function LiDARProvider({ children }) {
  // render mesh (raw LiDAR) + interaction mesh (proxy)
  const lidarMeshRef = useRef(null);
  const proxyMeshRef = useRef(null);

  // optional: legacy flags you already use
  const [meshReady, setMeshReady] = useState(false);
  const [uvMap, setUvMap] = useState(null);
  const [uvReady, setUvReady] = useState(false);

  const setMeshes = ({ lidarMesh, proxyMesh }) => {
    lidarMeshRef.current = lidarMesh || null;
    proxyMeshRef.current = proxyMesh || null;
    setMeshReady(!!lidarMesh && !!proxyMesh);
  };

  return (
    <LiDARContext.Provider
      value={{
        // new
        lidarMeshRef,
        proxyMeshRef,
        setMeshes,
        meshReady,
        // legacy (keep if you still need)
        uvMap, setUvMap, uvReady, setUvReady,
      }}
    >
      {children}
    </LiDARContext.Provider>
  );
}

export function useLiDAR() {
  const ctx = useContext(LiDARContext);
  if (!ctx) throw new Error("useLiDAR must be used within LiDARProvider");
  return ctx;
}