#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para fazer deploy no GitHub
Faz commit e push de todas as alterações
"""

import subprocess
import sys
import os
from pathlib import Path

# Configurar encoding para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def run_command(cmd, cwd=None, check=False):
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
        if check and result.returncode != 0:
            print(f"ERRO: {result.stderr}")
            return False, result.stdout, result.stderr
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    project_dir = Path(__file__).parent.absolute()
    github_url = "https://github.com/guesttobuy-code/Rendizyoficial.git"
    github_token = "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"
    
    # URL com token
    github_url_with_token = f"https://{github_token}@github.com/guesttobuy-code/Rendizyoficial.git"
    
    print("=" * 70)
    print("DEPLOY NO GITHUB")
    print("=" * 70)
    print(f"\nDiretório: {project_dir}")
    print(f"Repositório: {github_url}")
    print()
    
    # PASSO 1: Verificar se Git está instalado
    print("1. Verificando Git...")
    success, output, error = run_command("git --version", cwd=project_dir)
    if success:
        print(f"OK: Git encontrado")
        print(f"   {output.strip()}")
    else:
        print("ERRO: Git não está instalado!")
        print("   Instale em: https://git-scm.com/download/win")
        return 1
    print()
    
    # PASSO 2: Verificar se é repositório Git
    print("2. Verificando repositório Git...")
    git_dir = project_dir / ".git"
    if not git_dir.exists():
        print("AVISO: Não é um repositório Git")
        print("   Inicializando...")
        success, output, error = run_command("git init", cwd=project_dir)
        if success:
            print("OK: Repositório inicializado")
        else:
            print(f"ERRO ao inicializar: {error}")
            return 1
    else:
        print("OK: Repositório Git encontrado")
    print()
    
    # PASSO 3: Configurar remote
    print("3. Configurando remote do GitHub...")
    success, output, error = run_command("git remote get-url origin", cwd=project_dir)
    if success and output.strip():
        existing_url = output.strip()
        if github_url in existing_url or "guesttobuy-code/Rendizyoficial" in existing_url:
            print("OK: Remote já configurado")
            # Atualizar com token
            success2, output2, error2 = run_command(
                f'git remote set-url origin "{github_url_with_token}"',
                cwd=project_dir
            )
            if success2:
                print("OK: Remote atualizado com token")
            else:
                print(f"AVISO: Não foi possível atualizar remote: {error2}")
        else:
            print(f"AVISO: Remote diferente encontrado: {existing_url}")
            print("   Atualizando...")
            success2, output2, error2 = run_command(
                f'git remote set-url origin "{github_url_with_token}"',
                cwd=project_dir
            )
            if success2:
                print("OK: Remote configurado")
            else:
                print(f"ERRO ao configurar remote: {error2}")
                return 1
    else:
        print("   Adicionando remote...")
        success, output, error = run_command(
            f'git remote add origin "{github_url_with_token}"',
            cwd=project_dir
        )
        if success:
            print("OK: Remote configurado")
        else:
            if "already exists" in error.lower():
                print("OK: Remote já existe")
            else:
                print(f"ERRO ao configurar remote: {error}")
                return 1
    print()
    
    # PASSO 4: Verificar branch
    print("4. Verificando branch...")
    success, output, error = run_command("git branch --show-current", cwd=project_dir)
    if success and output.strip():
        current_branch = output.strip()
        print(f"OK: Branch atual: {current_branch}")
    else:
        print("   Criando branch 'main'...")
        success2, output2, error2 = run_command("git branch -M main", cwd=project_dir)
        if success2:
            current_branch = "main"
            print(f"OK: Branch 'main' criada")
        else:
            current_branch = "main"
            print("AVISO: Continuando com branch 'main'")
    print()
    
    # PASSO 5: Adicionar arquivos
    print("5. Adicionando arquivos...")
    success, output, error = run_command("git add .", cwd=project_dir)
    if success:
        # Verificar quantos arquivos foram adicionados
        success2, output2, error2 = run_command(
            "git diff --cached --name-only",
            cwd=project_dir
        )
        if success2 and output2.strip():
            files = output2.strip().split('\n')
            print(f"OK: {len(files)} arquivo(s) adicionado(s)")
        else:
            print("OK: Arquivos adicionados (verificando status...)")
            success3, output3, error3 = run_command("git status --short", cwd=project_dir)
            if success3:
                if output3.strip():
                    print(f"   Arquivos modificados:")
                    for line in output3.strip().split('\n')[:10]:  # Mostrar até 10
                        print(f"      {line}")
                    if len(output3.strip().split('\n')) > 10:
                        print(f"      ... e mais {len(output3.strip().split('\n')) - 10} arquivo(s)")
                else:
                    print("   Nenhum arquivo modificado")
    else:
        print(f"ERRO ao adicionar arquivos: {error}")
        return 1
    print()
    
    # PASSO 6: Fazer commit
    print("6. Fazendo commit...")
    commit_message = "feat: Adiciona rota /chat/channels/config para salvar configurações WhatsApp"
    print(f"   Mensagem: {commit_message}")
    
    success, output, error = run_command(
        f'git commit -m "{commit_message}"',
        cwd=project_dir
    )
    
    if success:
        print("OK: Commit realizado com sucesso")
        if output.strip():
            print(f"   {output.strip()}")
    else:
        if "nothing to commit" in error.lower() or "nothing to commit" in output.lower():
            print("AVISO: Nenhuma alteração para commitar")
            print("   (Tudo já está commitado ou não há mudanças)")
        else:
            print(f"ERRO no commit: {error}")
            if output.strip():
                print(f"   Output: {output}")
            # Continuar mesmo assim para tentar push
    print()
    
    # PASSO 7: Fazer push
    print("=" * 70)
    print("7. FAZENDO PUSH PARA GITHUB...")
    print("=" * 70)
    print()
    
    # Primeiro, verificar se precisa configurar upstream
    success, output, error = run_command(
        f"git push -u origin {current_branch}",
        cwd=project_dir
    )
    
    if success:
        print("=" * 70)
        print("SUCESSO! PUSH REALIZADO COM SUCESSO!")
        print("=" * 70)
        print(f"\nSaída do push:")
        print(output)
        
        print(f"\nRepositório:")
        print(f"  {github_url}")
        print()
        
        print("=" * 70)
        print("PRÓXIMOS PASSOS")
        print("=" * 70)
        print("\n1. Verifique o repositório no GitHub:")
        print(f"   {github_url}")
        print("\n2. Se estiver usando Vercel/Netlify, o deploy automático deve iniciar")
        print("\n3. Verifique os logs de deploy na plataforma")
        
        return 0
    else:
        print("=" * 70)
        print("ERRO AO FAZER PUSH")
        print("=" * 70)
        print(f"\nErro: {error}")
        print(f"\nSaída: {output}")
        
        # Tentar diagnosticar o problema
        if "authentication" in error.lower() or "permission" in error.lower():
            print("\nPROBLEMA DE AUTENTICAÇÃO")
            print("   Verifique se o token do GitHub está correto")
            print("   Token está em: TOKENS_E_ACESSOS_COMPLETO.md")
        elif "not found" in error.lower() or "404" in error.lower():
            print("\nPROBLEMA: Repositório não encontrado")
            print("   Verifique se o repositório existe:")
            print(f"   {github_url}")
        elif "already up to date" in error.lower() or "already up to date" in output.lower():
            print("\nAVISO: Repositório já está atualizado")
            print("   Não há nada novo para enviar")
            return 0
        else:
            print("\nTente fazer push manualmente:")
            print(f"   git push -u origin {current_branch}")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())
