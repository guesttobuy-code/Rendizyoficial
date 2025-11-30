import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

// ✅ Tratamento de erros global para evitar crash do servidor
window.addEventListener('error', (event) => {
  console.error('Erro capturado:', event.error);
  // Previne que o erro quebre o servidor
  event.preventDefault();
  return true; // Indica que o erro foi tratado
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejeitada não tratada:', event.reason);
  // Previne que a rejeição quebre o servidor
  event.preventDefault();
  return true; // Indica que a rejeição foi tratada
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found");
  // Não lança erro, apenas loga
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Erro ao renderizar aplicação:", error);
    // Não quebra o servidor, apenas loga o erro
  }
}
  