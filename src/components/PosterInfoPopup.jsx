import { useState } from "react";
import "./posterList.css";

export default function PosterInfoPopup({ initialData = {}, onSave, onClose }) {
  const [name, setName] = useState(initialData.name || "");
  const [description, setDescription] = useState(initialData.description || "");

  const handleSave = () => {
    onSave({ name, description });
    onClose();
  };

  return (
    <div className="info-popup-overlay">
      <div className="info-popup">
        <h3>Add Poster Info</h3>

        <label>Name</label>
        <input
          type="text"
          placeholder="Enter poster name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Description</label>
        <textarea
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}