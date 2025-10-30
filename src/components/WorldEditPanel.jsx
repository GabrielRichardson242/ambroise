import { useFxStore } from "../state/useFxStore";
import { HexColorPicker } from "react-colorful";

export default function WorldEditPanel() {
  const { fx, setFx } = useFxStore();

  return (
    <div
      style={{
        color: "#ddd",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        backgroundColor: "rgba(20,20,20,0.7)",
        borderRadius: 8,
      }}
    >
      {/* POINT DENSITY */}
      <label>Point Density</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={fx.pointDensity}
        onChange={(e) => setFx("pointDensity", parseFloat(e.target.value))}
      />

      {/* POINT SIZE */}
      <label>Point Size (px)</label>
      <input
        type="range"
        min="1"
        max="8"
        step="0.1"
        value={fx.pointSize}
        onChange={(e) => setFx("pointSize", parseFloat(e.target.value))}
      />

      {/* CENTER FILL */}
      <label>Center Fill</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={fx.fill}
        onChange={(e) => setFx("fill", parseFloat(e.target.value))}
      />

      {/* TRANSPARENCY */}
      <label>Transparency</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={fx.transparency}
        onChange={(e) =>
          setFx("transparency", parseFloat(e.target.value))
        }
      />

      {/* USE TINT TOGGLE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <label>Use Tint</label>
        <input
          type="checkbox"
          checked={fx.useTint}
          onChange={(e) => setFx("useTint", e.target.checked)}
        />
      </div>

      {/* HUE / COLOUR PICKER */}
      <label>Hue / Colour Filter</label>
      <HexColorPicker
        color={fx.hue}
        onChange={(val) => setFx("hue", val)}
      />

      {/* BLUR */}
      <label>Blur (placeholder)</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={fx.blur}
        onChange={(e) => setFx("blur", parseFloat(e.target.value))}
      />

      {/* NOISE */}
      <label>Noise (placeholder)</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={fx.noise}
        onChange={(e) => setFx("noise", parseFloat(e.target.value))}
      />
    </div>
  );
}