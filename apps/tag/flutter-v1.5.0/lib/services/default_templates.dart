/// Templates padrão para envio ao backend
class DefaultTemplates {
  /// Template para produto manipulado
  static Map<String, dynamic> getProdutoManipuladoTemplate() {
    return {
      'name': 'Produto Manipulado',
      'description': 'Template padrão para etiquetas de produtos manipulados',
      'type': 'produto_manipulado',
      'template': {
        'elements': [
          {
            'type': 'text',
            'content': 'PRODUTO MANIPULADO',
            'x': 10,
            'y': 10,
            'properties': {
              'fontSize': 16,
              'fontWeight': 'bold',
              'align': 'center',
            },
          },
          {
            'type': 'text',
            'content': '{{nome}}',
            'x': 10,
            'y': 40,
            'properties': {
              'fontSize': 14,
              'fontWeight': 'bold',
            },
          },
          {
            'type': 'text',
            'content': '{{pesoQuantidade}} {{unidade}}',
            'x': 10,
            'y': 70,
            'properties': {
              'fontSize': 12,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'text',
            'content': 'Conservação: {{conservacao}}',
            'x': 10,
            'y': 100,
            'properties': {
              'fontSize': 12,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'text',
            'content': 'Validade: {{dataValidade}}',
            'x': 10,
            'y': 130,
            'properties': {
              'fontSize': 12,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'text',
            'content': 'Resp: {{responsavel}}',
            'x': 10,
            'y': 160,
            'properties': {
              'fontSize': 12,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'text',
            'content': 'Manipulado em: {{dataManipulacao}}',
            'x': 10,
            'y': 190,
            'properties': {
              'fontSize': 10,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'barcode',
            'content': '{{codigoBarras}}',
            'x': 10,
            'y': 220,
            'properties': {
              'type': 'code128',
              'height': 40,
              'width': 2,
            },
          },
        ],
        'metadata': {
          'name': 'Produto Manipulado',
          'description': 'Template para etiquetas de produtos manipulados',
          'version': '1.0.0',
          'width': 400,
          'height': 300,
        },
      },
    };
  }

  /// Template para produto pronto
  static Map<String, dynamic> getProdutoProntoTemplate() {
    return {
      'name': 'Produto Pronto',
      'description': 'Template padrão para etiquetas de produtos prontos',
      'type': 'produto_pronto',
      'template': {
        'elements': [
          {
            'type': 'text',
            'content': 'PRODUTO PRONTO',
            'x': 10,
            'y': 10,
            'properties': {
              'fontSize': 16,
              'fontWeight': 'bold',
              'align': 'center',
            },
          },
          {
            'type': 'text',
            'content': '{{nome}}',
            'x': 10,
            'y': 40,
            'properties': {
              'fontSize': 14,
              'fontWeight': 'bold',
            },
          },
          {
            'type': 'text',
            'content': '{{pesoQuantidade}} {{unidade}}',
            'x': 10,
            'y': 70,
            'properties': {
              'fontSize': 12,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'text',
            'content': 'Validade: {{dataValidade}}',
            'x': 10,
            'y': 100,
            'properties': {
              'fontSize': 12,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'text',
            'content': 'Lote: {{lote}}',
            'x': 10,
            'y': 130,
            'properties': {
              'fontSize': 12,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'text',
            'content': 'Produzido em: {{dataProducao}}',
            'x': 10,
            'y': 160,
            'properties': {
              'fontSize': 10,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'barcode',
            'content': '{{codigoBarras}}',
            'x': 10,
            'y': 190,
            'properties': {
              'type': 'code128',
              'height': 40,
              'width': 2,
            },
          },
        ],
        'metadata': {
          'name': 'Produto Pronto',
          'description': 'Template para etiquetas de produtos prontos',
          'version': '1.0.0',
          'width': 400,
          'height': 250,
        },
      },
    };
  }

  /// Template para recebimento
  static Map<String, dynamic> getRecebimentoTemplate() {
    return {
      'name': 'Recebimento',
      'description': 'Template padrão para etiquetas de recebimento',
      'type': 'recebimento',
      'template': {
        'elements': [
          {
            'type': 'text',
            'content': 'RECEBIMENTO',
            'x': 10,
            'y': 10,
            'properties': {
              'fontSize': 16,
              'fontWeight': 'bold',
              'align': 'center',
            },
          },
          {
            'type': 'text',
            'content': 'Fornecedor: {{fornecedor}}',
            'x': 10,
            'y': 40,
            'properties': {
              'fontSize': 12,
              'fontWeight': 'bold',
            },
          },
          {
            'type': 'text',
            'content': '{{produto}}',
            'x': 10,
            'y': 70,
            'properties': {
              'fontSize': 14,
              'fontWeight': 'bold',
            },
          },
          {
            'type': 'text',
            'content': 'Qtd: {{quantidade}} {{unidade}}',
            'x': 10,
            'y': 100,
            'properties': {
              'fontSize': 12,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'text',
            'content': 'Recebido em: {{dataRecebimento}}',
            'x': 10,
            'y': 130,
            'properties': {
              'fontSize': 10,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'text',
            'content': 'Resp: {{responsavel}}',
            'x': 10,
            'y': 160,
            'properties': {
              'fontSize': 10,
              'fontWeight': 'normal',
            },
          },
          {
            'type': 'barcode',
            'content': '{{codigoBarras}}',
            'x': 10,
            'y': 190,
            'properties': {
              'type': 'code128',
              'height': 40,
              'width': 2,
            },
          },
        ],
        'metadata': {
          'name': 'Recebimento',
          'description': 'Template para etiquetas de recebimento',
          'version': '1.0.0',
          'width': 400,
          'height': 250,
        },
      },
    };
  }

  /// Obter todos os templates padrão
  static List<Map<String, dynamic>> getAllTemplates() {
    return [
      getProdutoManipuladoTemplate(),
      getProdutoProntoTemplate(),
      getRecebimentoTemplate(),
    ];
  }
}









