import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import EstradasRurais from "./components/EstradasRurais";
import Navbar from "./components/Navbar";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Componente que redireciona para home se não estiver autenticado
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
    return <Navigate to="/" replace />;
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
            {/* Página principal - único ponto de entrada */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            
            {/* Rotas internas - redirecionam para home se não autenticado */}
            <Route 
              path="/estradas-rurais" 
              element={
                <RedirectIfNotAuth>
                  <ProtectedRoute>
                    <EstradasRurais />
                  </ProtectedRoute>
                </RedirectIfNotAuth>
              } 
            />
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
            
            {/* TODAS as outras rotas redirecionam para a página principal */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;