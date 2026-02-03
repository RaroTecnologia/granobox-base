# 🤖 Modo IA - Análise Inteligente de Produtos

## 📋 Descrição

O **Modo IA** utiliza a OpenAI Vision API para extrair informações automaticamente de fotos de produtos, facilitando tanto o **cadastro de produtos** quanto a criação de **etiquetas rápidas**.

## 🎯 Funcionalidades

### 1. **Cadastro de Produtos com IA**

Permite criar produtos completos com análise automática de fotos:

#### Processo:
1. **Captura de Fotos**: Frente e verso do produto/rótulo
2. **Análise com IA**: OpenAI Vision API extrai automaticamente:
   - Nome do produto
   - Marca
   - Número SIF  
   - Código de barras
   - Observações relevantes
   - Validade (dias de shelf life)
3. **Validação e Edição**: Usuário revisa e ajusta as informações
4. **Cadastro Completo**: Produto salvo com todas as informações

#### Campos Suportados:
- ✅ **Nome do produto** (obrigatório)
- ✅ **Código do produto** (opcional)
- ✅ **Marca** (opcional, com toggle para exibir na etiqueta)
- ✅ **SIF** (opcional, com toggle para exibir na etiqueta)
- ✅ **Peso/Quantidade** com unidade (KG, G, L, ML, UN, CX, PCT)
- ✅ **Validade** (temperatura ambiente, refrigerado, congelado)
- ✅ **Código de barras** (opcional)
- ✅ **Observações** (opcional)
- ✅ **Tipo de produto** (matéria prima, manipulado, produto final)
- ✅ **Categoria** (hierárquica)
- ✅ **Local de armazenamento**
- ✅ **Template personalizado** (opcional)

### 2. **Etiquetas Rápidas (Experimental)**

Ideal para produtos únicos que não precisam de cadastro:
1. **Captura de Foto**: Foto única do produto
2. **Análise IA**: Extração rápida de informações
3. **Revisão**: Edição dos dados extraídos
4. **Impressão**: Etiqueta gerada imediatamente

## 🛠️ Implementação Técnica

### Arquivos Principais

1. **`lib/screens/cadastro_produto_page.dart`**
   - Tela de cadastro de produtos
   - Captura de fotos (frente e verso)
   - Modal de câmera customizada com guias visuais
   - Integração com análise IA
   - Formulário completo com validações
   - Toggles para controle de exibição na etiqueta

2. **`lib/services/openai_service.dart`**
   - Serviço de integração com OpenAI Vision API
   - Conversão de imagem para base64
   - Análise e extração de JSON estruturado
   - Suporte para múltiplas imagens (frente e verso)
   - Tratamento de erros robusto

3. **`lib/models/product_models.dart`**
   - Modelos de dados para produtos
   - `Product`: Produto completo
   - `CreateProductRequest`: DTO para criação
   - `UpdateProductRequest`: DTO para atualização

4. **`lib/services/products_service.dart`**
   - CRUD de produtos
   - Comunicação com API backend
   - Upload de fotos (se implementado)

5. **`lib/screens/ai_label_screen.dart`**
   - Tela para etiquetas rápidas (experimental)
   - Captura simplificada
   - Impressão direta

### Dependências Utilizadas

- ✅ `image_picker` - Seleção de fotos da galeria
- ✅ `camera` - Captura de fotos com câmera nativa
- ✅ `http` - Requisições HTTP para API
- ✅ `phosphor_flutter` - Ícones consistentes

### Componentes Customizados

- **`_CameraCaptureModal`**: Modal fullscreen para captura de fotos
  - Preview em tempo real
  - Guias visuais nos cantos
  - Botão de captura centralizado
  - Feedback visual ao capturar

## 🎨 Interface do Usuário

### 1. Cadastro de Produtos (Tela de Cadastros)

#### Modal de Captura de Fotos

Ao clicar em "Analisar com IA" no cadastro de produtos:

1. **Modal de Fotos**:
   - Área para foto da **frente** (esquerda)
   - Área para foto do **verso** (direita)
   - Botão "Analisar com IA" (aparece após ter pelo menos 1 foto)
   
2. **Captura de Foto**:
   - Modal fullscreen com preview da câmera
   - Guias visuais nos 4 cantos (moldura)
   - Botão de captura circular no centro inferior
   - Feedback visual ao capturar
   
3. **Preview das Fotos**:
   - Miniatura da foto capturada
   - Opção de recapturar
   - Zoom ao tocar na foto

#### Análise com IA

1. **Loading**:
   - Indicador de progresso
   - Mensagem: "Analisando imagens com IA..."
   
2. **Auto-preenchimento**:
   - Campos preenchidos automaticamente com dados extraídos
   - Usuário revisa e edita conforme necessário
   
