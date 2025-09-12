import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Image, X } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useTemplates } from '../../hooks/useTemplates';

const UploadTemplate: React.FC = () => {
  const navigate = useNavigate();
  const { createTemplate } = useTemplates();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'custom' as const,
    width: 400,
    height: 300,
    tags: [] as string[],
  });

  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [newTag, setNewTag] = useState('');

  const handleFileChange = (file: File, type: 'template' | 'preview') => {
    if (type === 'template') {
      setTemplateFile(file);
    } else {
      setPreviewFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!templateFile) {
      alert('Por favor, selecione um arquivo de template');
      return;
    }

    try {
      // Ler o arquivo de template
      const templateData = await templateFile.text();
      
      // Ler o preview se existir
      let previewData = '';
      if (previewFile) {
        const arrayBuffer = await previewFile.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        previewData = `data:${previewFile.type};base64,${base64}`;
      }

      const templateRequest = {
        ...formData,
        templateData,
        preview: previewData,
        isActive: true,
        isDefault: false,
      };

      await createTemplate(templateRequest);
      navigate('/templates');
    } catch (error) {
      console.error('Erro ao criar template:', error);
      alert('Erro ao criar template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/templates')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload de Template</h1>
          <p className="text-gray-600">Faça upload de um template criado no Tagment Studio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informações do Template</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do template"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do template"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  >
                    <option value="custom">Personalizado</option>
                    <option value="produto_manipulado">Produto Manipulado</option>
                    <option value="produto_pronto">Produto Pronto</option>
                    <option value="recebimento">Recebimento</option>
                    <option value="etiqueta_validade">Etiqueta de Validade</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Largura (px) *
                    </label>
                    <Input
                      type="number"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 400 })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Altura (px) *
                    </label>
                    <Input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 300 })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Adicionar tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Files */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Arquivos</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template File * (.json, .txt, .zpl)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      {templateFile ? templateFile.name : 'Selecione o arquivo do template'}
                    </p>
                    <input
                      type="file"
                      accept=".json,.txt,.zpl"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0], 'template')}
                      className="hidden"
                      id="template-file"
                    />
                    <label
                      htmlFor="template-file"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4" />
                      Selecionar Arquivo
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview Image (.png, .jpg)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      {previewFile ? previewFile.name : 'Selecione uma imagem de preview (opcional)'}
                    </p>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0], 'preview')}
                      className="hidden"
                      id="preview-file"
                    />
                    <label
                      htmlFor="preview-file"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <Upload className="h-4 w-4" />
                      Selecionar Imagem
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Preview */}
            {previewUrl && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full h-auto mx-auto"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/templates')}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Template
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UploadTemplate;



