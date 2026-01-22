# 📊 Estratégia de Produtos Edge - Granobox

## 🎯 Visão Geral

Três ofertas de dispositivos edge para diferentes necessidades e orçamentos.

---

## 📦 Comparativo de Produtos

| Característica | Edge-Go (ESP32) | Edge-Pi (Tagment) | Edge-Pro (Granobox) |
|----------------|----------------|-------------------|---------------------|
| **Hardware** | ESP32-S3 | Raspberry Pi | Raspberry Pi |
| **Preço** | ~R$ 150 | ~R$ 400 | ~R$ 400 |
| **Conexão** | TCP Direto | WebSocket Tagment | WebSocket Granobox |
| **Internet** | WiFi | WiFi/LAN | WiFi/LAN |
| **Backend** | Sem backend | Tagment API | Granobox API |
| **Templates** | ZPL pronto | Tagment (online) | Tagment (online) |
| **Configuração** | BLE via App | Manual | Manual |
| **Display** | LED RGB | Display RGB | Display RGB |
| **Multi-impressora** | 1 impressora | Múltiplas | 1 impressora |
| **Modo Offline** | ❌ | ❌ | ⏳ (futuro) |
| **Gestão Web** | ❌ | Tagment Dashboard | Granobox Dashboard |
| **Público-alvo** | Pequeno negócio | Empresas (SaaS) | Clientes Granobox |

---

## 🎯 Quando Usar Cada Um

### Edge-Go (ESP32) - **Entrada**

**Ideal para:**
- ✅ Pequenos negócios
- ✅ Orçamento limitado
- ✅ 1 impressora apenas
- ✅ Uso direto sem backend
- ✅ Setup rápido via BLE

**Casos de uso:**
- Restaurante pequeno
- Loja de bairro
- Food truck
- Açougue local

**Vantagens:**
- 💰 Baixo custo
- 🔌 Baixo consumo
- 📱 Configuração via app
- 🚀 Setup em 5 minutos

**Limitações:**
- ❌ Apenas TCP direto (sem backend)
- ❌ Sem histórico/analytics
- ❌ ZPL deve vir pronto do app
- ❌ Uma impressora apenas

---

### Edge-Pi (Tagment) - **Premium SaaS**

**Ideal para:**
- ✅ Empresas que usam Tagment
- ✅ Precisa de múltiplas impressoras
- ✅ Gestão centralizada
- ✅ Analytics e relatórios
- ✅ Multi-tenant

**Casos de uso:**
- Software house vendendo SaaS
- Marketplace de etiquetas
- Plataforma de rastreabilidade
- Sistema de gestão integrado

**Vantagens:**
- 🌐 Backend completo (Tagment)
- 📊 Dashboard web
- 🖨️ Múltiplas impressoras
- 👥 Multi-tenant
- 📈 Analytics
- 🔐 Gestão de usuários

**Limitações:**
- 💰 Custo de hardware + assinatura Tagment
- 🔧 Setup mais complexo
- 🌐 Requer internet sempre

---

### Edge-Pro (Granobox) - **Ecossistema Granobox**

**Ideal para:**
- ✅ Clientes do Granobox
- ✅ Frigoríficos
- ✅ Indústria alimentícia
- ✅ Rastreabilidade completa
- ✅ Integração com ERP

**Casos de uso:**
- Frigorífico com SIF
- Indústria de embalados
- Central de distribuição
- Atacado de carnes

**Vantagens:**
- 🏭 Integração total com Granobox
- 📋 Templates gerenciados (Tagment)
- 📊 Dashboard Granobox
- 🔄 Sincronização com ERP
- 📈 Rastreabilidade SIF
- ⏳ Modo offline (futuro)

**Limitações:**
- 🔐 Exclusivo para clientes Granobox
- 🌐 Requer backend Granobox
- 💰 Hardware + mensalidade

---

## 🛒 Estratégia Comercial

### Edge-Go: **Porta de Entrada**

```
Preço: R$ 150-200 (hardware)
      + R$ 0 (sem mensalidade)
─────────────────────────────
Total: R$ 150-200 uma vez
```

**Posicionamento:**
- "Impressão de etiquetas simples e barata"
- "Conecte sua impressora em 5 minutos"
- "Sem mensalidade, sem complicação"

