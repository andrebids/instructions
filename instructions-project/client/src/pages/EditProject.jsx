import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { CreateProjectMultiStep } from "../components/create-project-multi-step";

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Obter step inicial do URL (ex: ?step=ai-designer)
  const initialStep = searchParams.get('step');
  
  // Debug: verificar se o step está a ser lido corretamente
  React.useEffect(() => {
    if (initialStep) {
      console.log('🔗 EditProject: initialStep do URL:', initialStep);
    }
  }, [initialStep]);

  const handleClose = () => {
    navigate("/");
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <CreateProjectMultiStep 
        projectId={id}
        onClose={handleClose}
        initialStep={initialStep}
      />
    </div>
  );
}

