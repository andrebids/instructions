import { useState, useEffect } from "react";
import { MOCK_CLIENTS, getRandomClient, getRandomProjectName } from "../utils/mockData";

export const useClientManagement = (setFormData) => {
  const [clients, setClients] = useState([]);
  const [newClientModal, setNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ 
    name: "", 
    email: "", 
    phone: "" 
  });

  // Carregar clientes
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setClients(MOCK_CLIENTS);
      
      // Demo: pré-selecionar cliente aleatório
      if (MOCK_CLIENTS.length > 0) {
        const defaultClient = getRandomClient();
        const randomProjectName = getRandomProjectName();
        
        setFormData(prev => ({
          ...prev,
          name: randomProjectName,
          selectedClientKey: defaultClient.id,
          clientId: defaultClient.id,
          clientName: defaultClient.name,
          clientEmail: defaultClient.email,
          clientPhone: defaultClient.phone,
        }));
      }
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  };

  // Handler de input do autocomplete
  const handleClientInputChange = (value) => {
    setFormData(prev => ({
      ...prev,
      clientName: value,
    }));
  };

  // Seleção de cliente
  const handleClientSelection = (key) => {
    console.log('Selected key:', key, 'Type:', typeof key);
    if (key) {
      const clientId = typeof key === 'string' ? parseInt(key) : key;
      const client = clients.find(c => c.id === clientId);
      console.log('Found client:', client);
      if (client) {
        setFormData(prev => ({
          ...prev,
          selectedClientKey: key,
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email,
          clientPhone: client.phone,
        }));
      }
    }
  };

  // Criar novo cliente
  const handleCreateNewClient = () => {
    const newClient = {
      id: Date.now(),
      name: newClientData.name,
      email: newClientData.email,
      phone: newClientData.phone,
    };
    
    setClients(prev => [...prev, newClient]);
    setFormData(prev => ({
      ...prev,
      selectedClientKey: newClient.id,
      clientId: newClient.id,
      clientName: newClient.name,
      clientEmail: newClient.email,
      clientPhone: newClient.phone,
    }));
    
    setNewClientModal(false);
    setNewClientData({ name: "", email: "", phone: "" });
  };

  return {
    clients,
    newClientModal,
    setNewClientModal,
    newClientData,
    setNewClientData,
    handleClientInputChange,
    handleClientSelection,
    handleCreateNewClient,
  };
};

