from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import json
import os
from pathlib import Path

from auth_middleware import get_current_user
from auth_routes import get_db
from auth_models import UserResponse

router = APIRouter()

# Carregar municípios do arquivo JSON
MUNICIPIOS_FILE = Path(__file__).parent / "data" / "municipios_parana.json"

def load_municipios():
    """Carregar lista de municípios do arquivo JSON"""
    with open(MUNICIPIOS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def normalize_text(text: str) -> str:
    """Remover acentos e converter para minúsculas"""
    import unicodedata
    if not text:
        return ''
    # Normalização NFD + remoção de diacríticos
    nfd = unicodedata.normalize('NFD', text)
    without_accents = ''.join(char for char in nfd if unicodedata.category(char) != 'Mn')
    return without_accents.lower().strip()

@router.get("/municipios")
async def list_municipios(
    search: Optional[str] = Query(None, description="Termo de busca (case/acento-insensível)"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Listar municípios do Paraná com busca acento-insensível
    
    - Sem search: retorna todos os 399 municípios
    - Com search: filtra por nome (case/acento-insensível)
    """
    try:
        # Carregar todos os municípios
        municipios = load_municipios()
        
        # Se não há busca, retornar todos
        if not search or search.strip() == '':
            # Buscar números de liderança para cada município
            municipios_com_numeros = []
            for municipio in municipios:
                # Buscar o pedido mais recente para este município
                pedido = await db.pedidos_liderancas.find_one(
                    {"lideranca": {"$regex": municipio["nome"], "$options": "i"}},
                    sort=[("created_at", -1)]
                )
                
                municipios_com_numeros.append({
                    "id": municipio["id"],
                    "nome": municipio["nome"],
                    "numero_lideranca": pedido.get("numero_lideranca", "") if pedido else ""
                })
            
            return municipios_com_numeros
        
        # Normalizar termo de busca
        search_normalized = normalize_text(search)
        
        # Filtrar municípios
        filtered = []
        for municipio in municipios:
            nome_normalized = normalize_text(municipio["nome"])
            if search_normalized in nome_normalized:
                # Buscar número de liderança
                pedido = await db.pedidos_liderancas.find_one(
                    {"lideranca": {"$regex": municipio["nome"], "$options": "i"}},
                    sort=[("created_at", -1)]
                )
                
                filtered.append({
                    "id": municipio["id"],
                    "nome": municipio["nome"],
                    "numero_lideranca": pedido.get("numero_lideranca", "") if pedido else ""
                })
        
        return filtered
        
    except Exception as e:
        print(f"Error loading municipios: {e}")
        return []
