from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from datetime import datetime, timezone

from auth_middleware import get_current_user
from auth_routes import get_db
from auth_models import UserResponse
from liderancas_models import (
    PedidoLiderancaCreate,
    PedidoLiderancaUpdate,
    PedidoLiderancaResponse
)

router = APIRouter()

@router.post("/liderancas", response_model=PedidoLiderancaResponse, status_code=status.HTTP_201_CREATED)
async def create_pedido(
    pedido_data: PedidoLiderancaCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Criar um novo pedido de liderança"""
    try:
        # Criar documento
        now = datetime.now(timezone.utc).isoformat()
        document = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "municipio_id": pedido_data.municipio_id,
            "municipio_nome": pedido_data.municipio_nome,
            "pedido_titulo": pedido_data.pedido_titulo,
            "protocolo": pedido_data.protocolo or "",
            "nome_lideranca": pedido_data.nome_lideranca,
            "numero_lideranca": pedido_data.numero_lideranca,
            "descricao": pedido_data.descricao or "",
            "created_at": now,
            "updated_at": now
        }
        
        # Inserir no banco
        await db.pedidos_liderancas.insert_one(document)
        
        return PedidoLiderancaResponse(**document)
        
    except ValueError as ve:
        # Erros de validação do Pydantic
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": str(ve)}
        )
    except Exception as e:
        # Erro genérico
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Falha ao salvar o pedido: {str(e)}"}
        )

@router.get("/liderancas", response_model=List[PedidoLiderancaResponse])
async def list_pedidos(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Listar todos os pedidos de liderança do usuário"""
    try:
        # Buscar todos os pedidos do usuário, ordenados por data de criação (mais recentes primeiro)
        cursor = db.pedidos_liderancas.find({"user_id": current_user.id})
        pedidos = await cursor.sort("created_at", -1).to_list(length=1000)
        
        return [PedidoLiderancaResponse(**pedido) for pedido in pedidos]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar pedidos: {str(e)}"
        )

@router.get("/liderancas/{pedido_id}", response_model=PedidoLiderancaResponse)
async def get_pedido(
    pedido_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Buscar um pedido específico por ID"""
    try:
        pedido = await db.pedidos_liderancas.find_one({
            "id": pedido_id,
            "user_id": current_user.id
        })
        
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido não encontrado"
            )
        
        return PedidoLiderancaResponse(**pedido)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar pedido: {str(e)}"
        )

@router.put("/liderancas/{pedido_id}", response_model=PedidoLiderancaResponse)
async def update_pedido(
    pedido_id: str,
    pedido_data: PedidoLiderancaUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Atualizar um pedido existente"""
    try:
        # Verificar se o pedido existe e pertence ao usuário
        existing_pedido = await db.pedidos_liderancas.find_one({
            "id": pedido_id,
            "user_id": current_user.id
        })
        
        if not existing_pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido não encontrado"
            )
        
        # Se o protocolo está sendo alterado, verificar se o novo protocolo já existe
        if pedido_data.protocolo and pedido_data.protocolo != existing_pedido.get("protocolo"):
            duplicate_check = await db.pedidos_liderancas.find_one({
                "protocolo": pedido_data.protocolo
            })
            
            if duplicate_check:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Protocolo {pedido_data.protocolo} já existe no sistema"
                )
        
        # Preparar dados para atualização (apenas campos fornecidos)
        update_data = {k: v for k, v in pedido_data.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Atualizar no banco
        await db.pedidos_liderancas.update_one(
            {"id": pedido_id},
            {"$set": update_data}
        )
        
        # Buscar e retornar o pedido atualizado
        updated_pedido = await db.pedidos_liderancas.find_one({"id": pedido_id})
        
        return PedidoLiderancaResponse(**updated_pedido)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar pedido: {str(e)}"
        )

@router.delete("/liderancas/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pedido(
    pedido_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Deletar um pedido"""
    try:
        # Verificar se o pedido existe e pertence ao usuário
        existing_pedido = await db.pedidos_liderancas.find_one({
            "id": pedido_id,
            "user_id": current_user.id
        })
        
        if not existing_pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido não encontrado"
            )
        
        # Deletar do banco
        await db.pedidos_liderancas.delete_one({"id": pedido_id})
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar pedido: {str(e)}"
        )