**Upgrade path:**
- Cliente cresce → migra para Edge-Pro
- Precisa de mais features → Edge-Pro

---

### Edge-Pi: **B2B SaaS**

```
Preço: R$ 400 (hardware)
      + R$ 99-299/mês (Tagment SaaS)
─────────────────────────────
Total: R$ 400 + mensalidade
```

**Posicionamento:**
- "Plataforma completa de etiquetas"
- "Para software houses e integradores"
- "White-label disponível"
- "API completa"

**Target:**
- Software houses
- Integradores
- Empresas de TI
- Consultorias

---

### Edge-Pro: **Exclusivo Granobox**

```
Preço: R$ 400 (hardware)
      + Incluído na mensalidade Granobox
─────────────────────────────
Total: R$ 400 (sem custo adicional para clientes)
```

**Posicionamento:**
- "Rastreabilidade completa para frigoríficos"
- "Integrado ao seu ERP"
- "SIF, MAPA, rastreabilidade"
- "Suporte especializado"

**Target:**
- Clientes atuais Granobox
- Frigoríficos
- Indústrias alimentícias
- Distribuidores

---

## 🚀 Roadmap

### Q1 2025

- [x] Edge-Go em produção ✅
- [ ] Edge-Pro v1.0 (online)
- [ ] Integração Granobox completa

### Q2 2025

- [ ] Edge-Pro modo offline
- [ ] Edge-Pro múltiplas impressoras
- [ ] Dashboard web Edge-Pro

### Q3 2025

- [ ] Edge-Go v2 (melhorias)
- [ ] Edge-Pro configuração via BLE
- [ ] OTA updates todos os produtos

### Q4 2025

- [ ] Edge-Pro Premium (features avançadas)
- [ ] Marketplace de templates
- [ ] Certificações (INMETRO, ANATEL)

---

## 📊 Matriz de Decisão

### Para o Cliente

```
Preciso de backend? ─── NÃO ──► Edge-Go
        │
       SIM
        │
        ▼
É cliente Granobox? ─── SIM ──► Edge-Pro
        │
       NÃO
        │
        ▼
Precisa de SaaS? ───── SIM ──► Edge-Pi
```

### Para a Equipe de Vendas

**Edge-Go:**
- Ticket médio: Baixo
- Volume: Alto
- Suporte: Mínimo
- Upgrade: Médio

**Edge-Pi:**
- Ticket médio: Alto
- Volume: Médio
- Suporte: Alto
- Recorrência: 100%

**Edge-Pro:**
- Ticket médio: Incluído
- Volume: Baixo (clientes atuais)
- Suporte: Alto
- Retenção: Muito alta

---

## 🎯 Objetivos 2025

### Edge-Go
- 1.000 unidades vendidas
- R$ 150k revenue
- 80% satisfação

### Edge-Pi (Tagment)
- 100 clientes SaaS
- R$ 300k MRR
- 5 integradores

### Edge-Pro (Granobox)
- 50 instalações
- 100% clientes Granobox usando
- NPS > 9

---

## 🔧 Considerações Técnicas

### Manutenção

| Produto | Complexidade | Atualizações | Suporte |
|---------|-------------|--------------|---------|
| Edge-Go | Baixa | Firmware OTA | Básico |
| Edge-Pi | Alta | Software updates | Avançado |
| Edge-Pro | Média | Software updates | Especializado |

### Escalabilidade

- **Edge-Go**: Produção em massa, baixo custo
- **Edge-Pi**: Cloud-first, multi-tenant
- **Edge-Pro**: Integração profunda, customização

---

## ✅ Próximos Passos

1. **Finalizar Edge-Pro v1.0** (online)
   - 2-3 semanas
   - Deploy em cliente piloto
   
2. **Documentação completa**
   - Guia de instalação
   - Troubleshooting
   - Vídeos tutoriais
   
3. **Treinamento equipe**
   - Vendas
   - Suporte
   - Implementação

4. **Marketing**
   - Landing pages
   - Material comercial
   - Cases de sucesso

---

**Estratégia clara, produtos diferenciados, mercado coberto! 🚀**


