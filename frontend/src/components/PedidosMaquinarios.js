import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

// Lista de municípios do Paraná (399 municípios)
const MUNICIPIOS_PR = [
  "Abatiá", "Adrianópolis", "Agudos do Sul", "Almirante Tamandaré", "Altamira do Paraná", "Altônia", "Alto Paraíso", "Alto Piquiri", 
  "Amaporã", "Ampère", "Anahy", "Andirá", "Ângulo", "Antonina", "Antônio Olinto", "Apucarana", "Arapongas", "Arapoti", "Arapuã", 
  "Araruna", "Araucária", "Ariranha do Ivaí", "Assaí", "Assis Chateaubriand", "Astorga", "Atalaia", "Balsa Nova", "Bandeirantes", 
  "Barbosa Ferraz", "Barra do Jacaré", "Barracão", "Bela Vista da Caroba", "Bela Vista do Paraíso", "Bituruna", "Boa Esperança", 
  "Boa Esperança do Iguaçu", "Boa Ventura de São Roque", "Boa Vista da Aparecida", "Bocaiúva do Sul", "Bom Jesus do Sul", 
  "Bom Sucesso", "Bom Sucesso do Sul", "Borrazópolis", "Braganey", "Brasilândia do Sul", "Cafeara", "Cafelândia", "Cafezal do Sul", 
  "Califórnia", "Cambará", "Cambé", "Cambira", "Campina da Lagoa", "Campina do Simão", "Campina Grande do Sul", "Campo Bonito", 
  "Campo do Tenente", "Campo Largo", "Campo Magro", "Campo Mourão", "Cândido de Abreu", "Candói", "Cantagalo", "Capanema", 
  "Capitão Leônidas Marques", "Carambeí", "Carlópolis", "Cascavel", "Castro", "Catanduvas", "Centenário do Sul", "Cerro Azul", 
  "Céu Azul", "Chopinzinho", "Cianorte", "Cidade Gaúcha", "Clevelândia", "Colombo", "Colorado", "Congonhinhas", "Conselheiro Mairinck", 
  "Contenda", "Corbélia", "Cornélio Procópio", "Coronel Domingos Soares", "Coronel Vivida", "Corumbataí do Sul", "Cruz Machado", 
  "Cruzeiro do Iguaçu", "Cruzeiro do Oeste", "Cruzeiro do Sul", "Cruzmaltina", "Curitiba", "Curiúva", "Diamante do Norte", 
  "Diamante do Sul", "Diamante D'Oeste", "Dois Vizinhos", "Douradina", "Doutor Camargo", "Enéas Marques", "Engenheiro Beltrão", 
  "Esperança Nova", "Entre Rios do Oeste", "Espigão Alto do Iguaçu", "Farol", "Faxinal", "Fazenda Rio Grande", "Fênix", 
  "Fernandes Pinheiro", "Figueira", "Floraí", "Flor da Serra do Sul", "Floresta", "Florestópolis", "Flórida", "Formosa do Oeste", 
  "Foz do Iguaçu", "Foz do Jordão", "Francisco Alves", "Francisco Beltrão", "General Carneiro", "Godoy Moreira", "Goioerê", 
  "Goioxim", "Grandes Rios", "Guaíra", "Guairaçá", "Guamiranga", "Guaraci", "Guaraniaçu", "Guarapuava", "Guaraqueçaba", 
  "Guaratuba", "Honório Serpa", "Ibaiti", "Ibema", "Ibiporã", "Icém", "Iguaraçu", "Iguatu", "Imbaú", "Imbituva", "Inácio Martins", 
  "Inajá", "Indianópolis", "Ipiranga", "Iporã", "Iracema do Oeste", "Irati", "Iretama", "Itaguajé", "Itaipulândia", "Itambaracá", 
  "Itambé", "Itapejara d'Oeste", "Itaperuçu", "Itaúna do Sul", "Ivaí", "Ivaiporã", "Ivaté", "Ivatuba", "Jaboti", "Jacarezinho", 
  "Jaguapitã", "Jaguariaíva", "Jandaia do Sul", "Janiópolis", "Japira", "Japurá", "Jardim Alegre", "Jardim Olinda", "Jataizinho", 
  "Jesuítas", "Joaquim Távora", "Jundiaí do Sul", "Juranda", "Jussara", "Kaloré", "Lapa", "Laranjal", "Laranjeiras do Sul", 
  "Leópolis", "Lidianópolis", "Lindoeste", "Loanda", "Lobato", "Londrina", "Luiziana", "Lunardelli", "Lupionópolis", "Mallet", 
  "Mamborê", "Mandaguaçu", "Mandaguari", "Mandirituba", "Manfrinópolis", "Mangueirinha", "Manoel Ribas", "Marechal Cândido Rondon", 
  "Maria Helena", "Marialva", "Marilândia do Sul", "Marilena", "Mariluz", "Maringá", "Mariópolis", "Maripá", "Marmeleiro", 
  "Marquinho", "Marumbi", "Matelândia", "Matinhos", "Mato Rico", "Mauá da Serra", "Medianeira", "Mercedes", "Mirador", 
  "Miraselva", "Missal", "Moreira Sales", "Morretes", "Munhoz de Melo", "Nossa Senhora das Graças", "Nova Aliança do Ivaí", 
  "Nova América da Colina", "Nova Aurora", "Nova Cantu", "Nova Esperança", "Nova Esperança do Sudoeste", "Nova Fátima", 
  "Nova Laranjeiras", "Nova Londrina", "Nova Olímpia", "Nova Prata do Iguaçu", "Nova Santa Bárbara", "Nova Santa Rosa", 
  "Nova Tebas", "Novo Itacolomi", "Ortigueira", "Ourizona", "Ouro Verde do Oeste", "Paiçandu", "Palmas", "Palmeira", 
  "Palmital", "Palotina", "Paraíso do Norte", "Paranacity", "Paranaguá", "Paranapoema", "Paranavaí", "Pato Bragado", 
  "Pato Branco", "Paula Freitas", "Paulo Frontin", "Peabiru", "Perobal", "Pérola", "Pérola d'Oeste", "Piên", "Pinhais", 
  "Pinhal de São Bento", "Pinhalão", "Pinhão", "Piraí do Sul", "Piraquara", "Pitanga", "Pitangueiras", "Planaltina do Paraná", 
  "Planalto", "Ponta Grossa", "Pontal do Paraná", "Porecatu", "Porto Amazonas", "Porto Barreiro", "Porto Rico", "Porto Vitória", 
  "Prado Ferreira", "Pranchita", "Presidente Castelo Branco", "Primeiro de Maio", "Prudentópolis", "Quarto Centenário", 
  "Quatiguá", "Quatro Barras", "Quatro Pontes", "Quedas do Iguaçu", "Querência do Norte", "Quinta do Sol", "Quitandinha", 
  "Ramilândia", "Rancho Alegre", "Rancho Alegre d'Oeste", "Realeza", "Rebouças", "Renascença", "Reserva", "Reserva do Iguaçu", 
  "Ribeirão Claro", "Ribeirão do Pinhal", "Rio Azul", "Rio Bom", "Rio Bonito do Iguaçu", "Rio Branco do Ivaí", "Rio Branco do Sul", 
  "Rio Negro", "Rolândia", "Roncador", "Rondon", "Rosário do Ivaí", "Sabáudia", "Salgado Filho", "Salto do Itararé", 
  "Salto do Lontra", "Santa Amélia", "Santa Cecília do Pavão", "Santa Cruz de Monte Castelo", "Santa Fé", "Santa Helena", 
  "Santa Inês", "Santa Isabel do Ivaí", "Santa Izabel do Oeste", "Santa Lúcia", "Santa Maria do Oeste", "Santa Mariana", 
  "Santa Mônica", "Santa Tereza do Oeste", "Santa Terezinha de Itaipu", "Santana do Itararé", "Santo Antônio da Platina", 
  "Santo Antônio do Caiuá", "Santo Antônio do Paraíso", "Santo Antônio do Sudoeste", "Santo Inácio", "São Carlos do Ivaí", 
  "São Jerônimo da Serra", "São João", "São João do Caiuá", "São João do Ivaí", "São João do Triunfo", "São Jorge d'Oeste", 
  "São Jorge do Ivaí", "São Jorge do Patrocínio", "São José da Boa Vista", "São José das Palmeiras", "São José dos Pinhais", 
  "São Manoel do Paraná", "São Mateus do Sul", "São Miguel do Iguaçu", "São Pedro do Iguaçu", "São Pedro do Ivaí", 
  "São Pedro do Paraná", "São Sebastião da Amoreira", "São Tomé", "Sapopema", "Sarandi", "Sengés", "Serranópolis do Iguaçu", 
  "Sertaneja", "Sertanópolis", "Siqueira Campos", "Sulina", "Tamarana", "Tamboara", "Tapejara", "Tapira", "Teixeira Soares", 
  "Telêmaco Borba", "Terra Boa", "Terra Rica", "Terra Roxa", "Tibagi", "Tijucas do Sul", "Toledo", "Tomazina", "Três Barras do Paraná", 
  "Tunas do Paraná", "Tuneiras do Oeste", "Tupãssi", "Turvo", "Ubiratã", "Umuarama", "União da Vitória", "Uniflor", "Uraí", 
  "Wenceslau Braz", "Xambrê"
];

