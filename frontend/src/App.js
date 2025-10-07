import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import EstradasRurais from "./components/EstradasRurais";
import Navbar from "./components/Navbar";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Componente que redireciona para estradas-rurais se não estiver autenticado
function RedirectIfNotAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/estradas-rurais" replace />;
  }

  return children;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            {/* PONTO ÚNICO DE ENTRADA - Estradas Rurais */}
            <Route 
              path="/estradas-rurais" 
              element={
                <ProtectedRoute>
                  <EstradasRurais />
                </ProtectedRoute>
              } 
            />
            
            {/* Rotas internas - acessíveis após login */}
            <Route 
              path="/admin" 
              element={
                <RedirectIfNotAuth>
                  <ProtectedRoute adminOnly={true}>
                    <AdminPanel />
                  </ProtectedRoute>
                </RedirectIfNotAuth>
              } 
            />
            
            {/* TODAS as outras rotas (incluindo /) redirecionam para /estradas-rurais */}
            <Route path="/" element={<Navigate to="/estradas-rurais" replace />} />
            <Route path="*" element={<Navigate to="/estradas-rurais" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;