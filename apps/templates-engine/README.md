# Granobox Templates Engine (v2)

Serviço de processamento de templates do Granobox v2. Responsável por:

- Processar templates **etiqueta_validade** (ZPL puro com variáveis)
- Processar templates **rotulo_studio** (PNG → ZPL)
- Cache de templates processados
- Processamento de imagens (Sharp)

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/templates/process` | Processar template e retornar ZPL |
| POST | `/templates/studio/render` | Renderizar template Studio (imagem → ZPL) |
| GET | `/templates/:id` | Obter informações de um template |
| GET | `/health` | Health check |

## Uso

A **API principal** chama este serviço ao processar impressões:

1. API recebe `POST /v1.5/print-label` com `templateId` e dados
2. API carrega o template (DB) e envia para o engine com `POST /templates/process` incluindo o campo `zpl` com o conteúdo do template
3. Templates Engine substitui variáveis e retorna ZPL
4. API envia o ZPL para o ws-service

### Processar template (etiqueta_validade)

Envie o ZPL no body quando o engine não tiver armazenamento de templates:

```json
POST /templates/process
{
  "templateId": "uuid-do-template",
  "type": "etiqueta_validade",
  "data": {
    "produto": "Produto X",
    "codigo": "ABC123",
    "dataValidade": "30/12/2025"
  },
  "zpl": "^XA^FO10,10^A0N,50,50^FD{{ produto }}^FS^XZ"
}
```

Variáveis no ZPL: `{{ nome }}` ou `${ nome }`.

### Studio (rotulo_studio)

```json
POST /templates/studio/render
{
  "templateId": "studio-123",
  "data": { "produto": "Nome" },
  "imageBase64": "data:image/png;base64,..."
}
```

## Variáveis de ambiente

- `PORT` (default: 3002)
- `API_URL` – origem permitida no CORS
- `CACHE_ENABLED` (default: true)
- `CACHE_MAX_SIZE` (default: 100)

## Desenvolvimento

```bash
cd apps/templates-engine
npm install --legacy-peer-deps
npm run start:dev
```

Documentação Swagger: http://localhost:3002/api/docs

## Docker

Build a partir da pasta do serviço:

```bash
docker build -t granobox-templates .
docker run -p 3002:3002 -e API_URL=http://host.docker.internal:3000 granobox-templates
```
