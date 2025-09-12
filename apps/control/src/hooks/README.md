# Hooks Personalizados

## useCep

Hook para busca automática de endereço por CEP usando a API ViaCEP.

### Funcionalidades

- ✅ Busca automática quando CEP tem 8 dígitos
- ✅ Loading state durante a busca
- ✅ Tratamento de erros (CEP inválido, não encontrado, etc.)
- ✅ Validação de formato do CEP
- ✅ Limpeza de dados

### Exemplo de Uso

```tsx
import { useCep } from '../hooks/useCep';

function AddressForm() {
  const { addressData, isLoading, error, searchCep } = useCep();
  const [cep, setCep] = useState('');

  const handleCepChange = async (value: string) => {
    setCep(value);
    
    // Busca automática quando CEP tem 8 dígitos
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      await searchCep(cleanCep);
    }
  };

  // Preenche campos automaticamente quando endereço é encontrado
  useEffect(() => {
    if (addressData) {
      setStreet(addressData.street);
      setNeighborhood(addressData.neighborhood);
      setCity(addressData.city);
      setState(addressData.state);
    }
  }, [addressData]);

  return (
    <div>
      <input
        value={cep}
        onChange={(e) => handleCepChange(e.target.value)}
        placeholder="00000-000"
        disabled={isLoading}
      />
      {isLoading && <span>Buscando...</span>}
      {error && <span className="error">{error}</span>}
      
      {/* Outros campos de endereço */}
    </div>
  );
}
```

### API do Hook

```tsx
interface UseCepReturn {
  /** Dados do endereço encontrado */
  addressData: AddressData | null;
  /** Estado de loading durante a busca */
  isLoading: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** Função para buscar o CEP */
  searchCep: (cep: string) => Promise<void>;
  /** Função para limpar os dados */
  clearData: () => void;
  /** Função para validar formato do CEP */
  isValidCep: (cep: string) => boolean;
}
```

### Tratamento de Erros

O hook trata automaticamente os seguintes erros:

- CEP com formato inválido (não tem 8 dígitos)
- CEP não encontrado na base dos Correios
- Erro de rede/conexão
- Timeout da API

### Performance

- Usa `useCallback` para evitar re-renders desnecessários
- Cancela requisições anteriores automaticamente
- Cache interno do navegador para CEPs já consultados
