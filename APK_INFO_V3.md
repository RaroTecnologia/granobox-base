# Granobox Mobile - APK v3

## Informações do Arquivo
- **Nome do arquivo:** `GranoboxMobile_v3.apk`
- **Tamanho:** ~15MB
- **Data de geração:** 04/08/2024
- **Versão:** v3.0

## Novas Funcionalidades Implementadas

### ✅ Botão "+" na Aba Produção
- **Localização:** Aba "Produção" - botão flutuante azul no canto inferior direito
- **Funcionalidade:** Permite criar novos planos de produção
- **Interface:** Tela completa com formulário para seleção de receita, quantidade, data e observações

### ✅ Tela de Criação de Plano de Produção
- **Seleção de Receita:** Lista todas as receitas disponíveis com categoria
- **Quantidade:** Campo numérico com unidade de rendimento da receita
- **Data de Produção:** Campo de data no formato AAAA-MM-DD
- **Observações:** Campo opcional para observações adicionais
- **Validações:** Campos obrigatórios validados antes do envio

### ✅ Endpoint de Receitas
- **URL:** `/api/mobile/receitas`
- **Método GET:** Lista todas as receitas da organização
- **Método POST:** Cria nova receita (funcionalidade adicional)
- **Campos retornados:** id, nome, categoria, unidadeRendimento, descricao, createdAt, usuario

### ✅ Melhorias no Schema
- **Campo adicionado:** `unidadeRendimento` na tabela `receitas`
- **Valor padrão:** "unidades"
- **Migration:** Aplicada automaticamente

## Como Usar

### 1. Criar Novo Plano de Produção
1. Abra o app e vá para a aba "Produção"
2. Toque no botão "+" (azul) no canto inferior direito
3. Selecione uma receita da lista
4. Digite a quantidade desejada
5. Confirme a data de produção (padrão: hoje)
6. Adicione observações se necessário
7. Toque em "Criar Plano"

### 2. Visualizar Planos Criados
- Os planos criados aparecem na lista principal da aba "Produção"
- Toque em um plano para ver detalhes e imprimir
- Status dos planos: Pendente, Em Produção, Concluído, Cancelado

## Estrutura do App

### Telas Principais
- **Produção:** Lista de planos + botão "+" para criar
- **Receitas:** Listagem de receitas disponíveis
- **Manipulados:** Gestão de produtos manipulados
- **Configurações:** Acesso às configurações e impressora

### Navegação
- **Header:** Botão "Configurações" (⚙️) ao lado do nome do usuário
- **Tabs:** Produção, Receitas, Manipulados, Configurações
- **Botão +:** Apenas na aba Produção

## Funcionalidades Anteriores Mantidas
- ✅ Configuração de impressora Bluetooth
- ✅ Testes específicos para Nimbot
- ✅ Listagem de receitas
- ✅ Sistema de autenticação
- ✅ Modo offline
- ✅ Indicadores de rede

## Instalação
1. Transfira o arquivo `GranoboxMobile_v3.apk` para seu dispositivo
2. Ative "Fontes desconhecidas" nas configurações do Android
3. Instale o APK
4. Faça login com suas credenciais

## Testes Recomendados
1. **Criar plano:** Teste criar um novo plano de produção
2. **Seleção de receita:** Verifique se as receitas aparecem corretamente
3. **Validações:** Teste campos obrigatórios
4. **Impressora:** Teste a impressão após criar um plano
5. **Navegação:** Verifique se a navegação entre telas funciona

## Próximos Passos Sugeridos
- Implementar edição de planos existentes
- Adicionar filtros por status/data
- Implementar busca nas receitas
- Adicionar mais validações de data
- Implementar histórico de planos criados

---
**Desenvolvido para Granobox - Sistema de Gestão para Micro Padarias** 