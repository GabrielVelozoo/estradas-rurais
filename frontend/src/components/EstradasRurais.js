import React, { useEffect, useMemo, useRef, useState } from "react";

const SHEET_ID = process.env.REACT_APP_SHEET_ID || "1jaHnRgqRyMLjZVvaRSkG2kOyZ4kMEBgsPhwYIGVj490";
const API_KEY = process.env.REACT_APP_SHEETS_API_KEY || "AIzaSyBdd6E9Dz5W68XdhLCsLIlErt1ylwTt5Jk";

// Componente para linha da tabela com descrição expansível
const TabelaLinha = ({ r, i }) => {
  const [expandedDescricao, setExpandedDescricao] = useState(false);

  const toggleDescricao = () => {
    setExpandedDescricao(!expandedDescricao);
  };

  const shouldTruncate = r.descricao && r.descricao.length > 150;
  
  return (
    <tr className="hover:bg-blue-50 transition-colors border-b border-gray-100">
      <td className="px-4 py-3 align-top">
        <div className="font-semibold text-gray-900 text-sm break-words">
          {r.municipio}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="text-gray-700 font-mono text-xs break-all">
          {r.protocolo}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="text-gray-700 text-sm break-words">
          {r.prefeito}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="space-y-2">
          {r.nomeEstrada && (
            <div className="font-medium text-gray-900 text-sm">
              🛣️ {r.nomeEstrada}
            </div>
          )}
          {shouldTruncate ? (
            <div>
              <div className="text-gray-600 text-sm">
                {expandedDescricao ? r.descricao : `${r.descricao.substring(0, 150)}...`}
              </div>
              <button
                onClick={toggleDescricao}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1 inline-flex items-center gap-1"
              >
                {expandedDescricao ? "🔼 Menos" : "🔽 Mais"}
              </button>
            </div>
          ) : (
            <div className="text-gray-600 text-sm">{r.descricao}</div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right align-top">
        <div className="font-bold text-green-600 text-sm whitespace-nowrap">
          {r.valor}
        </div>
      </td>
    </tr>
  );
};

export default function EstradasRurais() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [buscaEstrada, setBuscaEstrada] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [minValor, setMinValor] = useState("");
  const [maxValor, setMaxValor] = useState("");
  const [sortBy, setSortBy] = useState("municipio");
  const [sortDir, setSortDir] = useState("asc");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState(60);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    setCarregando(true);
    setErro(null);
    try {
      // Usar backend como proxy para evitar problemas de CORS
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${BACKEND_URL}/api/estradas-rurais`);
      if (!res.ok) throw new Error(`Erro na requisição: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (!data.values) {
        setDados([]);
        setErro("Planilha retornou sem valores (data.values está vazio). Verifique permissões e intervalo A:F");
        return;
      }
      const rows = data.values.slice(1)
        .filter((c) => {
          // Incluir linha se tem protocolo ou descrição (mesmo sem município)
          const municipio = (c[0] || "").toString().trim();
          const protocolo = (c[1] || "").toString().trim();
          const descricao = (c[4] || "").toString().trim();
          const valor = (c[5] || "").toString().trim();
          
          // Filtrar apenas linhas de controle específicas
          if (municipio.toUpperCase() === "VALOR TOTAL" || 
              municipio.toUpperCase() === "MUNICÍPIO" ||
              municipio.toUpperCase().includes("ULTIMA ATUALIZAÇÃO")) {
            return false;
          }
          
          // Incluir se tem dados significativos
          return protocolo !== "" || descricao !== "" || valor !== "";
        })
        .map((c) => {
          // Ajustar mapeamento baseado na estrutura real dos dados
          let municipio = (c[0] || "").toString().trim();
          let protocolo = (c[1] || "").toString().trim();
          let prefeito = (c[2] || "").toString().trim();
          let descricaoCompleta = (c[3] || "").toString().trim();
          let nomeEstrada = (c[4] || "").toString().trim();
          let valor = (c[5] || "").toString().trim();
          
          // Extrair estado da descrição se necessário
          let estado = "";
          if (descricaoCompleta.includes("PARANÁ") || descricaoCompleta.includes("PR")) {
            estado = "PR";
          } else if (descricaoCompleta.includes("SÃO PAULO") || descricaoCompleta.includes("SP")) {
            estado = "SP";
          } else if (descricaoCompleta.includes("MINAS GERAIS") || descricaoCompleta.includes("MG")) {
            estado = "MG";
          }
          // Se não conseguir extrair, deixar vazio
          
          return {
            municipio: municipio || "Não informado",
            protocolo: protocolo,
            prefeito: prefeito,
            estado: estado,
            descricao: descricaoCompleta,
            nomeEstrada: nomeEstrada,
            valor: formatCurrency(valor),
            _valorNum: parseCurrencyToNumber(valor),
          };
        });
      setDados(rows);
    } catch (e) {
      console.error(e);
      setErro(e.message || String(e));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => fetchData(), Math.max(5, refreshIntervalSeconds) * 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshIntervalSeconds]);

  function parseCurrencyToNumber(value) {
    if (!value && value !== 0) return 0;
    const s = value.toString().trim();
    if (s === "") return 0;
    const only = s.replace(/[^0-9.,-]/g, "");
    if (only.indexOf(".") > -1 && only.indexOf(",") > -1) {
      const cleaned = only.replace(/\./g, "").replace(/,/g, ".");
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    }
    if (only.indexOf(",") > -1) {
      const cleaned = only.replace(/,/g, ".");
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    }
    const n = parseFloat(only);
    return isNaN(n) ? 0 : n;
  }

  function formatCurrency(value) {
    if (!value) return "R$ 0,00";
    const num = parseCurrencyToNumber(value);
    if (num === 0) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  }

  const estadosDisponiveis = useMemo(() => {
    const s = new Set(dados.map((d) => (d.estado || "").trim()).filter((x) => x !== ""));
    return ["Todos", ...Array.from(s).sort()];
  }, [dados]);

  const filtrados = useMemo(() => {
    const lowerBusca = busca.trim().toLowerCase();
    const lowerBuscaEstrada = buscaEstrada.trim().toLowerCase();
    let out = dados.filter((d) => {
      if (lowerBusca && !d.municipio.toLowerCase().includes(lowerBusca)) return false;
      if (lowerBuscaEstrada) {
        const buscaEstradaMatch = (d.nomeEstrada && d.nomeEstrada.toLowerCase().includes(lowerBuscaEstrada)) ||
                                  (d.descricao && d.descricao.toLowerCase().includes(lowerBuscaEstrada));
        if (!buscaEstradaMatch) return false;
      }
      if (estadoFiltro !== "Todos" && d.estado !== estadoFiltro) return false;
      const minN = parseFloat(String(minValor).replace(/[^0-9.-]/g, ""));
      const maxN = parseFloat(String(maxValor).replace(/[^0-9.-]/g, ""));
      if (!isNaN(minN) && d._valorNum < minN) return false;
      if (!isNaN(maxN) && d._valorNum > maxN) return false;
      return true;
    });
    out.sort((a, b) => {
      let va = a[sortBy];
      let vb = b[sortBy];
      if (sortBy === "valor") {
        va = a._valorNum;
        vb = b._valorNum;
      } else {
        va = (va || "").toString().toLowerCase();
        vb = (vb || "").toString().toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [dados, busca, buscaEstrada, estadoFiltro, minValor, maxValor, sortBy, sortDir]);

  const total = filtrados.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, page, pageSize]);

  const exportCSV = () => {
    const headers = ["Município", "Protocolo", "Prefeito", "Estado", "Descrição", "Valor"];
    const rows = filtrados.map((r) => [r.municipio, r.protocolo, r.prefeito, r.estado, r.descricao, r.valor]);
    const csvContent = [headers, ...rows].map((e) => e.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "estradas_rurais_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setBusca("");
    setBuscaEstrada("");
    setEstadoFiltro("Todos");
    setMinValor("");
    setMaxValor("");
  };

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((s) => (s === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const sumFilteredValues = useMemo(() => filtrados.reduce((acc, r) => acc + (r._valorNum || 0), 0), [filtrados]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Principal */}
        <header className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-blue-600">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                🛣️ Estradas Rurais
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Painel de Investimentos Municipais</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => fetchData()} 
                className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                🔄 Atualizar
              </button>
              <button 
                onClick={exportCSV} 
                className="px-4 py-2 rounded-lg bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                📥 Exportar CSV
              </button>
            </div>
          </div>
        </header>

        {/* Estatísticas Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Registros</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estados Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{estadosDisponiveis.length - 1}</p>
              </div>
              <div className="text-3xl">🗺️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-xl font-bold text-green-600">{formatNumber(sumFilteredValues)}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🔍 Filtros de Busca
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏛️ Município
              </label>
              <input 
                value={busca} 
                onChange={(e) => { setBusca(e.target.value); setPage(1); }} 
                placeholder="Digite o nome do município..." 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🛣️ Nome da Estrada
              </label>
              <input 
                value={buscaEstrada} 
                onChange={(e) => { setBuscaEstrada(e.target.value); setPage(1); }} 
                placeholder="Digite o nome da estrada..." 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🗺️ Estado
              </label>
              <select 
                value={estadoFiltro} 
                onChange={(e) => { setEstadoFiltro(e.target.value); setPage(1); }} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {estadosDisponiveis.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Valor Mínimo
              </label>
              <input 
                value={minValor} 
                onChange={(e) => { setMinValor(e.target.value); setPage(1); }} 
                placeholder="Ex: 1000000" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Valor Máximo
              </label>
              <input 
                value={maxValor} 
                onChange={(e) => { setMaxValor(e.target.value); setPage(1); }} 
                placeholder="Ex: 50000000" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input 
                  type="checkbox" 
                  checked={autoRefresh} 
                  onChange={(e) => setAutoRefresh(e.target.checked)} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                />
                Auto-refresh
              </label>
              <input 
                type="number" 
                min={5} 
                value={refreshIntervalSeconds} 
                onChange={(e) => setRefreshIntervalSeconds(Number(e.target.value))} 
                className="p-2 w-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
              />
              <span className="text-sm text-gray-500">segundos</span>
            </div>

            <button 
              onClick={clearFilters} 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              🗑️ Limpar Filtros
            </button>
          </div>
        </section>

        {/* Tabela de Dados */}
        <section className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📋 Dados das Estradas Rurais
            </h2>
          </div>

          {carregando ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Carregando dados...</p>
            </div>
          ) : erro ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-600 text-lg font-medium">Erro: {erro}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <colgroup>
                  <col style={{width: '200px'}} />  {/* Município */}
                  <col style={{width: '120px'}} />  {/* Protocolo */}
                  <col style={{width: '150px'}} />  {/* Prefeito */}
                  <col style={{minWidth: '350px'}} /> {/* Descrição */}
                  <col style={{width: '140px'}} />  {/* Valor */}
                </colgroup>
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-bold text-gray-700 cursor-pointer hover:bg-blue-200 transition-colors" 
                      onClick={() => toggleSort("municipio")}
                    >
                      <div className="flex items-center gap-1">
                        🏛️ Município 
                        {sortBy === "municipio" && (
                          <span className="text-blue-600">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">
                      📄 Protocolo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">
                      👤 Prefeito
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">
                      📝 Estrada & Descrição
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-bold text-gray-700 cursor-pointer hover:bg-blue-200 transition-colors" 
                      onClick={() => toggleSort("valor")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        💰 Valor
                        {sortBy === "valor" && (
                          <span className="text-blue-600">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageData.map((r, i) => (
                    <TabelaLinha 
                      key={`${r.municipio}-${r.protocolo}-${i}`} 
                      r={r} 
                      i={i} 
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Paginação */}
        <footer className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Itens por página:</label>
              <select 
                value={pageSize} 
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} 
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm text-gray-600">
                Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, total)} de {total} registros
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(1)} 
                disabled={page === 1} 
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                &laquo; Primeiro
              </button>
              <button 
                onClick={() => setPage((p) => Math.max(1, p - 1))} 
                disabled={page === 1} 
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                &lsaquo; Anterior
              </button>
              
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                Página {page} de {totalPages}
              </span>
              
              <button 
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages} 
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Próxima &rsaquo;
              </button>
              <button 
                onClick={() => setPage(totalPages)} 
                disabled={page === totalPages} 
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Último &raquo;
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function formatNumber(n) {
  if (typeof n !== "number") return "0";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}