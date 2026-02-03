class ProdutoPreCadastro {
  final String id;
  final String nomeProduto;
  final String marca;
  final String? observacao;
  final String solicitadoPor;
  final DateTime dataSolicitacao;
  final StatusPreCadastro status;
  final String? aprovadoPor;
  final DateTime? dataAprovacao;
  final String? produtoId; // ID do produto quando aprovado
  final String empresaId;

  ProdutoPreCadastro({
    required this.id,
    required this.nomeProduto,
    required this.marca,
    this.observacao,
    required this.solicitadoPor,
    required this.dataSolicitacao,
    required this.status,
    this.aprovadoPor,
    this.dataAprovacao,
    this.produtoId,
    required this.empresaId,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nomeProduto': nomeProduto,
      'marca': marca,
      'observacao': observacao,
      'solicitadoPor': solicitadoPor,
      'dataSolicitacao': dataSolicitacao.toIso8601String(),
      'status': status.name,
      'aprovadoPor': aprovadoPor,
      'dataAprovacao': dataAprovacao?.toIso8601String(),
      'produtoId': produtoId,
      'empresaId': empresaId,
    };
  }

  factory ProdutoPreCadastro.fromJson(Map<String, dynamic> json) {
    return ProdutoPreCadastro(
      id: json['id'],
      nomeProduto: json['nomeProduto'],
      marca: json['marca'],
      observacao: json['observacao'],
      solicitadoPor: json['solicitadoPor'],
      dataSolicitacao: DateTime.parse(json['dataSolicitacao']),
      status: StatusPreCadastro.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => StatusPreCadastro.pendente,
      ),
      aprovadoPor: json['aprovadoPor'],
      dataAprovacao: json['dataAprovacao'] != null 
          ? DateTime.parse(json['dataAprovacao']) 
          : null,
      produtoId: json['produtoId'],
      empresaId: json['empresaId'],
    );
  }

  ProdutoPreCadastro copyWith({
    String? id,
    String? nomeProduto,
    String? marca,
    String? observacao,
    String? solicitadoPor,
    DateTime? dataSolicitacao,
    StatusPreCadastro? status,
    String? aprovadoPor,
    DateTime? dataAprovacao,
    String? produtoId,
    String? empresaId,
  }) {
    return ProdutoPreCadastro(
      id: id ?? this.id,
      nomeProduto: nomeProduto ?? this.nomeProduto,
      marca: marca ?? this.marca,
      observacao: observacao ?? this.observacao,
      solicitadoPor: solicitadoPor ?? this.solicitadoPor,
      dataSolicitacao: dataSolicitacao ?? this.dataSolicitacao,
      status: status ?? this.status,
      aprovadoPor: aprovadoPor ?? this.aprovadoPor,
      dataAprovacao: dataAprovacao ?? this.dataAprovacao,
      produtoId: produtoId ?? this.produtoId,
      empresaId: empresaId ?? this.empresaId,
    );
  }
}

enum StatusPreCadastro {
  pendente,
  aprovado,
  rejeitado,
}

extension StatusPreCadastroExtension on StatusPreCadastro {
  String get displayName {
    switch (this) {
      case StatusPreCadastro.pendente:
        return 'Pendente';
      case StatusPreCadastro.aprovado:
        return 'Aprovado';
      case StatusPreCadastro.rejeitado:
        return 'Rejeitado';
    }
  }

  String get color {
    switch (this) {
      case StatusPreCadastro.pendente:
        return '#FFA500'; // Laranja
      case StatusPreCadastro.aprovado:
        return '#00FF00'; // Verde
      case StatusPreCadastro.rejeitado:
        return '#FF0000'; // Vermelho
    }
  }
}
