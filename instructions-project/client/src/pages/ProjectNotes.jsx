import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { SimpleEditor } from '../components/project-notes/SimpleEditor';
import { projectsAPI } from '../services/api';
import { PageTitle } from '../components/page-title';
import { useUser } from '../context/UserContext';

export default function ProjectNotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userName } = useUser();
  const [project, setProject] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Carregar projeto ao montar componente
  React.useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectData = await projectsAPI.getById(id);
      setProject(projectData);
    } catch (err) {
      console.error('❌ Erro ao carregar projeto:', err);
      setError('Erro ao carregar projeto. Verifique se o projeto existe.');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex-1 min-h-0 overflow-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" label="A carregar projeto..." />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex-1 min-h-0 overflow-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardBody>
            <div className="text-center py-8">
              <Icon icon="lucide:alert-circle" className="text-4xl text-danger mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Erro ao carregar projeto</h2>
              <p className="text-default-500 mb-4">{error || 'Projeto não encontrado'}</p>
              <Button color="primary" onPress={() => navigate('/')}>
                Voltar ao Dashboard
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              variant="light"
              onPress={() => navigate('/')}
              aria-label="Voltar"
            >
              <Icon icon="lucide:arrow-left" className="text-xl" />
            </Button>
            <PageTitle 
              title={`Notas: ${project.name}`}
              userName={userName}
              subtitle={`Cliente: ${project.clientName}`}
            />
          </div>
        </div>

        {/* Informações do projeto */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Informações do Projeto</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-default-500">Nome:</span>
                <span className="ml-2 font-medium">{project.name}</span>
              </div>
              <div>
                <span className="text-default-500">Cliente:</span>
                <span className="ml-2 font-medium">{project.clientName}</span>
              </div>
              {project.location && (
                <div>
                  <span className="text-default-500">Localização:</span>
                  <span className="ml-2 font-medium">{project.location}</span>
                </div>
              )}
              <div>
                <span className="text-default-500">Tipo:</span>
                <span className="ml-2 font-medium capitalize">{project.projectType}</span>
              </div>
              {project.status && (
                <div>
                  <span className="text-default-500">Status:</span>
                  <span className="ml-2 font-medium capitalize">{project.status}</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Editor de Notas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold">Notas do Projeto</h3>
          </div>
        </CardHeader>
        <CardBody>
          <SimpleEditor />
        </CardBody>
      </Card>
    </div>
  );
}

