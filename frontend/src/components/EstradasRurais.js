import React, { useEffect, useMemo, useRef, useState } from "react";

const SHEET_ID = process.env.REACT_APP_SHEET_ID || "1jaHnRgqRyMLjZVvaRSkG2kOyZ4kMEBgsPhwYIGVj490";
const API_KEY = process.env.REACT_APP_SHEETS_API_KEY || "AIzaSyBdd6E9Dz5W68XdhLCsLIlErt1ylwTt5Jk";

export default function EstradasRurais() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
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
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A:F?key=${API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro na requisição: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (!data.values) {
        setDados([]);
        setErro("Planilha retornou sem valores (data.values está vazio). Verifique permissões e intervalo A:F");
        return;
      }
      const rows = data.values.slice(1)
        .filter((c) => {
          // Filtrar linhas vazias e a linha do "VALOR TOTAL" 
          const municipio = (c[0] || "").toString().trim();
          return municipio !== "" && 
                 !municipio.toUpperCase().includes("VALOR TOTAL") &&
                 !municipio.toUpperCase().includes("ULTIMA ATUALIZAÇÃO");
        })
        .map((c) => ({
          municipio: (c[0] || "").toString(),
          protocolo: (c[1] || "").toString(),
          prefeito: (c[2] || "").toString(),
          estado: (c[3] || "").toString(),
          descricao: (c[4] || "").toString(),
          valor: formatCurrency((c[5] || "").toString()),
          _valorNum: parseCurrencyToNumber(c[5] || ""),
        }));
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
    let out = dados.filter((d) => {
      if (lowerBusca && !d.municipio.toLowerCase().includes(lowerBusca)) return false;
      if (estadoFiltro !== "Todos" && d.estado.trim() !== estadoFiltro) return false;
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
  }, [dados, busca, estadoFiltro, minValor, maxValor, sortBy, sortDir]);

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">🛣️ Estradas Rurais — Painel</h1>
          <div className="flex gap-2 items-center">
            <button onClick={() => fetchData()} className="px-3 py-2 rounded-lg bg-blue-600 text-white shadow">Atualizar</button>
            <button onClick={exportCSV} className="px-3 py-2 rounded-lg bg-green-600 text-white shadow">Exportar CSV</button>
          </div>
        </header>

        <section className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={busca} onChange={(e) => { setBusca(e.target.value); setPage(1); }} placeholder="Pesquisar por município..." className="p-2 border rounded" />
            <select value={estadoFiltro} onChange={(e) => { setEstadoFiltro(e.target.value); setPage(1); }} className="p-2 border rounded">
              {estadosDisponiveis.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-2">
              <input value={minValor} onChange={(e) => { setMinValor(e.target.value); setPage(1); }} placeholder="Valor mínimo" className="p-2 border rounded w-full" />
              <input value={maxValor} onChange={(e) => { setMaxValor(e.target.value); setPage(1); }} placeholder="Valor máximo" className="p-2 border rounded w-full" />
            </div>
          </div>

          <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-600">Registros: <strong>{total}</strong> — Somatório (filtro): <strong>{formatNumber(sumFilteredValues)}</strong></div>

            <div className="flex gap-2 items-center">
              <label className="text-sm">Auto refresh</label>
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              <input type="number" min={5} value={refreshIntervalSeconds} onChange={(e) => setRefreshIntervalSeconds(Number(e.target.value))} className="p-1 w-20 border rounded" />
              <span className="text-sm text-gray-500">segundos</span>
              <button onClick={clearFilters} className="px-2 py-1 bg-gray-200 rounded">Limpar filtros</button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow overflow-x-auto">
          {carregando ? (
            <div className="p-6 text-center text-gray-600">Carregando dados...</div>
          ) : erro ? (
            <div className="p-6 text-center text-red-600">Erro: {erro}</div>
          ) : (
            <table className="w-full table-auto">
              <thead className="bg-gray-100 text-sm text-gray-700">
                <tr>
                  <th className="p-3 text-left cursor-pointer" onClick={() => toggleSort("municipio")}>Município {sortBy === "municipio" ? (sortDir === "asc" ? "▲" : "▼") : ""}</th>
                  <th className="p-3 text-left">Protocolo</th>
                  <th className="p-3 text-left">Prefeito</th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => toggleSort("estado")}>Estado {sortBy === "estado" ? (sortDir === "asc" ? "▲" : "▼") : ""}</th>
                  <th className="p-3 text-left">Descrição</th>
                  <th className="p-3 text-right cursor-pointer" onClick={() => toggleSort("valor")}>Valor {sortBy === "valor" ? (sortDir === "asc" ? "▲" : "▼") : ""}</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((r, i) => (
                  <tr key={`${r.municipio}-${r.protocolo}-${i}`} className="border-t hover:bg-gray-50">
                    <td className="p-3">{r.municipio}</td>
                    <td className="p-3">{r.protocolo}</td>
                    <td className="p-3">{r.prefeito}</td>
                    <td className="p-3">{r.estado}</td>
                    <td className="p-3">{r.descricao}</td>
                    <td className="p-3 text-right">{r.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="mt-4 flex items-center justify-between">
          <div>
            <label>Linhas por página: </label>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="p-1 border rounded">
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 border rounded">&laquo;</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 border rounded">&lsaquo;</button>
            <span>Página {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 border rounded">&rsaquo;</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 border rounded">&raquo;</button>
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