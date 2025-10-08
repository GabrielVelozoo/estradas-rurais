from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from datetime import datetime, timezone

from auth_middleware import get_current_user, get_db
from auth_models import UserResponse

router = APIRouter()

class PedidoEquipamento(BaseModel):
    id: str
    equipamento: str
    quantidade: int
    valor_unitario: float
    valor_total: float
    observacoes: Optional[str] = None

class PedidoMunicipio(BaseModel):
    municipio: str
    lideranca: str
    pedidos: List[PedidoEquipamento]
    valor_total: float

class PedidosData(BaseModel):
    municipios: Dict[str, PedidoMunicipio]

class PedidosResponse(BaseModel):
    id: str
    user_id: str
    data: Dict[str, Any]
    created_at: str
    updated_at: str

@router.get("/api/pedidos/load", response_model=Dict[str, Any])
async def load_pedidos(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Carregar pedidos salvos do usuário"""
    try:
        # Buscar pedidos do usuário atual
        pedidos_doc = await db.pedidos_maquinarios.find_one({
            "user_id": current_user.id
        })
        
        if pedidos_doc:
            return pedidos_doc.get("data", {})
        else:
            # Retornar estrutura vazia se não há dados
            return {}
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao carregar pedidos: {str(e)}"
        )

@router.post("/api/pedidos/save")
async def save_pedidos(
    pedidos_data: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Salvar pedidos do usuário"""
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Estrutura do documento
        document = {
            "user_id": current_user.id,
            "data": pedidos_data,
            "updated_at": now
        }
        
        # Verificar se já existe documento para este usuário
        existing_doc = await db.pedidos_maquinarios.find_one({
            "user_id": current_user.id
        })
        
        if existing_doc:
            # Atualizar documento existente
            await db.pedidos_maquinarios.update_one(
                {"user_id": current_user.id},
                {"$set": document}
            )
        else:
            # Criar novo documento
            document["id"] = str(uuid.uuid4())
            document["created_at"] = now
            await db.pedidos_maquinarios.insert_one(document)
        
        return {"message": "Pedidos salvos com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar pedidos: {str(e)}"
        )

@router.delete("/api/pedidos/clear")
async def clear_pedidos(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Limpar todos os pedidos do usuário"""
    try:
        await db.pedidos_maquinarios.delete_many({
            "user_id": current_user.id
        })
        
        return {"message": "Pedidos removidos com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover pedidos: {str(e)}"
        )