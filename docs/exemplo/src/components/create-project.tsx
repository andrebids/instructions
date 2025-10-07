import React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Input,
  Button,
  Textarea,
  Select,
  SelectItem,
  DatePicker
} from "@heroui/react";
import { Icon } from "@iconify/react";

export function CreateProject({ onClose }) {
  const [formData, setFormData] = React.useState({
    name: "",
    client: "",
    status: "Em Progresso",
    startDate: null,
    endDate: null,
    budget: "",
    description: ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Form submitted:", formData);
    // Show success message and close form
    onClose();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button 
            isIconOnly 
            variant="light" 
            onClick={onClose}
            className="mr-2"
          >
            <Icon icon="lucide:arrow-left" className="text-xl" />
          </Button>
          <h1 className="text-2xl font-bold">Criar Novo Projeto</h1>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-default-200 pb-2">
          <h2 className="text-lg">Detalhes do Projeto</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                isRequired
                label="Nome do Projeto"
                placeholder="Digite o nome do projeto"
                value={formData.name}
                onValueChange={(value) => handleChange("name", value)}
              />
              
              <Input
                isRequired
                label="Cliente"
                placeholder="Digite o nome do cliente"
                value={formData.client}
                onValueChange={(value) => handleChange("client", value)}
              />
              
              <Select
                isRequired
                label="Status"
                placeholder="Selecione o status"
                defaultSelectedKeys={["Em Progresso"]}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <SelectItem key="Em Progresso" value="Em Progresso">Em Progresso</SelectItem>
                <SelectItem key="Finalizado" value="Finalizado">Finalizado</SelectItem>
                <SelectItem key="Aprovado" value="Aprovado">Aprovado</SelectItem>
              </Select>
              
              <Input
                isRequired
                label="Orçamento (R$)"
                placeholder="Digite o valor do orçamento"
                value={formData.budget}
                onValueChange={(value) => handleChange("budget", value)}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">R$</span>
                  </div>
                }
              />
              
              <DatePicker
                isRequired
                label="Data de Início"
                placeholder="Selecione a data"
                onChange={(date) => handleChange("startDate", date)}
              />
              
              <DatePicker
                isRequired
                label="Data de Término"
                placeholder="Selecione a data"
                onChange={(date) => handleChange("endDate", date)}
              />
              
              <div className="md:col-span-2">
                <Textarea
                  label="Descrição do Projeto"
                  placeholder="Digite uma descrição detalhada do projeto"
                  value={formData.description}
                  onValueChange={(value) => handleChange("description", value)}
                  minRows={4}
                />
              </div>
            </div>
          </form>
        </CardBody>
        <CardFooter className="flex justify-end gap-2 border-t border-default-200 pt-4">
          <Button 
            variant="flat" 
            color="default"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            color="primary"
            onClick={handleSubmit}
          >
            Criar Projeto
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}