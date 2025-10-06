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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="https://avatars.githubusercontent.com/in/1201222?s=120&u=2686cf91179bbafbc7a71bfbc43004cf9ae1acea&v=4" 
              alt="Emergent Logo"
              className="w-20 h-20 rounded-full shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Portal de Consultas
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema de consulta e gestão de dados municipais
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
                dados do gov - teste
              </h2>
              <p className="text-gray-400 mb-4">
                Em breve: Sistema de acompanhamento em tempo real dos protocolos do gov, com maior velocidade e acertividade na busca
              </p>
              <div className="text-gray-400">
                Em desenvolvimento
              </div>
            </div>
          </div>

          {/* Card Placeholder 2 */}
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