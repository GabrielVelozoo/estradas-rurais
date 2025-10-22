from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from datetime import datetime, timezone

from auth_middleware import get_current_user
from auth_routes import get_db
from auth_models import UserResponse
from maquinarios_models import (
    PedidoMaquinarioCreate,
    PedidoMaquinarioUpdate,
    PedidoMaquinarioResponse,
)

router = APIRouter()


def _normalize_maquinario(doc):
    """
    Normalizar documento do MongoDB para garantir que todos os campos existam
    e estejam no formato correto antes de criar PedidoMaquinarioResponse
    """
    if not doc:
        return doc
    
    # Garantir que campos obrigatórios existam
    doc["id"] = str(doc.get("id", ""))
    doc["user_id"] = str(doc.get("user_id", ""))
    doc["municipio"] = str(doc.get("municipio", ""))
    doc["lideranca"] = str(doc.get("lideranca", ""))
    doc["equipamentos"] = doc.get("equipamentos", [])
    doc["valor_total"] = float(doc.get("valor_total", 0.0))
    doc["observacoes"] = str(doc.get("observacoes", "") or "")
    
    # Normalizar datas (aceitar datetime object ou string)
    created_at = doc.get("created_at")
    if hasattr(created_at, "isoformat"):
        doc["created_at"] = created_at.isoformat()
    elif isinstance(created_at, str):
        doc["created_at"] = created_at
    else:
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    updated_at = doc.get("updated_at")
    if hasattr(updated_at, "isoformat"):
        doc["updated_at"] = updated_at.isoformat()
    elif isinstance(updated_at, str):
        doc["updated_at"] = updated_at
    else:
        doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return doc

# ----------------------------------------------------
# CREATE
# ----------------------------------------------------
@router.post(
    "/pedidos-maquinarios",
    response_model=PedidoMaquinarioResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_pedido_maquinario(
    pedido_data: PedidoMaquinarioCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Criar um novo pedido de maquinário (user_id mantido como metadado)."""
    try:
        now = datetime.now(timezone.utc).isoformat()
        document = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,  # apenas informativo
            "municipio": pedido_data.municipio,
            "lideranca": pedido_data.lideranca,
            "equipamentos": [equip.dict() for equip in pedido_data.equipamentos],
            "valor_total": pedido_data.valor_total,
            "observacoes": pedido_data.observacoes or "",
            "created_at": now,
            "updated_at": now,
        }

        await db.pedidos_maquinarios_v2.insert_one(document)
        return PedidoMaquinarioResponse(**document)

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": str(ve)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Falha ao salvar o pedido: {str(e)}"},
        )

# ----------------------------------------------------
# LIST (TODOS) — sem filtrar por user
# ----------------------------------------------------
@router.get(
    "/pedidos-maquinarios",
    response_model=List[PedidoMaquinarioResponse],
    status_code=status.HTTP_200_OK,
)
async def list_pedidos_maquinarios(
    municipio: Optional[str] = Query(default=None),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Listar TODOS os pedidos de maquinários (visível para qualquer usuário autenticado).
    Filtro opcional por município (?municipio=...).
    """
    try:
        query = {}
        if municipio:
            query["municipio"] = municipio

        cursor = db.pedidos_maquinarios_v2.find(query).sort("created_at", -1)
        raw_pedidos = await cursor.to_list(length=10000)
        
        # Normalizar todos os documentos antes de criar o response
        return [PedidoMaquinarioResponse(**_normalize_maquinario(doc)) for doc in raw_pedidos]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Erro ao listar pedidos: {str(e)}"},
        )

# ----------------------------------------------------
# GET BY ID — sem filtrar por user
# ----------------------------------------------------
@router.get(
    "/pedidos-maquinarios/{pedido_id}",
    response_model=PedidoMaquinarioResponse,
    status_code=status.HTTP_200_OK,
)
async def get_pedido_maquinario(
    pedido_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Buscar um pedido específico por ID (qualquer usuário autenticado pode ver)."""
    try:
        pedido = await db.pedidos_maquinarios_v2.find_one({"id": pedido_id})
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Pedido não encontrado"},
            )
        return PedidoMaquinarioResponse(**pedido)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Erro ao buscar pedido: {str(e)}"},
        )

# ----------------------------------------------------
# UPDATE — sem travar por user_id
# ----------------------------------------------------
@router.put(
    "/pedidos-maquinarios/{pedido_id}",
    response_model=PedidoMaquinarioResponse,
    status_code=status.HTTP_200_OK,
)
async def update_pedido_maquinario(
    pedido_id: str,
    pedido_data: PedidoMaquinarioUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Atualizar um pedido existente por ID.
    Qualquer usuário autenticado pode atualizar (conforme solicitado).
    """
    try:
        existing_pedido = await db.pedidos_maquinarios_v2.find_one({"id": pedido_id})
        if not existing_pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Pedido não encontrado"},
            )

        # Preparar dados para atualização
        update_data = pedido_data.dict(exclude_unset=True)

        # Converter equipamentos para dict se fornecidos
        if "equipamentos" in update_data and update_data["equipamentos"]:
            update_data["equipamentos"] = [
                equip.dict() if hasattr(equip, "dict") else equip
                for equip in update_data["equipamentos"]
            ]

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        await db.pedidos_maquinarios_v2.update_one(
            {"id": pedido_id},
            {"$set": update_data},
        )

        updated_pedido = await db.pedidos_maquinarios_v2.find_one({"id": pedido_id})
        return PedidoMaquinarioResponse(**updated_pedido)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Erro ao atualizar pedido: {str(e)}"},
        )

# ----------------------------------------------------
# DELETE — sem travar por user_id
# ----------------------------------------------------
@router.delete(
    "/pedidos-maquinarios/{pedido_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_pedido_maquinario(
    pedido_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Deletar um pedido por ID.
    Qualquer usuário autenticado pode deletar (conforme solicitado).
    """
    try:
        existing_pedido = await db.pedidos_maquinarios_v2.find_one({"id": pedido_id})
        if not existing_pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Pedido não encontrado"},
            )

        await db.pedidos_maquinarios_v2.delete_one({"id": pedido_id})
        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": f"Erro ao deletar pedido: {str(e)}"},
        )
