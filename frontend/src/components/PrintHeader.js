import React from 'react';

export default function PrintHeader({ titulo, resumoFiltros = {} }) {
  const dataAtual = new Date().toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  return (
    <div className="print-header no-print-hide" style={{ display: 'none' }}>
      <div style={{ marginBottom: '20px', padding: '10px', borderBottom: '2px solid #333' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
          {titulo}
        </h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
          <strong>Data/Hora:</strong> {dataAtual}
        </p>
        
        {Object.keys(resumoFiltros).length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong style={{ fontSize: '14px' }}>Filtros aplicados:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '5px', fontSize: '13px' }}>
              {Object.entries(resumoFiltros).map(([key, value]) => (
                value && (
                  <li key={key}>
                    <strong>{key}:</strong> {value}
                  </li>
                )
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
