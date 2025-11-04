import React from "react";
import { Spinner } from "@heroui/react";

/**
 * Componente de Indicador de Carregamento
 * Overlay simples com spinner centralizado
 */
export const LoadingIndicator = () => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
    <Spinner size="lg" />
    <p className="mt-4 text-white">Simulating image processing...</p>
  </div>
);