// Lista de equipamentos com valores
const EQUIPAMENTOS = [
  { nome: "Trator de Esteiras", valor: 1222500.00 },
  { nome: "Motoniveladora", valor: 1217352.22 },
  { nome: "Caminhão Caçamba 6x4", valor: 905300.00 },
  { nome: "Caminhão Prancha", valor: 900000.00 },
  { nome: "Escavadeira", valor: 830665.00 },
  { nome: "Pá Carregadeira", valor: 778250.00 },
  { nome: "Rolocompactador", valor: 716180.91 },
  { nome: "Retroescavadeira", valor: 484111.11 },
  { nome: "Bob Cat", valor: 430000.00 },
  { nome: "Trator 100–110CV", valor: 410000.00 }
];

const PedidosMaquinarios = () => {
  // Nova estrutura: organizados por município
  const [municipios, setMunicipios] = useState({}); // { [municipio]: { lideranca, pedidos: [] } }
  const [municipioAtual, setMunicipioAtual] = useState('');
  const [liderancaAtual, setLiderancaAtual] = useState('');
  const [busca, setBusca] = useState('');
  const [buscaGlobal, setBuscaGlobal] = useState('');
  
  // Estados para UI melhorada do seletor
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [novoEquipamento, setNovoEquipamento] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [editandoPedido, setEditandoPedido] = useState(null);

  // Refs para controle do dropdown
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const liderancaRef = useRef(null);

  // Calcular valor total geral (todos os municípios)
  const valorTotalGeral = Object.values(municipios).reduce((total, municipio) => {
    return total + municipio.pedidos.reduce((subtotal, pedido) => {
      const equipamento = EQUIPAMENTOS.find(eq => eq.nome === pedido.equipamento);
      return subtotal + (equipamento ? equipamento.valor * pedido.quantidade : 0);
    }, 0);
  }, 0);

  // Calcular estatísticas gerais
  const totalPedidos = Object.values(municipios).reduce((total, municipio) => 
    total + municipio.pedidos.length, 0);
  
  const totalEquipamentos = Object.values(municipios).reduce((total, municipio) => 
    total + municipio.pedidos.reduce((subtotal, pedido) => subtotal + pedido.quantidade, 0), 0);

  const municipiosComPedidos = Object.keys(municipios).filter(municipio => 
    municipios[municipio].pedidos.length > 0).length;

  // Função para normalizar texto (remover acentos)
  const normalize = (str) => {
    return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  };

  // Função para verificar se um item contém a busca (acento-insensível)
  const matches = (item, query) => {
    if (!query) return true;
    return normalize(item).includes(normalize(query));
  };

  // Filtrar municípios com busca acento-insensível
  const municipiosFiltrados = MUNICIPIOS_PR
    .filter(municipio => matches(municipio, busca))
    .sort((a, b) => normalize(a).localeCompare(normalize(b)));

  // Selecionar município
  const selecionarMunicipio = (municipio) => {
    setMunicipioAtual(municipio);
    setShowDropdown(false);
    setBusca('');
    setFocusedIndex(-1);
    
    // Carregar dados do município se já existe
    if (municipios[municipio]) {
      setLiderancaAtual(municipios[municipio].lideranca);
    } else {
      setLiderancaAtual('');
    }

    // Focar no próximo campo (Liderança)
    setTimeout(() => {
      if (liderancaRef.current) {
        liderancaRef.current.focus();
      }
    }, 100);
  };

  // Função para fechar o dropdown
  const closeDropdown = () => {
    setShowDropdown(false);
    setFocusedIndex(-1);
  };

  // Click outside listener
  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      closeDropdown();
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        inputRef.current?.blur();
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < municipiosFiltrados.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < municipiosFiltrados.length) {
          selecionarMunicipio(municipiosFiltrados[focusedIndex]);
        }
        break;
    }
  };

  // Effect para adicionar/remover event listeners
  useEffect(() => {
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown, handleClickOutside, focusedIndex, municipiosFiltrados]);

  // Salvar informações do município atual
  const salvarMunicipio = () => {
    if (municipioAtual && liderancaAtual) {
      setMunicipios(prev => ({
        ...prev,
        [municipioAtual]: {
          lideranca: liderancaAtual,
          pedidos: prev[municipioAtual]?.pedidos || []
        }
      }));
    }
  };

  // Adicionar pedido ao município atual
  const adicionarPedido = () => {
    if (municipioAtual && liderancaAtual && novoEquipamento && quantidade > 0) {
      const novoPedido = {
        id: Date.now(),
        equipamento: novoEquipamento,
        quantidade: parseInt(quantidade),
        observacoes: observacoes || ''
      };

      setMunicipios(prev => ({
        ...prev,
        [municipioAtual]: {
          lideranca: liderancaAtual,
          pedidos: [...(prev[municipioAtual]?.pedidos || []), novoPedido]
        }
      }));

      setNovoEquipamento('');
      setQuantidade(1);
      setObservacoes('');
    }
  };

  // Remover pedido de um município
  const removerPedido = (municipio, pedidoId) => {
    setMunicipios(prev => ({
      ...prev,
      [municipio]: {
        ...prev[municipio],
        pedidos: prev[municipio].pedidos.filter(pedido => pedido.id !== pedidoId)
      }
    }));
  };

  // Editar quantidade de um pedido
  const editarQuantidade = (municipio, pedidoId, novaQuantidade) => {
    if (novaQuantidade > 0) {
      setMunicipios(prev => ({
        ...prev,
        [municipio]: {
          ...prev[municipio],
          pedidos: prev[municipio].pedidos.map(pedido => 
            pedido.id === pedidoId ? { ...pedido, quantidade: parseInt(novaQuantidade) } : pedido
          )
        }
      }));
    }
  };

  // Calcular subtotal de um município
  const calcularSubtotalMunicipio = (municipio) => {
    if (!municipios[municipio]) return 0;
    return municipios[municipio].pedidos.reduce((subtotal, pedido) => {
      const equipamento = EQUIPAMENTOS.find(eq => eq.nome === pedido.equipamento);
      return subtotal + (equipamento ? equipamento.valor * pedido.quantidade : 0);
    }, 0);
  };

  // Formatação de moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Exportar todos os dados
  const exportarDados = () => {
    const dados = {
      municipios: municipios,
      resumo: {
        totalMunicipios: municipiosComPedidos,
        totalPedidos: totalPedidos,
        totalEquipamentos: totalEquipamentos,
        valorTotalGeral: valorTotalGeral
      },
      geradoEm: new Date().toLocaleString('pt-BR')
    };
    
    console.log('Dados completos para exportação:', dados);
    
    // Criar resumo para exibição
    let resumoExportacao = `📊 RELATÓRIO DE PEDIDOS DE MAQUINÁRIOS\n\n`;
    resumoExportacao += `🏙️ Municípios com pedidos: ${municipiosComPedidos}\n`;
    resumoExportacao += `📋 Total de pedidos: ${totalPedidos}\n`;
    resumoExportacao += `🚜 Total de equipamentos: ${totalEquipamentos}\n`;
    resumoExportacao += `💰 Valor total geral: ${formatCurrency(valorTotalGeral)}\n\n`;
    
    Object.keys(municipios).forEach(municipio => {
      if (municipios[municipio].pedidos.length > 0) {
        resumoExportacao += `${municipio} - ${municipios[municipio].lideranca}\n`;
        resumoExportacao += `Subtotal: ${formatCurrency(calcularSubtotalMunicipio(municipio))}\n\n`;
      }
    });
    
    alert(resumoExportacao);
  };

  // Filtros de busca global
  const municipiosFiltradosGlobal = Object.keys(municipios).filter(municipio => {
    const busca = buscaGlobal.toLowerCase();
    const municipioMatch = municipio.toLowerCase().includes(busca);
    const liderancaMatch = municipios[municipio].lideranca.toLowerCase().includes(busca);
    const equipamentoMatch = municipios[municipio].pedidos.some(pedido => 
      pedido.equipamento.toLowerCase().includes(busca)
    );
    return municipioMatch || liderancaMatch || equipamentoMatch;
  });

  // Auto-salvar quando mudar município ou liderança
  useEffect(() => {
    if (municipioAtual && liderancaAtual) {
      salvarMunicipio();
    }
  }, [liderancaAtual]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header com Estatísticas Gerais */}
        <div className="bg-gradient-to-r from-slate-700 to-gray-800 rounded-xl shadow-xl p-6 mb-8 text-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                🚜 Pedidos de Maquinários
              </h1>
              <p className="text-gray-200 mt-2 text-lg">Sistema de Gestão de Equipamentos por Município</p>
            </div>
            
            {/* Estatísticas em Grade */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-2xl font-bold">{municipiosComPedidos}</div>
                <div className="text-xs text-gray-200">Municípios</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-2xl font-bold">{totalPedidos}</div>
                <div className="text-xs text-gray-200">Pedidos</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-2xl font-bold">{totalEquipamentos}</div>
                <div className="text-xs text-gray-200">Equipamentos</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 md:col-span-1 col-span-2">
                <div className="text-lg md:text-xl font-bold">{formatCurrency(valorTotalGeral)}</div>
                <div className="text-xs text-gray-200">Valor Total Geral</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Busca Global e Controles */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Busca Global (município, liderança ou equipamento)
            </label>
            <input
              type="text"
              value={buscaGlobal}
              onChange={(e) => setBuscaGlobal(e.target.value)}
              placeholder="Pesquisar em todos os registros..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4 flex items-end">
            <button
              onClick={exportarDados}
              disabled={municipiosComPedidos === 0}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              📄 Exportar Relatório Completo
            </button>
          </div>
        </div>

        {/* Seleção de Município e Liderança */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            ➕ Adicionar Pedidos por Município
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Seletor de Município Melhorado */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Município *
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={municipioAtual || busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    if (!showDropdown) setShowDropdown(true);
                    setFocusedIndex(-1);
                    if (!e.target.value) {
                      setMunicipioAtual('');
                      setLiderancaAtual('');
                    }
                  }}
                  onFocus={() => {
                    setShowDropdown(true);
                    setFocusedIndex(-1);
                  }}
                  onBlur={(e) => {
                    // Não fechar imediatamente se estiver clicando na lista
                    const relatedTarget = e.relatedTarget;
                    if (!dropdownRef.current?.contains(relatedTarget)) {
                      setTimeout(() => closeDropdown(), 150);
                    }
                  }}
                  placeholder={municipioAtual ? municipioAtual : "Clique para selecionar um município..."}
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  role="combobox"
                  aria-expanded={showDropdown}
                  aria-haspopup="listbox"
                  aria-controls="municipios-listbox"
                  aria-activedescendant={focusedIndex >= 0 ? `municipio-${focusedIndex}` : undefined}
                  autoComplete="off"
                />
                
                {/* Ícone de dropdown */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Dropdown List */}
                {showDropdown && (
                  <div 
                    id="municipios-listbox"
                    role="listbox"
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                  >
                    {municipiosFiltrados.length > 0 ? (
                      <>
                        {/* Header com contador */}
                        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 text-sm text-gray-600 font-medium">
                          {municipiosFiltrados.length} de {MUNICIPIOS_PR.length} municípios
                          {busca && ` • Busca: "${busca}"`}
                        </div>
                        
                        {/* Lista de municípios */}
                        {municipiosFiltrados.map((municipio, index) => {
                          const isSelected = municipio === municipioAtual;
                          const isFocused = index === focusedIndex;
                          
                          return (
                            <div
                              key={municipio}
                              id={`municipio-${index}`}
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => selecionarMunicipio(municipio)}
                              onMouseEnter={() => setFocusedIndex(index)}
                              className={`
                                relative px-3 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors
                                ${isFocused ? 'bg-blue-100 text-blue-900' : 'hover:bg-blue-50'}
                                ${isSelected ? 'bg-blue-500 text-white font-medium' : 'text-gray-900'}
                              `}
                            >
                              <div className="flex justify-between items-center">
                                <span>{municipio}</span>
                                {municipios[municipio] && (
                                  <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>
                                    {municipios[municipio].pedidos.length} pedido(s)
                                  </span>
                                )}
                              </div>
                              
                              {isSelected && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="px-3 py-4 text-center text-gray-500">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm">Nenhum município encontrado para "{busca}"</p>
                        <p className="text-xs text-gray-400 mt-1">Tente outro termo de busca</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Contador e dicas */}
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {MUNICIPIOS_PR.length} municípios disponíveis do Paraná
                </p>
                {showDropdown && (
                  <p className="text-xs text-gray-400">
                    Use ↑↓ para navegar, Enter para selecionar, Esc para fechar
                  </p>
                )}
              </div>
            </div>

            {/* Campo Liderança */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Liderança Responsável *
              </label>
              <input
                type="text"
                value={liderancaAtual}
                onChange={(e) => setLiderancaAtual(e.target.value)}
                placeholder="Nome da liderança ou responsável..."
                disabled={!municipioAtual}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Município Selecionado */}
          {municipioAtual && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">📍 Município Selecionado</h3>
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">{municipioAtual}</span>
                    {liderancaAtual && <span className="ml-2">• {liderancaAtual}</span>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMunicipioAtual('');
                    setLiderancaAtual('');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Limpar Seleção
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Formulário para Adicionar Equipamento */}
        {municipioAtual && liderancaAtual && (
          <section className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              🚜 Adicionar Equipamento para {municipioAtual}
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento</label>
                  <select
                    value={novoEquipamento}
                    onChange={(e) => setNovoEquipamento(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um equipamento...</option>
                    {EQUIPAMENTOS.map((eq) => (
                      <option key={eq.nome} value={eq.nome}>
                        {eq.nome} - {formatCurrency(eq.valor)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={adicionarPedido}
                    disabled={!novoEquipamento || !municipioAtual || !liderancaAtual}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações sobre este pedido..."
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>
        )}

        {/* Lista de Municípios com Pedidos */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
            🏙️ Municípios com Pedidos Registrados
          </h2>

          {Object.keys(municipios).length > 0 ? (
            <div className="space-y-6">
              {(buscaGlobal ? municipiosFiltradosGlobal : Object.keys(municipios))
                .filter(municipio => municipios[municipio].pedidos.length > 0)
                .map((municipio) => {
                const dadosMunicipio = municipios[municipio];
                const subtotal = calcularSubtotalMunicipio(municipio);
                
                return (
                  <div key={municipio} className="bg-white rounded-xl shadow-lg border border-gray-200">
                    {/* Cabeçalho do Município */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-bold">{municipio}</h3>
                          <p className="text-blue-100">Liderança: {dadosMunicipio.lideranca}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-blue-100">Subtotal do Município</div>
                          <div className="text-xl font-bold">{formatCurrency(subtotal)}</div>
                          <div className="text-xs text-blue-100">{dadosMunicipio.pedidos.length} pedido(s)</div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Pedidos do Município */}
                    <div className="p-4 space-y-3">
                      {dadosMunicipio.pedidos.map((pedido, index) => {
                        const equipamento = EQUIPAMENTOS.find(eq => eq.nome === pedido.equipamento);
                        const valorItem = equipamento ? equipamento.valor * pedido.quantidade : 0;
                        
                        return (
                          <div key={pedido.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                    #{index + 1}
                                  </span>
                                  <h4 className="font-semibold text-gray-800">{pedido.equipamento}</h4>
                                </div>
                                
                                <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">Quantidade:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      value={pedido.quantidade}
                                      onChange={(e) => editarQuantidade(municipio, pedido.id, e.target.value)}
                                      className="ml-2 w-20 p-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <span className="font-medium">Valor unitário:</span>
                                    <span className="ml-2 text-blue-600">{formatCurrency(equipamento?.valor || 0)}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Valor total:</span>
                                    <span className="ml-2 font-bold text-blue-700">{formatCurrency(valorItem)}</span>
                                  </div>
                                </div>
                                
                                {pedido.observacoes && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    <span className="font-medium">Observações:</span>
                                    <span className="ml-2">{pedido.observacoes}</span>
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={() => removerPedido(municipio, pedido.id)}
                                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remover pedido"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <div className="text-8xl mb-6">🏗️</div>
              <h3 className="text-2xl font-bold mb-4">Nenhum município com pedidos ainda</h3>
              <p className="text-lg mb-6">Selecione um município acima e comece a adicionar equipamentos</p>
              <div className="max-w-md mx-auto text-left bg-gray-100 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Como usar:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Selecione um município do Paraná</li>
                  <li>Informe a liderança responsável</li>
                  <li>Adicione os equipamentos solicitados</li>
                  <li>Repita para outros municípios</li>
                </ol>
              </div>
            </div>
          )}
        </section>

        {/* Estatísticas Detalhadas por Equipamento */}
        {totalPedidos > 0 && (
          <section className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              📊 Estatísticas por Tipo de Equipamento
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{municipiosComPedidos}</div>
                <div className="text-sm text-gray-600">Municípios Ativos</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{totalPedidos}</div>
                <div className="text-sm text-gray-600">Total de Pedidos</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{totalEquipamentos}</div>
                <div className="text-sm text-gray-600">Total de Equipamentos</div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(municipios).reduce((tipos, municipio) => {
                    municipio.pedidos.forEach(pedido => tipos.add(pedido.equipamento));
                    return tipos;
                  }, new Set()).size}
                </div>
                <div className="text-sm text-gray-600">Tipos Diferentes</div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-red-600">{formatCurrency(valorTotalGeral)}</div>
                <div className="text-sm text-gray-600">Valor Total Geral</div>
              </div>
            </div>

            {/* Gráfico de Equipamentos mais Solicitados */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-4">🚜 Equipamentos Mais Solicitados</h3>
              <div className="space-y-2">
                {EQUIPAMENTOS.map(equipamento => {
                  const quantidade = Object.values(municipios).reduce((total, municipio) => {
                    return total + municipio.pedidos
                      .filter(pedido => pedido.equipamento === equipamento.nome)
                      .reduce((sum, pedido) => sum + pedido.quantidade, 0);
                  }, 0);
                  
                  const percentual = totalEquipamentos > 0 ? (quantidade / totalEquipamentos) * 100 : 0;
                  
                  if (quantidade > 0) {
                    return (
                      <div key={equipamento.nome} className="flex items-center gap-3">
                        <div className="w-40 text-sm font-medium text-gray-700 truncate">
                          {equipamento.nome}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(percentual, 5)}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-right text-sm font-medium text-gray-600">
                          {quantidade} un.
                        </div>
                        <div className="w-20 text-right text-sm text-gray-500">
                          {percentual.toFixed(1)}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PedidosMaquinarios;