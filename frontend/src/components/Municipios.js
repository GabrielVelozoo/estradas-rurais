import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Municipios() {
  const [municipios, setMunicipios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  // Função para normalizar texto (remover acentos)
  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  // Carregar municípios
  const fetchMunicipios = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/municipios`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar municípios: ${response.status}`);
      }

      const data = await response.json();
      setMunicipios(data);
    } catch (error) {
      console.error('Erro ao carregar municípios:', error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchMunicipios();
  }, []);

  // Filtrar municípios pela busca (client-side para resposta instantânea)
  const municipiosFiltrados = useMemo(() => {
    if (!busca) return municipios;
    
    const buscaNormalizada = normalizeText(busca);
    
    return municipios.filter(municipio => {
      return normalizeText(municipio.nome).includes(buscaNormalizada);
    });
  }, [municipios, busca]);

  // Handle click no município
  const handleMunicipioClick = (municipio) => {
    // Navegar para pedidos lideranças com filtro do município
    navigate(`/pedidos-liderancas?municipio=${encodeURIComponent(municipio.nome)}`);
  };

  // Loading skeleton
  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 bg-gray-200 rounded w-1/3 mb-8 animate-pulse"></div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            🏙️ Municípios do Paraná
          </h1>
          <p className="text-gray-600">
            {municipios.length} municípios cadastrados
          </p>
        </div>

        {/* Barra de busca */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Campo de busca */}
            <div className="flex-1 max-w-2xl">
              <input
                type="text"
                placeholder="🔍 Buscar município... (ex: Curitiba, Londrina, Maringa)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              />
              <p className="text-sm text-gray-500 mt-2">
                A busca é acento-insensível (ex: "Sao" encontra "São")
              </p>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-4 text-sm text-gray-600">
            {municipiosFiltrados.length} {municipiosFiltrados.length === 1 ? 'município encontrado' : 'municípios encontrados'}
            {busca && municipiosFiltrados.length < municipios.length && ` (de ${municipios.length} total)`}
          </div>
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            ⚠️ {erro}
          </div>
        )}

        {/* Tabela de municípios */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {municipiosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {busca ? (
                <>
                  🔍 Nenhum município encontrado com <strong>"{busca}"</strong>
                  <br />
                  <button
                    onClick={() => setBusca('')}
                    className="mt-4 text-green-600 hover:text-green-700 underline"
                  >
                    Limpar busca
                  </button>
                </>
              ) : (
                '🏙️ Nenhum município cadastrado'
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">#</th>
                    <th className="px-6 py-4 text-left font-semibold">Município</th>
                    <th className="px-6 py-4 text-left font-semibold">Nº da Liderança</th>
                  </tr>
                </thead>
                <tbody>
                  {municipiosFiltrados.map((municipio, index) => (
                    <tr
                      key={municipio.id}
                      onClick={() => handleMunicipioClick(municipio)}
                      className={`border-b border-gray-100 hover:bg-green-50 transition-colors cursor-pointer ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                      title={`Clique para ver pedidos de ${municipio.nome}`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-gray-500 font-medium">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-semibold text-lg hover:text-green-600">
                          {municipio.nome}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {municipio.numero_lideranca ? (
                          <span className="text-gray-700 font-mono bg-gray-100 px-3 py-1 rounded">
                            {municipio.numero_lideranca}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Estatísticas */}
        {!busca && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Estatísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{municipios.length}</div>
                <div className="text-gray-600 text-sm">Total de Municípios</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {municipios.filter(m => m.numero_lideranca).length}
                </div>
                <div className="text-gray-600 text-sm">Com Liderança</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {municipios.filter(m => !m.numero_lideranca).length}
                </div>
                <div className="text-gray-600 text-sm">Sem Liderança</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">PR</div>
                <div className="text-gray-600 text-sm">Estado</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
