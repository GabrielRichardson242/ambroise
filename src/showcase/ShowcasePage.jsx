import { useEffect, useRef, useState } from "react";
import SceneCanvas from "../components/SceneCanvas";
import { SHOWCASE_ROOM } from "./data/showcaseRoom";
import { useLiDAR } from "../context/LiDARContext";

import ArtworkCloseButton from "./components/ArtworkCloseButton";
import ArtworkFocusPanel from "./components/ArtworkFocusPanel";
import GrainInfoDrawer from "./components/GrainInfoDrawer";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import { createProxyMeshFromScene } from "../utils/proxyGenerator";

export default function ShowcasePage() {
  const { setMeshes } = useLiDAR();
  const hydratedRef = useRef(false);
  const canvasRef = useRef(null);
  const freezeTimeoutRef = useRef(null);

  const [resetSignal, setResetSignal] = useState(0);
  const [zoomFrameImage, setZoomFrameImage] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const [viewerState, setViewerState] = useState({
    mode: "idle",
    selectedArtwork: null,
  });

  const handleArtworkSelect = (artwork) => {
    setZoomFrameImage(null);

    setViewerState({
      mode: "focused",
      selectedArtwork: artwork,
    });

    if (freezeTimeoutRef.current) {
      clearTimeout(freezeTimeoutRef.current);
    }

    freezeTimeoutRef.current = setTimeout(async () => {
      const canvas = canvasRef.current?.getCanvas?.();

      if (!canvas) {
        console.warn("No canvas available for zoom frame capture.");
        return;
      }

      try {
        const image = canvas.toDataURL("image/jpeg", 0.92);

        const preload = new Image();
        preload.src = image;

        if (preload.decode) {
          await preload.decode();
        } else {
          await new Promise((resolve) => {
            preload.onload = resolve;
            preload.onerror = resolve;
          });
        }

        setZoomFrameImage(image);
      } catch (err) {
        console.error("Failed to capture zoom frame:", err);
      }
    }, 1200);
  };

  const handleCloseArtwork = () => {
    if (freezeTimeoutRef.current) {
      clearTimeout(freezeTimeoutRef.current);
    }

    setZoomFrameImage(null);

    setViewerState((prev) => ({
      mode: "returning",
      selectedArtwork: null,
    }));

    setResetSignal((value) => value + 1);
  };

  const handleCameraResetComplete = () => {
    setViewerState({
      mode: "idle",
      selectedArtwork: null,
    });
  };

  // Showcase timer
  useEffect(() => {
  let idleTimer;

  const resetIdleTimer = () => {
    clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
      window.location.reload();
    }, 90000);
  };

  window.addEventListener("touchstart", resetIdleTimer);
  window.addEventListener("touchmove", resetIdleTimer);
  window.addEventListener("click", resetIdleTimer);
  window.addEventListener("scroll", resetIdleTimer);
  window.addEventListener("mousemove", resetIdleTimer);

  resetIdleTimer();

  return () => {
    clearTimeout(idleTimer);
    window.removeEventListener("touchstart", resetIdleTimer);
    window.removeEventListener("touchmove", resetIdleTimer);
    window.removeEventListener("click", resetIdleTimer);
    window.removeEventListener("scroll", resetIdleTimer);
    window.removeEventListener("mousemove", resetIdleTimer);
  };
}, []);

  useEffect(() => {
    async function loadScan() {
      if (hydratedRef.current) return;

      try {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("/draco/");
        dracoLoader.setWorkerLimit(1);

        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        const gltf = await new Promise((resolve, reject) => {
          loader.load(SHOWCASE_ROOM.scanUrl, resolve, undefined, reject);
        });

        const lidarScene = gltf.scene || gltf.scenes?.[0];

        if (!lidarScene) {
          throw new Error("No scene found in GLB");
        }

        lidarScene.traverse((child) => {
          child.frustumCulled = false;
        });

        let proxyMesh = null;

        try {
          proxyMesh = createProxyMeshFromScene(lidarScene.clone(true), {
            simplifyRatio: 0.05,
            inflateDistance: 0.02,
          });
        } catch (proxyErr) {
          console.warn("Proxy mesh skipped for showcase:", proxyErr);
        }

        setMeshes({
          lidarMesh: lidarScene,
          proxyMesh,
        });

        hydratedRef.current = true;

        console.log("Local showcase scan loaded:", SHOWCASE_ROOM.scanUrl);
      } catch (err) {
        console.error("Showcase scan failed to load:", err);
      }
    }

    loadScan();

    return () => {
      if (freezeTimeoutRef.current) {
        clearTimeout(freezeTimeoutRef.current);
      }
    };
  }, [setMeshes]);

  const isZoomed = viewerState.selectedArtwork;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <SceneCanvas
        ref={canvasRef}
        mode="showcase"
        data={SHOWCASE_ROOM}
        onArtworkSelect={handleArtworkSelect}
        isArtworkFocused={viewerState.mode !== "idle" || infoOpen}
        resetSignal={resetSignal}
        onCameraResetComplete={handleCameraResetComplete}
      />

      {!isZoomed && !infoOpen && (
          <div
          style={{
            position: "fixed",
            top: "2vh",
            left: "2vh",
            zIndex: 999989,
            color: "white",
            background: "transparent",
            pointerEvents: "none",
          }}
        >
          <div className="font-disket uppercase leading-none tracking-tight">
            <div className="text-[13px] sm:text-[16px] underline decoration-white decoration-2 underline-offset-2 mt-1">
              @GABRIELRICHARDSON_
            </div>

            <div
              className="font-bold tracking-[0.12em] mt-[8px]"
              style={{ fontSize: "10px" }}
            >
              CREATIVE TECHNOLOGIST / DESIGNER
            </div>

            <div
              className="font-bold tracking-[0.12em] mt-0"
              style={{ fontSize: "10px" }}
            >
              LONDON
            </div>

            <div
              className="font-bold tracking-[0.12em] mt-0"
              style={{ fontSize: "10px" }}
            >
              22
            </div>
          </div>
        </div>
      )}

      {isZoomed && <ArtworkCloseButton onClick={handleCloseArtwork} />}

      {isZoomed && !zoomFrameImage && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "42dvh",
            zIndex: 9999998,
            background: "#202020",
            color: "white",
            pointerEvents: "auto",
            overflowY: "auto",
            overflowX: "hidden",
            boxSizing: "border-box",
            borderTop: "0.5px solid #AFAFAF",
          }}
        >
          <ArtworkFocusPanel artwork={viewerState.selectedArtwork} />
        </div>
      )}

            {isZoomed && zoomFrameImage && (
        <>
          <div
            onClick={handleCloseArtwork}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "20vw",
              height: "50vh",
              zIndex: 9999998,
              pointerEvents: "auto",
              background: "transparent",
            }}
          />

          <div
            onClick={handleCloseArtwork}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "20vw",
              height: "50vh",
              zIndex: 9999998,
              pointerEvents: "auto",
              background: "transparent",
            }}
          />

          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999997,
              background: "#202020",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              animation: "zoomFrameFadeIn 120ms ease-out both",
            }}
          >
            <img
              src={zoomFrameImage}
              alt=""
              style={{
                display: "block",
                width: "100vw",
                height: "58dvh",
                objectFit: "cover",
                objectPosition: "center top",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />

            <ArtworkFocusPanel artwork={viewerState.selectedArtwork} />
          </div>
        </>
      )}

      {!isZoomed && (
        <GrainInfoDrawer
          open={infoOpen}
          onOpen={() => setInfoOpen(true)}
          onClose={() => setInfoOpen(false)}
        />
      )}
    </div>
  );
}