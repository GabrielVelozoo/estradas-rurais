from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class EquipamentoItem(BaseModel):
    """Item de equipamento dentro de um pedido"""
    equipamento: str = Field(..., min_length=1, max_length=200)
    quantidade: int = Field(..., ge=1)
    valor_unitario: float = Field(..., ge=0)
    valor_total: float = Field(..., ge=0)
    observacoes: Optional[str] = Field(None, max_length=500)

class PedidoMaquinarioBase(BaseModel):
    """Schema base para pedido de maquinário"""
    municipio: str = Field(..., min_length=1, max_length=200, description="Nome do município")
    lideranca: str = Field(..., min_length=1, max_length=200, description="Nome da liderança")
    equipamentos: List[EquipamentoItem] = Field(..., min_items=1, description="Lista de equipamentos")
    valor_total: float = Field(..., ge=0, description="Valor total do pedido")
    observacoes: Optional[str] = Field(None, max_length=1000, description="Observações gerais do pedido")

class PedidoMaquinarioCreate(PedidoMaquinarioBase):
    """Schema para criar um novo pedido"""
    pass

class PedidoMaquinarioUpdate(BaseModel):
    """Schema para atualizar um pedido (todos os campos opcionais)"""
    municipio: Optional[str] = Field(None, min_length=1, max_length=200)
    lideranca: Optional[str] = Field(None, min_length=1, max_length=200)
    equipamentos: Optional[List[EquipamentoItem]] = Field(None, min_items=1)
    valor_total: Optional[float] = Field(None, ge=0)
    observacoes: Optional[str] = Field(None, max_length=1000)

class PedidoMaquinarioResponse(PedidoMaquinarioBase):
    """Schema de resposta com campos adicionais"""
    id: str
    user_id: str
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
