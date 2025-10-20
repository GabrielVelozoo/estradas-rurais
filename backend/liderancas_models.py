from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import re

class PedidoLiderancaBase(BaseModel):
    pedido: str = Field(..., min_length=1, max_length=200, description="O que é o pedido")
    protocolo: str = Field(..., description="Protocolo no formato 00.000.000-0")
    lideranca: str = Field(..., min_length=1, max_length=200, description="Nome da liderança")
    descricao: Optional[str] = Field(None, max_length=2000, description="Descrição detalhada do pedido")

    @validator('protocolo')
    def validate_protocolo_format(cls, v):
        """Validar formato do protocolo: 00.000.000-0"""
        # Remove espaços
        v = v.strip()
        
        # Padrão: XX.XXX.XXX-X (2 dígitos, ponto, 3 dígitos, ponto, 3 dígitos, hífen, 1 dígito)
        pattern = r'^\d{2}\.\d{3}\.\d{3}-\d{1}$'
        
        if not re.match(pattern, v):
            raise ValueError(
                'Protocolo deve estar no formato 00.000.000-0 '
                '(exemplo: 24.298.238-6)'
            )
        
        return v

class PedidoLiderancaCreate(PedidoLiderancaBase):
    """Schema para criar um novo pedido"""
    pass

class PedidoLiderancaUpdate(BaseModel):
    """Schema para atualizar um pedido (todos os campos opcionais)"""
    pedido: Optional[str] = Field(None, min_length=1, max_length=200)
    protocolo: Optional[str] = Field(None, description="Protocolo no formato 00.000.000-0")
    lideranca: Optional[str] = Field(None, min_length=1, max_length=200)
    descricao: Optional[str] = Field(None, max_length=2000)

    @validator('protocolo')
    def validate_protocolo_format(cls, v):
        """Validar formato do protocolo se fornecido"""
        if v is None:
            return v
            
        v = v.strip()
        pattern = r'^\d{2}\.\d{3}\.\d{3}-\d{1}$'
        
        if not re.match(pattern, v):
            raise ValueError(
                'Protocolo deve estar no formato 00.000.000-0 '
                '(exemplo: 24.298.238-6)'
            )
        
        return v

class PedidoLiderancaResponse(PedidoLiderancaBase):
    """Schema de resposta com campos adicionais"""
    id: str
    user_id: str
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True