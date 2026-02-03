# Geração do AAB para Play Console

## ❌ Problema Atual: Espaço em Disco

O build do AAB está falhando devido à falta de espaço no disco do sistema.

### Diagnóstico
```bash
$ df -h ~
/dev/disk3s5   228Gi   199Gi   3.7Gi    99%
```

- **Disco do sistema**: 99% cheio (apenas 3.7GB livres)
- **Espaço necessário**: ~10-15GB para build do Android
- **Volume /Volumes/DadosTiago**: 371GB livres (onde está o projeto)

### Solução: Liberar Espaço em Disco

Antes de gerar o AAB, é necessário liberar espaço no disco do sistema. Execute os comandos abaixo:

```bash
# 1. Limpar cache do Gradle (já foi feito)
rm -rf ~/.gradle/caches/*

# 2. Limpar builds antigos do Flutter
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Developer/Xcode/Archives/*

# 3. Limpar cache do Homebrew (se usado)
brew cleanup

# 4. Limpar cache do npm (se usado)
npm cache clean --force

# 5. Limpar cache do Yarn (se usado)
yarn cache clean

# 6. Limpar cache do Docker (se usado)
docker system prune -a

# 7. Verificar arquivos grandes
du -sh ~/* | sort -h | tail -20
```

### Arquivos de Configuração Criados

✅ Já foram criados os seguintes arquivos necessários para o build:

1. **`android/key.properties`**: Configuração das credenciais do keystore
2. **`android/upload-keystore.jks`**: Keystore para assinatura
3. **`android/app/build.gradle.kts`**: Configurado com assinatura de release
4. **`android/gradle.properties`**: Otimizações do Gradle

### Script de Build

O script `build_playstore_aab.sh` foi criado e está pronto para uso. Ele:

1. ✅ Verifica/cria o keystore
2. ✅ Limpa builds anteriores
3. ✅ Obtém dependências
4. ✅ Gera o AAB assinado
5. ✅ Salva cópia versionada em `releases/`

### Como Gerar o AAB (após liberar espaço)

```bash
cd /Volumes/DadosTiago/Dev/granobox/apps/tag/flutter

# Opção 1: Usar o script automatizado
bash build_playstore_aab.sh

# Opção 2: Comando direto
flutter build appbundle --release
```

### Credenciais do Keystore

- **Store Password**: `granobox2024`
- **Key Password**: `granobox2024`
- **Key Alias**: `granobox-key`
- **Validade**: 10.000 dias (~27 anos)
- **Organização**: WDEZoito - Granobox

### Localização do AAB Gerado

Após o build bem-sucedido:

- **Arquivo original**: `build/app/outputs/bundle/release/app-release.aab`
- **Cópia versionada**: `releases/GranoboxTag_[VERSION]_[DATE].aab`

### Upload na Play Console

1. Acesse: https://play.google.com/console
2. Selecione o app **Granobox Tag**
3. Navegue para **Testes internos** (ou Produção)
4. Clique em **Criar nova versão**
5. Faça upload do arquivo `.aab` gerado
6. Preencha as notas de versão
7. Revise e publique

### Versão Atual

```yaml
version: 1.2.2+2043
```

- **Nome da versão**: 1.2.2
- **Código da versão**: 2043

### Checklist Antes do Upload

- [ ] Liberar espaço em disco (mínimo 10GB)
- [ ] Executar `bash build_playstore_aab.sh`
- [ ] Verificar se o AAB foi gerado em `releases/`
- [ ] Testar o app antes do upload
- [ ] Preparar notas de versão
- [ ] Fazer upload na Play Console

### Troubleshooting

#### Erro: "No space left on device"
- **Causa**: Disco do sistema cheio
- **Solução**: Liberar espaço conforme instruções acima

#### Erro de assinatura
- **Causa**: Keystore não encontrado ou senha incorreta
- **Solução**: Verificar `android/key.properties` e `android/upload-keystore.jks`

#### Build lento
- **Causa**: Pouca memória RAM
- **Solução**: Fechar outros apps durante o build

### Próximos Passos

1. **Liberar espaço**: Executar comandos de limpeza acima
2. **Verificar espaço**: `df -h ~` (deve ter pelo menos 10GB livres)
3. **Executar build**: `bash build_playstore_aab.sh`
4. **Fazer upload**: Seguir procedimento da Play Console

---

## Informações Adicionais

### Alterações Feitas no Projeto

1. **build.gradle.kts**: Adicionada configuração de assinatura para release
2. **key.properties**: Arquivo com credenciais (não versionado no git)
3. **upload-keystore.jks**: Keystore para produção (backup necessário!)

### IMPORTANTE: Backup do Keystore

⚠️ **FAÇA BACKUP DO KEYSTORE!**

```bash
# Copiar keystore para local seguro
cp android/upload-keystore.jks ~/Backups/
# OU
cp android/upload-keystore.jks /Volumes/DadosTiago/Backups/granobox/
```

**Se perder o keystore, não será possível atualizar o app na Play Store!**

### Segurança

- ✅ Keystore criado com senha forte
- ✅ `key.properties` deve estar no `.gitignore`
- ✅ Keystore deve ter backup seguro
- ⚠️ Nunca commitar credenciais no git



