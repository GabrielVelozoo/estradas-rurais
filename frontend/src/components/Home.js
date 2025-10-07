import { useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const helloWorldApi = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log(response.data.message);
    } catch (e) {
      console.error(e, `errored out requesting / api`);
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Portal de Consultas do Gabinete
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Sistema de informações resumidos da administração municipal
            </p>
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 border border-white/20">
                <span className="text-blue-100 text-sm font-medium">
                  🏛️ Gabinete do Prefeito • Sistema Oficial
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Seção de boas-vindas */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Bem-vindo ao Sistema Integrado
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Acesse informações consolidadas e relatórios executivos para apoiar a tomada de decisões no gabinete
          </p>
        </div>

        {/* Cards de Navegação */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card Estradas Rurais */}
          <Link 
            to="/estradas-rurais" 
            className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-blue-300"
          >
            <div className="text-center">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                🛣️
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Estradas Rurais
              </h2>
              <p className="text-gray-600 mb-4">
                Consulte informações sobre projetos e investimentos em estradas rurais municipais
              </p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700">
                Acessar Sistema →
              </div>
            </div>
          </Link>

          {/* Card Placeholder 1 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 opacity-75">
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-50">
                🏛️
              </div>
              <h2 className="text-2xl font-bold text-gray-500 mb-3">
                Dados do Gov
              </h2>
              <p className="text-gray-400 mb-4">
                Em breve: Sistema de acompanhamento em tempo real dos protocolos do gov, com maior velocidade e acertividade na busca
              </p>
              <div className="text-gray-400">
                Em desenvolvimento
              </div>
            </div>
          </div>

          {/* Card Relatórios */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 opacity-75">
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-50">
                📊
              </div>
              <h2 className="text-2xl font-bold text-gray-500 mb-3">
                Relatórios
              </h2>
              <p className="text-gray-400 mb-4">
                Em breve: Dashboards e relatórios analíticos
              </p>
              <div className="text-gray-400">
                Em desenvolvimento
              </div>
            </div>
          </div>

          {/* Card Pedidos de Maquinários */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 opacity-75">
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-50">
                🚜
              </div>
              <h2 className="text-2xl font-bold text-gray-500 mb-3">
                Pedidos de Maquinários
              </h2>
              <p className="text-gray-400 mb-4">
                Em breve: Lista de maquinários pedidos por municípios e lideranças
              </p>
              <div className="text-gray-400">
                Em desenvolvimento
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">
            📈 Resumo do Sistema
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">1</div>
              <div className="text-gray-600">Sistema Ativo</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-gray-600">Disponibilidade</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">Real-time</div>
              <div className="text-gray-600">Atualização</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">24/7</div>
              <div className="text-gray-600">Acesso</div>
            </div>
          </div>
        </div>

        {/* Footer removido conforme solicitado */}
      </div>
    </div>
  );
};

export default Home;