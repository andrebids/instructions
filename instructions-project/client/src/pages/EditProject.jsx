import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { CreateProjectMultiStep } from "../components/create-project-multi-step";

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Obter step inicial do URL (ex: ?step=ai-designer)
  let initialStep = searchParams.get('step');
  // Obter logoIndex do URL (ex: ?logoIndex=0)
  const logoIndex = searchParams.get('logoIndex');
  
  // Se há logoIndex mas não há initialStep, definir initialStep para logo-instructions
  if (logoIndex && !initialStep) {
    initialStep = 'logo-instructions';
  }
  
  // Debug: verificar se o step está a ser lido corretamente
  React.useEffect(() => {
    if (initialStep) {
      console.log('🔗 EditProject: initialStep do URL:', initialStep);
    }
    if (logoIndex) {
      console.log('🔗 EditProject: logoIndex do URL:', logoIndex);
    }
  }, [initialStep, logoIndex]);

  const handleClose = () => {
    navigate("/");
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <CreateProjectMultiStep 
        projectId={id}
        onClose={handleClose}
        initialStep={initialStep}
        logoIndex={logoIndex ? parseInt(logoIndex, 10) : null}
      />
    </div>
  );
}

