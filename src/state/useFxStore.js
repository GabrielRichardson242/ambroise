import { create } from "zustand";

// Global shader/UI FX store
export const useFxStore = create((set) => ({
  fx: {
    pointDensity: 1.0,    // 0..1
    pointSize: 2.0,       // pixels
    fill: 1.0,            // 0..1 (radial fill: center-out reveal)
    blur: 0.0,            // 0..1
    noise: 0.0,           // 0..1
    transparency: 1.0,    // 0..1
    useTint: true,        // default ON
    hue: "#ffffff",       // colour filter
  },
  setFx: (key, value) =>
    set((state) => ({ fx: { ...state.fx, [key]: value } })),
}));