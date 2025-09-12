import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useCep } from '../../hooks/useCep';
import type { CreateClientForm } from '../../types';

interface ClientFormProps {
  // Props para modal (opcional)
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  
  // Props para página
  onSubmit: (data: CreateClientForm) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateClientForm>;
  showActions?: boolean;
  isLoading?: boolean;
}

export function ClientForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onCancel, 
  initialData, 
  title = 'Novo Cliente',
  showActions = false,
  isLoading = false
}: ClientFormProps) {
  const [formData, setFormData] = useState<CreateClientForm>({
    clientType: initialData?.clientType || 'business',
    name: initialData?.name || '',
    document: initialData?.document || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    whatsapp: initialData?.whatsapp || '',
    legalName: initialData?.legalName || '',
    businessType: initialData?.businessType || 'restaurant',
    monthlyFee: initialData?.monthlyFee || 0,
    setupFee: initialData?.setupFee || 0,
    paymentTerms: initialData?.paymentTerms || 30,
    contractType: initialData?.contractType || 'monthly',
    address: {
      street: initialData?.address?.street || '',
      number: initialData?.address?.number || '',
      complement: initialData?.address?.complement || '',
      neighborhood: initialData?.address?.neighborhood || '',
      city: initialData?.address?.city || '',
      state: initialData?.address?.state || '',
      zipCode: initialData?.address?.zipCode || '',
      country: initialData?.address?.country || 'Brasil',
    },
    primaryContact: initialData?.primaryContact ? {
      name: initialData.primaryContact.name || '',
      role: initialData.primaryContact.role || '',
      email: initialData.primaryContact.email || '',
      phone: initialData.primaryContact.phone || '',
    } : undefined,
    assignedSalesperson: initialData?.assignedSalesperson || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Hook para busca de CEP
  const { addressData, isLoading: isLoadingCep, error: cepError, searchCep } = useCep();

  // Preenche automaticamente os campos quando o endereço é encontrado
  useEffect(() => {
    if (addressData) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          street: addressData.street,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
        },
      }));
      
      // Remove erros de endereço se os campos foram preenchidos
      setErrors(prev => {
        const newErrors = { ...prev };
        if (addressData.street) delete newErrors['address.street'];
        if (addressData.neighborhood) delete newErrors['address.neighborhood'];
        if (addressData.city) delete newErrors['address.city'];
        if (addressData.state) delete newErrors['address.state'];
        return newErrors;
      });
    }
  }, [addressData]);

  const handleChange = (field: string, value: string | number) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else if (field.startsWith('primaryContact.')) {
      const contactField = field.replace('primaryContact.', '');
      setFormData(prev => ({
        ...prev,
        primaryContact: {
          name: prev.primaryContact?.name || '',
          role: prev.primaryContact?.role || '',
          email: prev.primaryContact?.email || '',
          phone: prev.primaryContact?.phone || '',
          [contactField]: value,
        },
      }));
    } else if (field === 'clientType') {
      // Quando mudar o tipo de cliente, inicializar/limpar campos específicos
      const clientType = value as 'individual' | 'business';
      setFormData(prev => ({
        ...prev,
        clientType,
        // Se mudou para PJ e não tem contato principal, inicializar
        primaryContact: clientType === 'business' && !prev.primaryContact ? {
          name: '',
          role: '',
          email: '',
          phone: '',
        } : prev.primaryContact,
        // Limpar campos específicos de PJ se mudou para PF
        legalName: clientType === 'individual' ? '' : prev.legalName,
        businessType: clientType === 'individual' ? undefined : (prev.businessType || 'restaurant'),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const isPJ = formData.clientType === 'business';

    // Nome (obrigatório para ambos)
    if (!formData.name.trim()) {
      newErrors.name = isPJ ? 'Razão social é obrigatória' : 'Nome completo é obrigatório';
    }

    // Documento
    if (!formData.document.trim()) {
      newErrors.document = isPJ ? 'CNPJ é obrigatório' : 'CPF é obrigatório';
    } else {
      const cleanDoc = formData.document.replace(/\D/g, '');
      if (isPJ && cleanDoc.length !== 14) {
        newErrors.document = 'CNPJ deve ter 14 dígitos';
      } else if (!isPJ && cleanDoc.length !== 11) {
        newErrors.document = 'CPF deve ter 11 dígitos';
      }
    }

    // Email e telefone (obrigatórios para ambos)
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && formData.phone.trim() && !/^[\d\s\(\)\-\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    // Contato principal (obrigatório apenas para PJ)
    if (isPJ) {
      if (!formData.primaryContact?.name?.trim()) {
        newErrors['primaryContact.name'] = 'Nome do contato é obrigatório';
      }

      if (!formData.primaryContact?.role?.trim()) {
        newErrors['primaryContact.role'] = 'Cargo do contato é obrigatório';
      }
    }

    // Valor mensal
    if (formData.monthlyFee && formData.monthlyFee < 0) {
      newErrors.monthlyFee = 'Valor mensal não pode ser negativo';
    }

    // Validações de endereço (obrigatórios)
    if (!formData.address?.zipCode?.trim()) {
      newErrors['address.zipCode'] = 'CEP é obrigatório';
    } else if (!/^\d{8}$/.test(formData.address.zipCode.replace(/\D/g, ''))) {
      newErrors['address.zipCode'] = 'CEP deve ter 8 dígitos';
    }

    if (!formData.address?.street?.trim()) {
      newErrors['address.street'] = 'Rua é obrigatória';
    }

    if (!formData.address?.number?.trim()) {
      newErrors['address.number'] = 'Número é obrigatório';
    }

    if (!formData.address?.neighborhood?.trim()) {
      newErrors['address.neighborhood'] = 'Bairro é obrigatório';
    }

    if (!formData.address?.city?.trim()) {
      newErrors['address.city'] = 'Cidade é obrigatória';
    }

    if (!formData.address?.state?.trim()) {
      newErrors['address.state'] = 'Estado é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Remover campos de endereço vazios
      const cleanedData: CreateClientForm = {
        ...formData,
        address: formData.address?.street ? formData.address : undefined,
      };
      
      onSubmit(cleanedData);
      
      // Se for modal, fechar
      if (onClose) {
        onClose();
      }
    }
  };

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const isPJ = formData.clientType === 'business';
    
    if (isPJ) {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 10) {
      // (00) 0000-0000
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      // (00) 00000-0000
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Função especial para lidar com mudança do CEP
  const handleCepChange = async (value: string) => {
    const formattedCep = formatZipCode(value);
    handleChange('address.zipCode', formattedCep);
    
    // Se o CEP tem 8 dígitos, busca automaticamente
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      await searchCep(cleanCep);
    }
  };

  // Se for modal e não estiver aberto, não renderizar
  if (isOpen === false) return null;

  // Renderizar como modal
  if (isOpen === true) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X size={16} />
              </Button>
            </CardHeader>

            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Cliente */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo de Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Cliente *
                    </label>
                    <select
                      value={formData.clientType}
                      onChange={(e) => handleChange('clientType', e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="individual">Pessoa Física (CPF)</option>
                      <option value="business">Pessoa Jurídica (CNPJ)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dados Pessoais */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.clientType === 'individual' ? 'Nome Completo *' : 'Razão Social *'}
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder={formData.clientType === 'individual' ? 'Digite o nome completo' : 'Digite a razão social'}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Fantasia
                    </label>
                    <Input
                      value={formData.legalName || ''}
                      onChange={(e) => handleChange('legalName', e.target.value)}
                      placeholder={formData.clientType === 'individual' ? 'Nome comercial (opcional)' : 'Nome fantasia (opcional)'}
                      className={errors.legalName ? 'border-red-500' : ''}
                    />
                    {errors.legalName && (
                      <p className="text-red-500 text-sm mt-1">{errors.legalName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.clientType === 'individual' ? 'CPF *' : 'CNPJ *'}
                    </label>
                    <Input
                      value={formData.document}
                      onChange={(e) => handleChange('document', formatDocument(e.target.value))}
                      placeholder={formData.clientType === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'}
                      maxLength={18}
                      className={errors.document ? 'border-red-500' : ''}
                    />
                    {errors.document && (
                      <p className="text-red-500 text-sm mt-1">{errors.document}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@exemplo.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000 (opcional)"
                      maxLength={15}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.whatsapp || ''}
                        onChange={(e) => handleChange('whatsapp', formatPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className={errors.whatsapp ? 'border-red-500' : ''}
                      />
                      {formData.phone && !formData.whatsapp && (
                        <button
                          type="button"
                          onClick={() => handleChange('whatsapp', formData.phone || '')}
                          className="px-3 py-2 text-xs bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors whitespace-nowrap"
                        >
                          Copiar telefone
                        </button>
                      )}
                    </div>
                    {errors.whatsapp && (
                      <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP * {isLoadingCep && <span className="text-primary-600 text-xs">(buscando...)</span>}
                    </label>
                    <Input
                      value={formData.address?.zipCode || ''}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      disabled={isLoadingCep}
                      className={errors['address.zipCode'] || cepError ? 'border-red-500' : ''}
                    />
                    {errors['address.zipCode'] && (
                      <p className="text-red-500 text-sm mt-1">{errors['address.zipCode']}</p>
                    )}
                    {cepError && (
                      <p className="text-red-500 text-sm mt-1">{cepError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rua *
                    </label>
                    <Input
                      value={formData.address?.street || ''}
                      onChange={(e) => handleChange('address.street', e.target.value)}
                      placeholder="Nome da rua"
                      className={errors['address.street'] ? 'border-red-500' : ''}
                    />
                    {errors['address.street'] && (
                      <p className="text-red-500 text-sm mt-1">{errors['address.street']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número *
                    </label>
                    <Input
                      value={formData.address?.number || ''}
                      onChange={(e) => handleChange('address.number', e.target.value)}
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <Input
                      value={formData.address?.complement || ''}
                      onChange={(e) => handleChange('address.complement', e.target.value)}
                      placeholder="Apto, sala, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro *
                    </label>
                    <Input
                      value={formData.address?.neighborhood || ''}
                      onChange={(e) => handleChange('address.neighborhood', e.target.value)}
                      placeholder="Nome do bairro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade *
                    </label>
                    <Input
                      value={formData.address?.city || ''}
                      onChange={(e) => handleChange('address.city', e.target.value)}
                      placeholder="Nome da cidade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <select
                      value={formData.address?.state || ''}
                      onChange={(e) => handleChange('address.state', e.target.value)}
                      className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value="">Selecione o estado</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botões para modal */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Cliente
                </Button>
              </div>
            </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Renderizar como página (sem modal)
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de Cliente */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo de Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Cliente *
            </label>
            <select
              value={formData.clientType}
              onChange={(e) => handleChange('clientType', e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="individual">Pessoa Física (CPF)</option>
              <option value="business">Pessoa Jurídica (CNPJ)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.clientType === 'individual' ? 'Nome Completo *' : 'Razão Social *'}
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={formData.clientType === 'individual' ? 'Digite o nome completo' : 'Digite a razão social'}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Fantasia
            </label>
            <Input
              value={formData.legalName || ''}
              onChange={(e) => handleChange('legalName', e.target.value)}
              placeholder={formData.clientType === 'individual' ? 'Nome comercial (opcional)' : 'Nome fantasia (opcional)'}
              className={errors.legalName ? 'border-red-500' : ''}
            />
            {errors.legalName && (
              <p className="text-red-500 text-sm mt-1">{errors.legalName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.clientType === 'individual' ? 'CPF *' : 'CNPJ *'}
            </label>
            <Input
              value={formData.document}
              onChange={(e) => handleChange('document', formatDocument(e.target.value))}
              placeholder={formData.clientType === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'}
              maxLength={18}
              className={errors.document ? 'border-red-500' : ''}
            />
            {errors.document && (
              <p className="text-red-500 text-sm mt-1">{errors.document}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemplo.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
              placeholder="(00) 00000-0000 (opcional)"
              maxLength={15}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp
            </label>
            <div className="flex gap-2">
              <Input
                value={formData.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={errors.whatsapp ? 'border-red-500' : ''}
              />
              {formData.phone && !formData.whatsapp && (
                <button
                  type="button"
                  onClick={() => handleChange('whatsapp', formData.phone || '')}
                  className="px-3 py-2 text-xs bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors whitespace-nowrap"
                >
                  Copiar telefone
                </button>
              )}
            </div>
            {errors.whatsapp && (
              <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
            )}
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CEP * {isLoadingCep && <span className="text-primary-600 text-xs">(buscando...)</span>}
            </label>
            <Input
              value={formData.address?.zipCode || ''}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              disabled={isLoadingCep}
              className={errors['address.zipCode'] || cepError ? 'border-red-500' : ''}
            />
            {errors['address.zipCode'] && (
              <p className="text-red-500 text-sm mt-1">{errors['address.zipCode']}</p>
            )}
            {cepError && (
              <p className="text-red-500 text-sm mt-1">{cepError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rua *
            </label>
            <Input
              value={formData.address?.street || ''}
              onChange={(e) => handleChange('address.street', e.target.value)}
              placeholder="Nome da rua"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número *
            </label>
            <Input
              value={formData.address?.number || ''}
              onChange={(e) => handleChange('address.number', e.target.value)}
              placeholder="123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complemento
            </label>
            <Input
              value={formData.address?.complement || ''}
              onChange={(e) => handleChange('address.complement', e.target.value)}
              placeholder="Apto, sala, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bairro *
            </label>
            <Input
              value={formData.address?.neighborhood || ''}
              onChange={(e) => handleChange('address.neighborhood', e.target.value)}
              placeholder="Nome do bairro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cidade *
            </label>
            <Input
              value={formData.address?.city || ''}
              onChange={(e) => handleChange('address.city', e.target.value)}
              placeholder="Nome da cidade"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <select
              value={formData.address?.state || ''}
              onChange={(e) => handleChange('address.state', e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">Selecione o estado</option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              <option value="AP">Amapá</option>
              <option value="AM">Amazonas</option>
              <option value="BA">Bahia</option>
              <option value="CE">Ceará</option>
              <option value="DF">Distrito Federal</option>
              <option value="ES">Espírito Santo</option>
              <option value="GO">Goiás</option>
              <option value="MA">Maranhão</option>
              <option value="MT">Mato Grosso</option>
              <option value="MS">Mato Grosso do Sul</option>
              <option value="MG">Minas Gerais</option>
              <option value="PA">Pará</option>
              <option value="PB">Paraíba</option>
              <option value="PR">Paraná</option>
              <option value="PE">Pernambuco</option>
              <option value="PI">Piauí</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="RN">Rio Grande do Norte</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="RO">Rondônia</option>
              <option value="RR">Roraima</option>
              <option value="SC">Santa Catarina</option>
              <option value="SP">São Paulo</option>
              <option value="SE">Sergipe</option>
              <option value="TO">Tocantins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botões para página */}
      {showActions && (
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </div>
      )}
    </form>
  );
}
