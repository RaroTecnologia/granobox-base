import '../models/print_api_models.dart';

/// Templates padrão para etiquetas de produtos manipulados
class TagmentTemplates {
  /// Template para etiqueta de produto manipulado
  static TagmentTemplate getProdutoManipuladoTemplate() {
    return TagmentTemplate(
      elements: [
        // Cabeçalho
        const TemplateElement(
          type: 'text',
          content: 'PRODUTO MANIPULADO',
          x: 10,
          y: 10,
          properties: {
            'fontSize': 16,
            'fontWeight': 'bold',
            'align': 'center',
          },
        ),
        
        // Nome do produto
        const TemplateElement(
          type: 'text',
          content: '{{nome}}',
          x: 10,
          y: 40,
          properties: {
            'fontSize': 14,
            'fontWeight': 'bold',
          },
        ),
        
        // Peso/Quantidade (se fornecido)
        const TemplateElement(
          type: 'text',
          content: '{{pesoQuantidade}} {{unidade}}',
          x: 10,
          y: 70,
          properties: {
            'fontSize': 12,
            'fontWeight': 'normal',
          },
        ),
        
        // Tipo de conservação
        const TemplateElement(
          type: 'text',
          content: 'Conservação: {{conservacao}}',
          x: 10,
          y: 100,
          properties: {
            'fontSize': 12,
            'fontWeight': 'normal',
          },
        ),
        
        // Data de validade
        const TemplateElement(
          type: 'text',
          content: 'Validade: {{dataValidade}}',
          x: 10,
          y: 130,
          properties: {
            'fontSize': 12,
            'fontWeight': 'normal',
          },
        ),
        
        // Responsável
        const TemplateElement(
          type: 'text',
          content: 'Resp: {{responsavel}}',
          x: 10,
          y: 160,
          properties: {
            'fontSize': 12,
            'fontWeight': 'normal',
          },
        ),
        
        // Data de manipulação
        const TemplateElement(
          type: 'text',
          content: 'Manipulado em: {{dataManipulacao}}',
          x: 10,
          y: 190,
          properties: {
            'fontSize': 10,
            'fontWeight': 'normal',
          },
        ),
        
        // Código de barras (se disponível)
        const TemplateElement(
          type: 'barcode',
          content: '{{codigoBarras}}',
          x: 10,
          y: 220,
          properties: {
            'type': 'code128',
            'height': 40,
            'width': 2,
          },
        ),
      ],
      metadata: {
        'name': 'Produto Manipulado',
        'description': 'Template para etiquetas de produtos manipulados',
        'version': '1.0.0',
        'width': 400,
        'height': 300,
      },
    );
  }

  /// Template para etiqueta de produto pronto
  static TagmentTemplate getProdutoProntoTemplate() {
    return TagmentTemplate(
      elements: [
        // Cabeçalho
        const TemplateElement(
          type: 'text',
          content: 'PRODUTO PRONTO',
          x: 10,
          y: 10,
          properties: {
            'fontSize': 16,
            'fontWeight': 'bold',
            'align': 'center',
          },
        ),
        
        // Nome do produto
        const TemplateElement(
          type: 'text',
          content: '{{nome}}',
          x: 10,
          y: 40,
          properties: {
            'fontSize': 14,
            'fontWeight': 'bold',
          },
        ),
        
        // Peso/Quantidade (se fornecido)
        const TemplateElement(
          type: 'text',
          content: '{{pesoQuantidade}} {{unidade}}',
          x: 10,
          y: 70,
          properties: {
            'fontSize': 12,
            'fontWeight': 'normal',
          },
        ),
        
        // Data de validade
        const TemplateElement(
          type: 'text',
          content: 'Validade: {{dataValidade}}',
          x: 10,
          y: 100,
          properties: {
            'fontSize': 12,
            'fontWeight': 'normal',
          },
        ),
        
        // Lote
        const TemplateElement(
          type: 'text',
          content: 'Lote: {{lote}}',
          x: 10,
          y: 130,
          properties: {
            'fontSize': 12,
            'fontWeight': 'normal',
          },
        ),
        
        // Data de produção
        const TemplateElement(
          type: 'text',
          content: 'Produzido em: {{dataProducao}}',
          x: 10,
          y: 160,
          properties: {
            'fontSize': 10,
            'fontWeight': 'normal',
          },
        ),
        
        // Código de barras (se disponível)
        const TemplateElement(
          type: 'barcode',
          content: '{{codigoBarras}}',
          x: 10,
          y: 190,
          properties: {
            'type': 'code128',
            'height': 40,
            'width': 2,
          },
        ),
      ],
      metadata: {
        'name': 'Produto Pronto',
        'description': 'Template para etiquetas de produtos prontos',
        'version': '1.0.0',
        'width': 400,
        'height': 250,
      },
    );
  }

