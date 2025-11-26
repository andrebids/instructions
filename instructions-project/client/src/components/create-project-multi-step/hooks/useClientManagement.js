import { useState, useEffect } from "react";
import { MOCK_CLIENTS } from "../utils/mockData";

export const useClientManagement = (setFormData) => {
  const [clients, setClients] = useState([]);
  const [newClientModal, setNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: "",
    email: ""
  });

  // Carregar clientes (movido para antes do useEffect)
  const loadClients = async () => {
    try {
      setClients(MOCK_CLIENTS);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  };

  // Carregar clientes
  useEffect(() => {
    // Usar setTimeout para evitar setState síncrono em effect
    setTimeout(() => {
      loadClients();
    }, 0);
  }, []);

  // Handler de input do autocomplete
  const handleClientInputChange = (value) => {
    setFormData(prev => ({
      ...prev,
      clientName: value,
    }));
  };

  // Seleção de cliente
  const handleClientSelection = (key) => {
    if (key) {
      const clientId = typeof key === 'string' ? parseInt(key) : key;
      const client = clients.find(c => c.id === clientId);
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
    };

    setClients(prev => [...prev, newClient]);
    setFormData(prev => ({
      ...prev,
      selectedClientKey: newClient.id,
      clientId: newClient.id,
      clientName: newClient.name,
      clientEmail: newClient.email,
    }));

    setNewClientModal(false);
    setNewClientData({ name: "", email: "" });
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

