import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CreateProjectMultiStep } from "../components/create-project-multi-step";

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/");
  };

  return (
    <div className="w-full h-full">
      <CreateProjectMultiStep 
        projectId={id}
        onClose={handleClose}
      />
    </div>
  );
}