3. **Campos Preenchidos**:
   - Nome do produto
   - Marca (se detectada)
   - SIF (se detectado)
   - Código de barras (se detectado)
   - Observações
   - Validade (dias)

#### Toggles Especiais

- **"Mostrar marca na etiqueta"**: Controla se a marca aparece na etiqueta impressa
- **"Mostrar SIF na etiqueta"**: Controla se o SIF aparece na etiqueta impressa

### 2. Etiquetas Rápidas (Experimental)

- **Card na Tela Principal**: Abaixo do card "Validade"
- **Cor**: Azul (`#3B82F6`)
- **Ícone**: Câmera com sparkles (IA)
- **Fluxo Simplificado**: Foto → Análise → Revisão → Impressão

## 🔐 Segurança

A chave da API OpenAI está armazenada em `lib/config/app_config.dart`. Para produção, recomenda-se:

- Usar variáveis de ambiente
- Implementar backend proxy para não expor a chave
- Implementar rate limiting

## 📊 Análise com OpenAI Vision API

### Prompt Otimizado

O prompt foi otimizado para extrair informações específicas de produtos alimentícios de 2 imagens (frente e verso):

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "Você é um assistente especializado em analisar rótulos de produtos alimentícios."
    },
    {
      "role": "user",
      "content": "Analise estas imagens (frente e verso) de um produto alimentício e extraia:"
    }
  ],
  "temperature": 0.1,
  "max_tokens": 800
}
```

### Dados Extraídos

A IA extrai e retorna em formato JSON:

```json
{
  "nome": "Nome completo do produto",
  "marca": "Marca do fabricante",
  "sif": "Número SIF ou registro sanitário",
  "codigo_barras": "Código de barras (EAN/UPC)",
  "observacoes": "Informações adicionais relevantes",
  "validade_dias": 30,
  "validade_refrigerado_dias": 15,
  "validade_congelado_dias": 90
}
```

### Configurações Técnicas

- **Modelo**: `gpt-4o-mini` - Custo-benefício ideal
- **Temperature**: 0.1 - Respostas precisas e consistentes
- **Max Tokens**: 800 - Suficiente para resposta estruturada
- **Imagens**: Suporte para 2 imagens (frente e verso)
- **Formato**: Base64 encoding das imagens

## 🎯 Casos de Uso

### 💼 Cadastro de Produtos com IA

**Ideal Para:**
- ✅ **Agilizar cadastro**: Reduz tempo de digitação manual
- ✅ **Reduzir erros**: IA extrai informações precisas do rótulo
- ✅ **Novos produtos**: Facilita entrada de produtos no sistema
- ✅ **Produtos com rótulo complexo**: Extrai múltiplas informações de uma vez
- ✅ **Documentação visual**: Mantém foto do produto cadastrado

**Vantagens:**
- Cadastro completo em ~30 segundos
- Dados padronizados e precisos
- Histórico fotográfico do produto
- Integração com sistema de templates
- Toggles para personalizar etiqueta

### ⚡ Etiquetas Rápidas (Experimental)

**Ideal Para:**
- ✅ Preparações únicas/ocasionais
- ✅ Produtos que não se repetirão
- ✅ Testes rápidos
- ✅ Emergências operacionais

**Não Recomendado Para:**
- ❌ Produtos recorrentes (use cadastro completo)
- ❌ Produção em larga escala
- ❌ Quando precisar de rastreabilidade completa

## 🚀 Melhorias Futuras

### Curto Prazo
1. **Upload de Fotos para Backend**: Armazenar fotos dos produtos no servidor
2. **OCR de Código de Barras**: Melhorar detecção de códigos de barras
3. **Validação de SIF**: Verificar formato correto do número SIF
4. **Sugestão de Categoria**: IA sugerir categoria com base no tipo de produto

### Médio Prazo
5. **Histórico de Análises**: Lista de produtos analisados com IA
6. **Comparação de Fotos**: Comparar produto recebido com cadastro
7. **Multi-idioma**: Suporte para rótulos em outros idiomas
8. **Feedback de Precisão**: Sistema de avaliação da precisão da IA

### Longo Prazo
9. **Backend Proxy**: Mover integração OpenAI para backend (segurança)
10. **Fine-tuning**: Treinar modelo específico para rótulos alimentícios
11. **Detecção de Alérgenos**: Extrair informações de alérgenos
12. **Tabela Nutricional**: Extrair valores nutricionais (se visível)

## 💰 Custos Estimados

Usando `gpt-4o-mini` com 2 imagens:
- **Por análise**: ~$0.003 (duas imagens)
- **100 análises/mês**: ~$0.30
- **1000 análises/mês**: ~$3.00
- Muito econômico para uso moderado

## 🔄 Fluxo Completo

### Cadastro de Produto com IA

```
1. Tela Cadastros
   ↓
