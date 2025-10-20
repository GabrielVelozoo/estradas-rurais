"""
Script para remover índice único do protocolo
Permite protocolos duplicados
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

# Carregar variáveis de ambiente
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def drop_unique_index():
    """Remover índice único do protocolo"""
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Listar todos os índices
        indexes = await db.pedidos_liderancas.index_information()
        print("📋 Índices atuais:")
        for idx_name, idx_info in indexes.items():
            print(f"  - {idx_name}: {idx_info}")
        
        # Tentar remover índices relacionados ao protocolo
        indices_to_drop = []
        for idx_name in indexes.keys():
            if 'protocolo' in idx_name.lower() and idx_name != '_id_':
                indices_to_drop.append(idx_name)
        
        if not indices_to_drop:
            print("\n✓ Nenhum índice de protocolo encontrado para remover")
        else:
            for idx_name in indices_to_drop:
                try:
                    await db.pedidos_liderancas.drop_index(idx_name)
                    print(f"\n✓ Índice '{idx_name}' removido com sucesso!")
                except Exception as e:
                    print(f"\n✗ Erro ao remover índice '{idx_name}': {e}")
        
        print("\n✓ Operação concluída!")
        print("  - Protocolos duplicados agora são permitidos")
        
    except Exception as e:
        print(f"✗ Erro: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(drop_unique_index())
