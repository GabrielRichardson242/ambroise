import { A_SIZES } from "./EditPoster";
import PosterInfoPopup from "./PosterInfoPopup";
import "./posterList.css";
import { useState } from "react";

export default function FileUploadBox({
  onFileUpload,
  onSelectPoster,
  selectedPosterIndex,
  posterUrls = [],
  posterSizes = [],
  onChangePosterSize,
  setPosterUrls,
  setPosterSizes,
}) {
  const [posterInfo, setPosterInfo] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupIndex, setPopupIndex] = useState(null);

  const handleChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!onFileUpload) return;

    // Disable the old createObjectURL logic entirely
    await onFileUpload(file); // handleFileUpload() inside Editor does everything
    setPosterInfo((prev) => [...prev, { name: "", description: "" }]);
    event.target.value = ""; // reset input so same file can be reuploaded if needed
  };

  const handleDelete = (index) => {
    const updatedUrls = [...posterUrls];
    const updatedSizes = [...posterSizes];
    const updatedInfo = [...posterInfo];

    updatedUrls.splice(index, 1);
    updatedSizes.splice(index, 1);
    updatedInfo.splice(index, 1);

    setPosterUrls(updatedUrls);
    setPosterSizes(updatedSizes);
    setPosterInfo(updatedInfo);

    if (selectedPosterIndex === index) onSelectPoster(null);
  };

  const handleSaveInfo = (data) => {
    setPosterInfo((prev) => {
      const updated = [...prev];
      updated[popupIndex] = data;
      return updated;
    });
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "100px",
        right: 5,
        width: "240px",
        backgroundColor: "rgba(30,30,30,0.6)",
        padding: "5px",
        borderRadius: "20px",
        zIndex: 10,
      }}
    >
      <div
        className="poster-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          justifyItems: "center",
        }}
      >
        {posterUrls.map((url, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "#111",
              borderRadius: "8px",
              padding: "10px",
              margin: "5px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "calc(100% - 10px)",
              border:
                selectedPosterIndex === index
                  ? "1px solid #aaa"
                  : "1px solid #333",
            }}
          >
            <img
              src={url}
              alt={`Poster ${index + 1}`}
              onClick={() => onSelectPoster?.(index)}
              className={`poster-thumb ${
                selectedPosterIndex === index ? "selected" : ""
              }`}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "140px",
                objectFit: "cover",
                borderRadius: "6px",
              }}
            />

            {posterInfo[index]?.name && (
              <div
                className="poster-info-summary"
                style={{
                  width: "100%",
                  textAlign: "center",
                }}
              >
                <strong>{posterInfo[index].name}</strong>
                <br />
                {posterInfo[index].description.slice(0, 30)}...
              </div>
            )}

            <select
              value={posterSizes[index]}
              onChange={(e) => onChangePosterSize(index, e.target.value)}
              style={{
                width: "100%",
                padding: "6px",
                borderRadius: "6px",
                backgroundColor: "#222",
                color: "#eee",
                border: "1px solid #444",
                fontSize: "13px",
              }}
            >
              <option value="" disabled>
                Size
              </option>
              {Object.keys(A_SIZES).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <button
              style={{ width: "100%" }}
              onClick={() => {
                setPopupIndex(index);
                setShowPopup(true);
              }}
            >
              {posterInfo[index]?.name ? "Edit Info" : "Add Info"}
            </button>

            <button
              onClick={() => handleDelete(index)}
              style={{
                width: "100%",
                padding: "5px",
                borderRadius: "6px",
                backgroundColor: "transparent",
                border: "1px solid #ff4d4d",
                color: "#ff4d4d",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))}

        <label
          htmlFor="file-upload"
          style={{
            width: "calc(100% - 10px)",
            height: "150px",
            border: "2px dashed #ccc",
            borderRadius: "8px",
            textAlign: "center",
            lineHeight: "150px",
            fontSize: "14px",
            cursor: "pointer",
            color: "#ccc",
            margin: "5px",
          }}
        >
          + Add File
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleChange}
          style={{ display: "none" }}
        />
      </div>

      {showPopup && (
        <PosterInfoPopup
          initialData={posterInfo[popupIndex]}
          onSave={handleSaveInfo}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}