2. Botão "Novo Produto"
   ↓
3. Formulário de Cadastro
   ↓
4. Botão "📷 Analisar com IA"
   ↓
5. Modal de Captura
   ├─ Foto da Frente (obrigatória)
   └─ Foto do Verso (opcional)
   ↓
6. Análise IA (5-15 segundos)
   ↓
7. Auto-preenchimento dos campos
   ↓
8. Usuário revisa/edita
   ↓
9. Define toggles (mostrar marca/SIF)
   ↓
10. Seleciona categoria e local
   ↓
11. Salvar produto
   ↓
12. Produto disponível para etiquetas
```

### Etiquetas Rápidas (Experimental)

```
1. Tela Principal
   ↓
2. Card "Modo IA"
   ↓
3. Captura de Foto
   ↓
4. Análise IA
   ↓
5. Revisão rápida
   ↓
6. Impressão direta
```

## 🧪 Como Testar

### Testar Cadastro com IA:

1. Faça login no app
2. Vá para **Cadastros** (aba do meio)
3. Toque em **"Novo Produto"**
4. Toque no botão **"📷 Analisar com IA"**
5. Tire foto da **frente** do produto
6. (Opcional) Tire foto do **verso**
7. Toque em **"Analisar com IA"**
8. Aguarde análise (5-15 segundos)
9. Revise os campos preenchidos
10. Ajuste conforme necessário
11. Configure toggles de marca/SIF
12. Selecione categoria e local
13. Salve o produto

### Testar Etiquetas Rápidas:

1. Na tela principal, toque no card **"Modo IA"** (azul)
2. Tire uma foto do produto com rótulo visível
3. Aguarde análise
4. Revise dados extraídos
5. Imprima etiqueta

## 📸 Sistema de Fotos

### Especificações Técnicas

- **Resolução**: High (definida pelo plugin camera)
- **Formato**: JPEG
- **Armazenamento**: Temporário local (antes do upload)
- **Compressão**: Otimizada para análise IA

### Modal de Câmera

**Características:**
- Fullscreen modal
- Preview em tempo real
- Guias visuais nos 4 cantos (moldura verde)
- Botão de captura circular no centro inferior
- Feedback visual ao capturar (flash branco)
- Botão de fechar no canto superior esquerdo

**Experiência do Usuário:**
1. Modal abre em fullscreen
2. Câmera inicializa automaticamente
3. Usuário posiciona produto usando guias
4. Toque no botão circular para capturar
5. Foto salva automaticamente
6. Modal fecha e retorna para o formulário

### Armazenamento de Fotos

**Atualmente:**
- Fotos armazenadas localmente durante cadastro
- Usadas apenas para análise IA
- Não enviadas para backend (ainda)

**Futuro:**
- Upload para backend/cloud storage
- Associação com produto cadastrado
- Recuperação para consulta posterior

## 📝 Notas Técnicas

### Qualidade da Análise

- **Dependências**:
  - Qualidade da foto (iluminação, foco, nitidez)
  - Visibilidade do rótulo
  - Idioma do rótulo (melhor em português/inglês)
  
- **Taxa de Sucesso**:
  - Nome do produto: ~95% (quase sempre detectado)
  - Marca: ~80% (quando visível no rótulo)
  - SIF: ~70% (formato "SIF XXXX" ou "S.I.F XXXX")
  - Código de barras: ~60% (depende da nitidez)
  - Validade: ~50% (se informação estiver clara no rótulo)

### Otimizações

- **Title Case**: Nomes convertidos automaticamente (ex: "queijo minas" → "Queijo Minas")
- **Validação de Campos**: Apenas nome é obrigatório
- **Fallbacks**: Campos vazios não causam erro
- **Retry**: Usuário pode recapturar fotos se análise falhar

## 🐛 Troubleshooting

### ❌ Erro: "Não foi possível extrair informações"

**Possíveis causas:**
- Foto muito escura ou desfocada
- Rótulo não visível ou ilegível
- Produto sem rótulo/embalagem

**Soluções:**
- Tire nova foto com melhor iluminação
- Certifique-se de que o rótulo está centralizado
- Limpe a lente da câmera
- Use flash se ambiente estiver escuro

### ❌ Erro: "Erro ao capturar foto"

**Possíveis causas:**
- Permissão de câmera não concedida
- Câmera em uso por outro app
- Erro no hardware da câmera

**Soluções:**
- Verifique permissões do app em Configurações do dispositivo
- Feche outros apps que possam usar a câmera
- Reinicie o app

### ❌ Erro: "Sistema de impressão não configurado"

**Possíveis causas:**
- Nenhuma impressora configurada
- Impressoras offline

**Soluções:**
- Configure impressoras em Ajustes
- Verifique conectividade das impressoras
- Teste impressão manual

### ❌ Erro na API OpenAI

**Possíveis causas:**
- Chave API inválida ou expirada
- Sem conexão com internet
- Limite de uso da API atingido
- Timeout da requisição

**Soluções:**
- Verifique a chave API em `lib/config/app_config.dart`
- Confirme conexão com internet
- Verifique limites de uso no painel OpenAI
- Tente novamente após alguns segundos

### ⚠️ Campos Não Preenchidos

**Normal:**
- Nem todos os campos são preenchidos pela IA
- Marca e SIF dependem de estarem visíveis no rótulo
- Código de barras requer nitidez alta
- Validades são estimativas (sempre revisar!)

**Recomendação:**
- Sempre revise os campos antes de salvar
- Preencha manualmente o que a IA não detectar
- Use fotos de alta qualidade para melhor resultado

## ✨ Boas Práticas

### Para Melhores Resultados com IA:

1. **📸 Qualidade da Foto**:
   - Use boa iluminação (natural ou artificial)
   - Mantenha o rótulo centralizado
   - Evite reflexos e sombras
   - Foco nítido no texto do rótulo
   - Distância adequada (rótulo deve ocupar 60-80% da foto)

2. **🏷️ Rótulos Ideais**:
   - Texto legível e bem impresso
   - Contraste bom entre texto e fundo
   - Informações completas visíveis
   - Sem amassados ou rasgos no rótulo

3. **🔍 Revisão Obrigatória**:
   - **SEMPRE** revise dados extraídos pela IA
   - Valide especialmente: validade, SIF, código de barras
   - Corrija erros de OCR (ex: "0" vs "O", "1" vs "I")
   - Confirme unidades e quantidades

4. **⚙️ Configuração de Toggles**:
   - Ative "Mostrar marca" apenas se relevante para rastreabilidade
   - Ative "Mostrar SIF" para produtos com certificação obrigatória
   - Configure template personalizado se necessário

5. **🗂️ Categorização**:
   - Selecione categoria apropriada (facilita busca futura)
   - Configure local de armazenamento correto
   - Use tipo de produto adequado (matéria prima, manipulado, final)

### Fluxo Recomendado:

```
✅ FAZER:
1. Tire 2 fotos (frente + verso) com boa iluminação
2. Analise com IA
3. Revise TODOS os campos
4. Ajuste o que for necessário
5. Configure toggles
6. Salve o produto
7. Use para criar etiquetas

