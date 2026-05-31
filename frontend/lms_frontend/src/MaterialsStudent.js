import React, { useState } from "react";
import axios from "axios";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import StatCard from "./ui/StatCard";
import AlertBox from "./AlertBox";
import { FaFolderOpen, FaBookOpen, FaSearch } from "react-icons/fa";
import "./theme.css";

function MaterialsStudent() {
  const [subjectCode, setSubjectCode] = useState("");
  const [materials, setMaterials] = useState([]);
  const [alert, setAlert] = useState(null);

  const handleSearch = async () => {
    if (!subjectCode) {
      setAlert({
        message: "Enter subject code first",
        type: "error"
      });
      return;
    }

    try {
      const res = await axios.get(
        `https://smart-study-planner-lms-1.onrender.com/materials/${subjectCode}`
      );

      setMaterials(res.data.materials || []);
    } catch (err) {
      console.error(err);
      setAlert({
        message: "Failed to load materials",
        type: "error"
      });
    }
  };

  const renderFile = (fileUrl) => {
    const fullUrl = `https://smart-study-planner-lms-1.onrender.com/${fileUrl}`;
    const lower = fileUrl.toLowerCase();

    if (
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".webp")
    ) {
      return (
        <img
          src={fullUrl}
          alt="material"
          style={{
            width: "100%",
            maxHeight: "260px",
            objectFit: "cover",
            borderRadius: "12px",
            marginTop: "12px"
          }}
        />
      );
    }

    if (
      lower.endsWith(".mp4") ||
      lower.endsWith(".webm") ||
      lower.endsWith(".ogg")
    ) {
      return (
        <video
          controls
          style={{
            width: "100%",
            borderRadius: "12px",
            marginTop: "12px"
          }}
        >
          <source src={fullUrl} />
        </video>
      );
    }

    return (
      <div style={{ marginTop: "12px" }}>
        <a className="btn btn-info" href={fullUrl} target="_blank">
          Open File
        </a>
      </div>
    );
  };

  return (
    <AppShell
      title="Materials Library"
      subtitle="Search subject-wise notes and study media using subject code."
    >
      {alert && (
        <AlertBox
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="page-grid-3" style={{ marginBottom: "20px" }}>
        <StatCard icon={<FaFolderOpen />} label="Materials Found" value={materials.length} hint="Loaded for selected subject code" />
        <StatCard icon={<FaBookOpen />} label="Access Type" value="Student" hint="Read-only study access" />
        <StatCard icon={<FaSearch />} label="Lookup Mode" value="Subject Code" hint="Search using exact code" />
      </div>

      <Panel title="Search Materials">
        <div className="btn-row">
          <input
            className="input"
            type="text"
            placeholder="Enter Subject Code"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            style={{ flex: 1 }}
          />

          <button className="btn btn-primary" onClick={handleSearch}>
            Search
          </button>
        </div>
      </Panel>

      <div style={{ marginTop: "18px" }}>
        <Panel title="Available Materials">
          {materials.length === 0 ? (
            <p className="muted">No materials found.</p>
          ) : (
            <div className="page-grid-2">
              {materials.map((m) => (
                <div className="list-card" key={m.id}>
                  <h4 style={{ marginTop: 0 }}>{m.title}</h4>
                  <div className="muted">Subject Code: {m.subject_code}</div>
                  {renderFile(m.file_url)}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

export default MaterialsStudent;