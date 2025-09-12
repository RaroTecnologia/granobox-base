# Sistema de Cores - GranoBox Control

## Paleta Restrita

O sistema utiliza apenas **4 cores principais**:

### 🟢 Verde (Primary)
- **Uso**: Cor principal do sistema, ações positivas, sucesso, ativo
- **Classes**: `primary-*`, `text-primary-*`, `bg-primary-*`
- **Exemplos**: Botões principais, links, status ativo, badges de sucesso

### ⚫ Preto/Cinza (Gray)
- **Uso**: Textos, bordas, backgrounds, elementos neutros
- **Classes**: `gray-*`, `text-gray-*`, `bg-gray-*`
- **Exemplos**: Textos, ícones neutros, bordas, backgrounds

### 🟡 Amarelo (Warning)
- **Uso**: APENAS para avisos, atenção, pendências
- **Classes**: `warning-*`, `text-warning-*`, `bg-warning-*`
- **Exemplos**: Status pendente, alertas, notificações importantes

### 🔴 Vermelho (Danger)
- **Uso**: APENAS para exclusões, erros críticos, ações destrutivas
- **Classes**: `danger-*`, `text-danger-*`, `bg-danger-*`
- **Exemplos**: Botões de excluir, erros, status cancelado

## Mapeamento de Status

### Status de Usuários
- **Ativo**: Verde (`primary-500`)
- **Inativo**: Cinza (`gray-500`)
- **Pendente**: Amarelo (`warning-500`)

### Status de Clientes
- **Ativo**: Verde (`primary-500`)
- **Prospect**: Cinza (`gray-500`)
- **Inativo**: Cinza (`gray-600`)
- **Suspenso**: Amarelo (`warning-500`)
- **Cancelado**: Vermelho (`danger-500`)

### Status de Tickets
- **Resolvido**: Verde (`primary-500`)
- **Em Andamento**: Cinza (`gray-500`)
- **Aberto**: Cinza (`gray-600`)
- **Vencido**: Amarelo (`warning-500`)

### Status de Faturas
- **Pago**: Verde (`primary-500`)
- **Enviado**: Cinza (`gray-500`)
- **Rascunho**: Cinza (`gray-400`)
- **Vencido**: Amarelo (`warning-500`)
- **Cancelado**: Vermelho (`danger-500`)

## Ícones e Badges

### Ícones por Contexto
- **Neutros**: `text-gray-500` ou `text-gray-600`
- **Positivos**: `text-primary-500` ou `text-primary-600`
- **Atenção**: `text-warning-500`
- **Críticos**: `text-danger-500`

### Badges e Pills
- **Padrão**: `bg-gray-100 text-gray-800`
- **Ativo/Sucesso**: `bg-primary-100 text-primary-800`
- **Atenção**: `bg-warning-100 text-warning-800`
- **Crítico**: `bg-danger-100 text-danger-800`

## Botões

### Hierarquia
1. **Primário**: `bg-primary-500 hover:bg-primary-600 text-white`
2. **Secundário**: `border-gray-300 text-gray-700 hover:bg-gray-50`
3. **Atenção**: `bg-warning-500 hover:bg-warning-600 text-white`
4. **Destrutivo**: `bg-danger-500 hover:bg-danger-600 text-white`

## Regras de Uso

### ✅ Permitido
- Verde para ações principais e status positivos
- Cinza para elementos neutros e textos
- Amarelo APENAS para avisos e pendências
- Vermelho APENAS para exclusões e erros críticos

### ❌ Proibido
- Azul, roxo, laranja ou qualquer outra cor
- Usar amarelo para decoração
- Usar vermelho para status normais
- Misturar cores não definidas

## Exemplos de Implementação

```tsx
// Status Badge - Correto
<span className="bg-primary-100 text-primary-800">Ativo</span>
<span className="bg-warning-100 text-warning-800">Pendente</span>
<span className="bg-danger-100 text-danger-800">Cancelado</span>

// Ícones - Correto
<UserIcon className="text-gray-500" />
<CheckCircle className="text-primary-500" />
<Warning className="text-warning-500" />
<Trash className="text-danger-500" />

// Botões - Correto
<Button className="bg-primary-500">Salvar</Button>
<Button className="bg-danger-500">Excluir</Button>
<Button variant="outline">Cancelar</Button>
```
