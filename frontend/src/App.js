import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import EstradasRurais from "./components/EstradasRurais";
import Navbar from "./components/Navbar";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

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