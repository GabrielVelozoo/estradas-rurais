import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import EstradasRurais from "./components/EstradasRurais";
import Navbar from "./components/Navbar";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

// Componente principal que gerencia o roteamento baseado na autenticação
function MainApp() {
  const { isAuthenticated, loading } = require('./contexts/AuthContext').useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não estiver autenticado, mostra apenas a página de login (sem navbar)
  if (!isAuthenticated()) {
    return (
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        {/* Todas as outras rotas redirecionam para a página principal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Se estiver autenticado, mostra a aplicação completa
  return (
    <>
      <Navbar />
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/estradas-rurais" 
          element={
            <ProtectedRoute>
              <EstradasRurais />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        {/* Qualquer rota não encontrada redireciona para home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;