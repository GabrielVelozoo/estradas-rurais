import React, { useEffect, useState } from 'react';

const EstradasRurais = () => {
  const [dados, setDados] = useState([]);
  const [dadosFiltrados, setDadosFiltrados] = useState([]);
  const [filtros, setFiltros] = useState({
    municipio: '',
    estado: '',
    valorMin: '',
    valorMax: ''
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [estados, setEstados] = useState([]);
  const itensPorPagina = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCarregando(true);
        const response = await fetch(
          `https://docs.google.com/spreadsheets/d/1jaHnRgqRyMLjZVvaRSkG2kOyZ4kMEBgsPhwYIGVj490/gviz/tq?tqx=out:json&tq=select%20*`
        );
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados da planilha');
        }
        
        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        
        console.log('Total rows from API:', json.table.rows.length);
        console.log('Raw API response table:', json.table);
        
        const allRows = json.table.rows.map((r, index) => {
          const c = r.c ? r.c.map((x) => (x ? x.v : '')) : [];
          const row = {
            municipio: c[0] || '',
            protocolo: c[1] || '',
            prefeito: c[2] || '',
            estado: c[3] || '',
            descricao: c[4] || '',
            valor: c[5] || 0,
          };
          if (index < 5) console.log('Sample row', index, ':', row);
          return row;
        });
        
        console.log('Total mapped rows:', allRows.length);
        
        // Filtro mais permissivo - apenas remove linhas completamente vazias ou header
        const rows = allRows.filter(row => {
          const hasData = row.municipio && 
                         typeof row.municipio === 'string' && 
                         row.municipio.trim() !== '' && 
                         row.municipio.toUpperCase() !== 'MUNICÍPIO';
          return hasData;
        });
        
        console.log('Final filtered rows:', rows.length);
        console.log('Sample filtered data:', rows.slice(0, 3));
        
        setDados(rows);
        setDadosFiltrados(rows);
        
        // Extrair estados únicos para filtro
        const estadosUnicos = [...new Set(rows.map(item => item.estado))]
          .filter(estado => estado)
          .sort();
        setEstados(estadosUnicos);
        
      } catch (err) {
        console.error('Erro ao carregar planilha:', err);
        setErro('Não foi possível carregar os dados. Tente novamente mais tarde.');
      } finally {
        setCarregando(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, dados]);

  const aplicarFiltros = () => {
    let resultados = dados;

    if (filtros.municipio) {
      resultados = resultados.filter(item =>
        item.municipio.toLowerCase().includes(filtros.municipio.toLowerCase())
      );
    }

    if (filtros.estado) {
      resultados = resultados.filter(item => item.estado === filtros.estado);
    }

    if (filtros.valorMin) {
      resultados = resultados.filter(item => {
        const valor = parseFloat(String(item.valor).replace(/[^0-9.,]/g, '').replace(',', '.'));
        return valor >= parseFloat(filtros.valorMin);
      });
    }

    if (filtros.valorMax) {
      resultados = resultados.filter(item => {
        const valor = parseFloat(String(item.valor).replace(/[^0-9.,]/g, '').replace(',', '.'));
        return valor <= parseFloat(filtros.valorMax);
      });
    }

    setDadosFiltrados(resultados);
    setPaginaAtual(1);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limparFiltros = () => {
    setFiltros({
      municipio: '',
      estado: '',
      valorMin: '',
      valorMax: ''
    });
  };

  const exportarCSV = () => {
    const headers = ['Município', 'Protocolo', 'Prefeito', 'Estado', 'Descrição', 'Valor'];
    const csvContent = [
      headers.join(','),
      ...dadosFiltrados.map(item => [
        `"${item.municipio}"`,
        `"${item.protocolo}"`,
        `"${item.prefeito}"`,
        `"${item.estado}"`,
        `"${item.descricao}"`,
        `"${item.valor}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'estradas-rurais.csv';
    link.click();
  };

  // Cálculos da paginação
  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const itensPaginaAtual = dadosFiltrados.slice(indiceInicio, indiceFim);

  const formatarValor = (valor) => {
    if (!valor) return 'N/A';
    const valorStr = String(valor);
    // Se já está formatado como moeda, retorna como está
    if (valorStr.includes('R$')) return valorStr;
    
    // Tenta converter para número e formatar
    const numero = parseFloat(valorStr.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (isNaN(numero)) return valorStr;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numero);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados das estradas rurais...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Erro ao carregar dados</p>
            <p>{erro}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                🛣️ Estradas Rurais
              </h1>
              <p className="text-gray-600 mt-1">Consulta de registros municipais</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportarCSV}
                disabled={dadosFiltrados.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                📥 Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Município
              </label>
              <input
                type="text"
                placeholder="Buscar por município..."
                value={filtros.municipio}
                onChange={(e) => handleFiltroChange('municipio', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os estados</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Mínimo (R$)
              </label>
              <input
                type="number"
                placeholder="0,00"
                value={filtros.valorMin}
                onChange={(e) => handleFiltroChange('valorMin', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Máximo (R$)
              </label>
              <input
                type="number"
                placeholder="999999,00"
                value={filtros.valorMax}
                onChange={(e) => handleFiltroChange('valorMax', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={limparFiltros}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              🗑️ Limpar todos os filtros
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Resultados ({dadosFiltrados.length} registros)
              </h2>
            </div>
          </div>

          {dadosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-lg font-medium mb-2">Nenhum registro encontrado</p>
              <p>Tente ajustar os filtros para encontrar os dados desejados.</p>
            </div>
          ) : (
            <>
              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Município
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Protocolo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prefeito
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {itensPaginaAtual.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.municipio}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.protocolo}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.prefeito}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.estado}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate" title={item.descricao}>
                          {item.descricao}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatarValor(item.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Mostrando {indiceInicio + 1} até {Math.min(indiceFim, dadosFiltrados.length)} de {dadosFiltrados.length} resultados
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                        disabled={paginaAtual === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Anterior
                      </button>
                      
                      <span className="px-3 py-1 text-sm">
                        Página {paginaAtual} de {totalPaginas}
                      </span>
                      
                      <button
                        onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                        disabled={paginaAtual === totalPaginas}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstradasRurais;