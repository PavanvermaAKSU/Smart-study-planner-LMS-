import React, { useState } from "react";
import axios from "axios";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import StatCard from "./ui/StatCard";
import AlertBox from "./AlertBox";
import { FaFolderOpen, FaUpload, FaFileAlt } from "react-icons/fa";
import "./theme.css";

function UploadMaterial() {
  const [subjectCode, setSubjectCode] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [alert, setAlert] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subjectCode || !title || !file) {
      setAlert({
        message: "Please fill all fields and choose a file",
        type: "error"
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("subject_code", subjectCode);
      formData.append("title", title);
      formData.append("file", file);

      const res = await axios.post(
        "https://smart-study-planner-lms-1.onrender.com/upload-material",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setAlert({
        message: res.data.message,
        type: "success"
      });

      setSubjectCode("");
      setTitle("");
      setFile(null);
    } catch (err) {
      console.error(err);
      setAlert({
        message: "Material upload failed",
        type: "error"
      });
    }
  };

  return (
    <AppShell
      title="Upload Notes & Media"
      subtitle="Upload image, video, or learning files using subject code."
    >
      {alert && (
        <AlertBox
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="page-grid-3" style={{ marginBottom: "20px" }}>
        <StatCard icon={<FaFolderOpen />} label="Upload Mode" value="Teacher" hint="Only teachers can upload" />
        <StatCard icon={<FaUpload />} label="File Flow" value="Active" hint="Supports multimedia material" />
        <StatCard icon={<FaFileAlt />} label="Mapping" value="Subject Code" hint="Content linked by subject code" />
      </div>

      <Panel title="Upload Material">
        <form onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            placeholder="Subject Code"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
          />

          <input
            className="input"
            type="text"
            placeholder="Material Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="input"
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ padding: "10px" }}
          />

          <button className="btn btn-primary" type="submit">
            Upload Material
          </button>
        </form>
      </Panel>
    </AppShell>
  );
}

export default UploadMaterial;