"""
Script para criar índice parcial único no campo protocolo
Permite múltiplos documentos com protocolo vazio, mas garante unicidade para protocolos preenchidos
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

# Carregar variáveis de ambiente
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_partial_index():
    """Criar índice parcial único para protocolo"""
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Remover índice antigo se existir
        try:
            await db.pedidos_liderancas.drop_index("protocolo_1")
            print("✓ Índice antigo removido")
        except Exception:
            print("✓ Nenhum índice antigo para remover")
        
        # Criar índice parcial único
        # Apenas documentos com protocolo não-vazio serão indexados
        await db.pedidos_liderancas.create_index(
            [("protocolo", 1)],
            unique=True,
            partialFilterExpression={
                "protocolo": {"$type": "string", "$ne": ""}
            },
            name="protocolo_partial_unique"
        )
        
        print("✓ Índice parcial único criado com sucesso!")
        print("  - Permite múltiplos documentos com protocolo vazio")
        print("  - Garante unicidade para protocolos preenchidos")
        
    except Exception as e:
        print(f"✗ Erro ao criar índice: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_partial_index())
