export interface Template {
  id: string;
  name: string;
  description: string;
  type: 'produto_manipulado' | 'produto_pronto' | 'recebimento' | 'etiqueta_validade' | 'custom';
  // Template criado no Tagment Studio (JSON ou código)
  templateData: string;
  // Preview do template (imagem base64)
  preview?: string;
  // Metadados do template
  width: number;
  height: number;
  isActive: boolean;
  isDefault: boolean;
  // Tags para organização
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  type: string;
  templateData: string;
  width: number;
  height: number;
  tags?: string[];
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  type?: string;
  templateData?: string;
  width?: number;
  height?: number;
  tags?: string[];
  isActive?: boolean;
  isDefault?: boolean;
}

export interface TemplateAssociation {
  id: string;
  clientId: string;
  templateId: string;
  labelType: 'produto_manipulado' | 'produto_pronto' | 'recebimento' | 'etiqueta_validade';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  template?: Template;
}

export interface CreateTemplateAssociationRequest {
  templateId: string;
  labelType: string;
  isActive?: boolean;
}

export interface TemplatePreview {
  id: string;
  name: string;
  type: string;
  preview: string; // Base64 image
  elementCount: number;
  isActive: boolean;
  isDefault: boolean;
}
