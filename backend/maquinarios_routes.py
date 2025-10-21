from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from datetime import datetime, timezone

from auth_middleware import get_current_user
from auth_routes import get_db
from auth_models import UserResponse
from maquinarios_models import (
    PedidoMaquinarioCreate,
    PedidoMaquinarioUpdate,
    PedidoMaquinarioResponse
)

router = APIRouter()

@router.post("/pedidos-maquinarios", response_model=PedidoMaquinarioResponse, status_code=status.HTTP_201_CREATED)
async def create_pedido_maquinario(
    pedido_data: PedidoMaquinarioCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Criar um novo pedido de maquinário"""
    try:
        # Criar documento
        now = datetime.now(timezone.utc).isoformat()
        document = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "municipio": pedido_data.municipio,
            "lideranca": pedido_data.lideranca,
            "equipamentos": [equip.dict() for equip in pedido_data.equipamentos],
            "valor_total": pedido_data.valor_total,
            "observacoes": pedido_data.observacoes or "",
            "created_at": now,
            "updated_at": now
        }
        
        # Inserir no banco
        await db.pedidos_maquinarios_v2.insert_one(document)
        
        return PedidoMaquinarioResponse(**document)
        
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": str(ve)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Falha ao salvar o pedido: {str(e)}"}
        )

@router.get("/pedidos-maquinarios", response_model=List[PedidoMaquinarioResponse])
async def list_pedidos_maquinarios(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Listar todos os pedidos de maquinários (compartilhados entre todos os usuários)"""
    try:
        # Buscar todos os pedidos, ordenados por data de criação (mais recentes primeiro)
        cursor = db.pedidos_maquinarios_v2.find({})
        pedidos = await cursor.sort("created_at", -1).to_list(length=1000)
        
        return [PedidoMaquinarioResponse(**pedido) for pedido in pedidos]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Erro ao listar pedidos: {str(e)}"}
        )

@router.get("/pedidos-maquinarios/{pedido_id}", response_model=PedidoMaquinarioResponse)
async def get_pedido_maquinario(
    pedido_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Buscar um pedido específico por ID"""
    try:
        pedido = await db.pedidos_maquinarios_v2.find_one({"id": pedido_id})
        
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Pedido não encontrado"}
            )
        
        return PedidoMaquinarioResponse(**pedido)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Erro ao buscar pedido: {str(e)}"}
        )

@router.put("/pedidos-maquinarios/{pedido_id}", response_model=PedidoMaquinarioResponse)
async def update_pedido_maquinario(
    pedido_id: str,
    pedido_data: PedidoMaquinarioUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Atualizar um pedido existente"""
    try:
        # Verificar se o pedido existe
        existing_pedido = await db.pedidos_maquinarios_v2.find_one({"id": pedido_id})
        
        if not existing_pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Pedido não encontrado"}
            )
        
        # Verificar se o usuário é o dono do pedido
        if existing_pedido["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Você não tem permissão para editar este pedido"}
            )
        
        # Preparar dados para atualização
        update_data = pedido_data.dict(exclude_unset=True)
        
        # Converter equipamentos para dict se fornecidos
        if "equipamentos" in update_data and update_data["equipamentos"]:
            update_data["equipamentos"] = [equip.dict() if hasattr(equip, 'dict') else equip for equip in update_data["equipamentos"]]
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Atualizar no banco
        await db.pedidos_maquinarios_v2.update_one(
            {"id": pedido_id},
            {"$set": update_data}
        )
        
        # Buscar e retornar o pedido atualizado
        updated_pedido = await db.pedidos_maquinarios_v2.find_one({"id": pedido_id})
        
        return PedidoMaquinarioResponse(**updated_pedido)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Erro ao atualizar pedido: {str(e)}"}
        )

@router.delete("/pedidos-maquinarios/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pedido_maquinario(
    pedido_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Deletar um pedido"""
    try:
        # Verificar se o pedido existe
        existing_pedido = await db.pedidos_maquinarios_v2.find_one({"id": pedido_id})
        
        if not existing_pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Pedido não encontrado"}
            )
        
        # Verificar se o usuário é o dono do pedido
        if existing_pedido["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Você não tem permissão para excluir este pedido"}
            )
        
        # Deletar do banco
        await db.pedidos_maquinarios_v2.delete_one({"id": pedido_id})
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Erro ao deletar pedido: {str(e)}"}
        )