  /// Template para etiqueta de recebimento
  static TagmentTemplate getRecebimentoTemplate() {
    return TagmentTemplate(
      elements: [
        // Cabeçalho
        const TemplateElement(
          type: 'text',
          content: 'RECEBIMENTO',
          x: 10,
          y: 10,
          properties: {
            'fontSize': 16,
            'fontWeight': 'bold',
            'align': 'center',
          },
        ),
        
        // Fornecedor
        const TemplateElement(
          type: 'text',
          content: 'Fornecedor: {{fornecedor}}',
          x: 10,
          y: 40,
          properties: {
            'fontSize': 12,
            'fontWeight': 'bold',
          },
        ),
        
        // Produto
        const TemplateElement(
          type: 'text',
          content: '{{produto}}',
          x: 10,
          y: 70,
          properties: {
            'fontSize': 14,
            'fontWeight': 'bold',
          },
        ),
        
        // Quantidade
        const TemplateElement(
          type: 'text',
          content: 'Qtd: {{quantidade}} {{unidade}}',
          x: 10,
          y: 100,
          properties: {
            'fontSize': 12,
            'fontWeight': 'normal',
          },
        ),
        
        // Data de recebimento
        const TemplateElement(
          type: 'text',
          content: 'Recebido em: {{dataRecebimento}}',
          x: 10,
          y: 130,
          properties: {
            'fontSize': 10,
            'fontWeight': 'normal',
          },
        ),
        
        // Responsável pelo recebimento
        const TemplateElement(
          type: 'text',
          content: 'Resp: {{responsavel}}',
          x: 10,
          y: 160,
          properties: {
            'fontSize': 10,
            'fontWeight': 'normal',
          },
        ),
        
        // Código de barras (se disponível)
        const TemplateElement(
          type: 'barcode',
          content: '{{codigoBarras}}',
          x: 10,
          y: 190,
          properties: {
            'type': 'code128',
            'height': 40,
            'width': 2,
          },
        ),
      ],
      metadata: {
        'name': 'Recebimento',
        'description': 'Template para etiquetas de recebimento',
        'version': '1.0.0',
        'width': 400,
        'height': 250,
      },
    );
  }

  /// Dados de exemplo para teste
  static Map<String, dynamic> getProdutoManipuladoExampleData() {
    return {
      'nome': 'Salada de Frutas',
      'pesoQuantidade': '500',
      'unidade': 'G',
      'conservacao': 'Refrigerado',
      'dataValidade': '25/12/2024',
      'responsavel': 'João Silva',
      'dataManipulacao': '10/12/2024',
      'codigoBarras': '7891234567890',
    };
  }

  /// Dados de exemplo para produto pronto
  static Map<String, dynamic> getProdutoProntoExampleData() {
    return {
      'nome': 'Bolo de Chocolate',
      'pesoQuantidade': '1',
      'unidade': 'UN',
      'dataValidade': '20/12/2024',
      'lote': 'LOT001',
      'dataProducao': '10/12/2024',
      'codigoBarras': '7891234567891',
    };
  }

  /// Dados de exemplo para recebimento
  static Map<String, dynamic> getRecebimentoExampleData() {
    return {
      'fornecedor': 'Frutas & Cia',
      'produto': 'Maçãs Gala',
      'quantidade': '50',
      'unidade': 'KG',
      'dataRecebimento': '10/12/2024',
      'responsavel': 'Maria Santos',
      'codigoBarras': '7891234567892',
    };
  }
}




/// Templates padrão para etiquetas de produtos manipulados