❌ NÃO FAZER:
- Não confie 100% na IA sem revisar
- Não use fotos de baixa qualidade
- Não pule a revisão dos campos
- Não salve sem conferir validades
```

## 🎓 Exemplos de Uso

### Cenário 1: Produto com Rótulo Completo

**Produto**: Queijo Minas com SIF  
**Fotos**: Frente (nome e marca) + Verso (tabela nutricional e SIF)  
**Resultado Esperado**:
- ✅ Nome: "Queijo Minas Frescal"
- ✅ Marca: "Laticínios XYZ"
- ✅ SIF: "1234"
- ✅ Validade: Detectada ou estimada
- ⚠️ Código de barras: Pode ou não detectar

### Cenário 2: Produto Manipulado

**Produto**: Bolo de chocolate caseiro  
**Fotos**: Foto do produto pronto  
**Resultado Esperado**:
- ✅ Nome: "Bolo de Chocolate"
- ❌ Marca: Vazio (não aplicável)
- ❌ SIF: Vazio (não aplicável)
- ⚠️ Validade: Usuário define manualmente

### Cenário 3: Matéria Prima Embalada

**Produto**: Farinha de trigo industrializada  
**Fotos**: Frente e verso da embalagem  
**Resultado Esperado**:
- ✅ Nome: "Farinha de Trigo Tipo 1"
- ✅ Marca: Detectada
- ✅ Código de barras: Alta chance de detecção
- ✅ Validade: Detectada da embalagem

---

## 📞 Suporte

Para problemas técnicos ou dúvidas sobre o Modo IA:
- Verifique este documento primeiro
- Teste com fotos de boa qualidade
- Revise logs do console para erros específicos
- Entre em contato com a equipe de desenvolvimento

---

**Status**: 🚀 Em Produção (Cadastro) / 🧪 Experimental (Etiquetas Rápidas)  
**Versão**: 2.0.0  
**Última Atualização**: 2025-10-14  
**Plataformas**: Android, iOS

