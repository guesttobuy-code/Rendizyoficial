#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para configurar o remote do GitHub
"""

import subprocess
import sys
from pathlib import Path

# Configurar encoding para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def run_command(cmd, cwd=None):
    """Executa comando e retorna resultado"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    project_dir = Path(__file__).parent.absolute()
    
    # Remote do GitHub (do diagnóstico anterior)
    remote_url = "https://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@github.com/guesttobuy-code/Rendizyoficial.git"
    
    print("=" * 70)
    print("CONFIGURANDO REMOTE DO GITHUB")
    print("=" * 70)
    print(f"\nDiretorio: {project_dir}")
    print(f"Remote: guesttobuy-code/Rendizyoficial\n")
    
    # Verificar se já existe remote
    success, remotes, _ = run_command("git remote -v", cwd=project_dir)
    if success and remotes.strip():
        print("Remote ja configurado:")
        print(remotes)
        print("\nAtualizando URL do remote...")
        success2, output2, error2 = run_command(
            f'git remote set-url origin "{remote_url}"',
            cwd=project_dir
        )
        if success2:
            print("OK: Remote atualizado!")
        else:
            print(f"ERRO: {error2}")
            return 1
    else:
        print("Adicionando remote...")
        success, output, error = run_command(
            f'git remote add origin "{remote_url}"',
            cwd=project_dir
        )
        if success:
            print("OK: Remote adicionado!")
        else:
            print(f"ERRO: {error}")
            return 1
    
    # Verificar novamente
    print("\nVerificando remote configurado...")
    success, remotes, _ = run_command("git remote -v", cwd=project_dir)
    if success:
        print("Remotes configurados:")
        for line in remotes.strip().split('\n'):
            if line.strip():
                print(f"  {line}")
    
    # Testar conexão
    print("\nTestando conexao com GitHub...")
    success, output, error = run_command("git ls-remote origin", cwd=project_dir)
    if success:
        print("OK: Conexao com GitHub funcionando!")
        if output.strip():
            lines = output.strip().split('\n')
            print(f"  Encontradas {len(lines)} referencias remotas")
    else:
        print(f"ERRO na conexao: {error}")
        print("\nPossiveis causas:")
        print("1. Token expirado ou invalido")
        print("2. Repositorio nao existe ou sem permissao")
        print("3. Problema de rede")
        return 1
    
    print("\n" + "=" * 70)
    print("CONFIGURACAO CONCLUIDA!")
    print("=" * 70)
    print("\nAgora voce pode:")
    print("1. Adicionar arquivos: git add .")
    print("2. Fazer commit: git commit -m 'mensagem'")
    print("3. Fazer push: git push -u origin master")
    print("\nOu use o script: python fazer_push_seguro.py")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

