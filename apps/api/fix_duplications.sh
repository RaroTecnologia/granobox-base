#!/bin/bash

# Script para corrigir duplicações em arquivos TypeScript

echo "🔧 Corrigindo duplicações nos arquivos da API..."

# Lista de arquivos para corrigir
files=(
    "src/modules/config/dto/update-system-config.dto.ts"
    "src/modules/printers/dto/create-printer.dto.ts"
    "src/modules/printers/dto/test-printer.dto.ts"
    "src/modules/printers/dto/update-printer.dto.ts"
    "src/modules/printers/printers.module.ts"
    "src/modules/printers/printers.service.ts"
    "src/modules/products/controllers/categories.controller.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Corrigindo: $file"
        
        # Encontrar a primeira ocorrência de "export class" ou "export enum"
        first_export=$(grep -n "export class\|export enum" "$file" | head -1 | cut -d: -f1)
        
        if [ ! -z "$first_export" ]; then
            # Encontrar a linha de fechamento correspondente
            closing_line=$(awk -v start="$first_export" '
                BEGIN { brace_count = 0; found_start = 0 }
                NR >= start { 
                    if (found_start == 0) { found_start = 1 }
                    for (i = 1; i <= length($0); i++) {
                        char = substr($0, i, 1)
                        if (char == "{") brace_count++
                        if (char == "}") brace_count--
                        if (brace_count == 0 && found_start == 1 && char == "}") {
                            print NR
                            exit
                        }
                    }
                }
            ' "$file")
            
            if [ ! -z "$closing_line" ]; then
                # Manter apenas até a linha de fechamento + 1
                head -$((closing_line + 1)) "$file" > "${file}.tmp"
                mv "${file}.tmp" "$file"
                echo "  ✅ Corrigido (mantido até linha $((closing_line + 1)))"
            else
                echo "  ⚠️  Não foi possível encontrar o fechamento"
            fi
        else
            echo "  ⚠️  Não foi possível encontrar exports"
        fi
    else
        echo "  ❌ Arquivo não encontrado: $file"
    fi
done

echo "🎉 Correção concluída!"

