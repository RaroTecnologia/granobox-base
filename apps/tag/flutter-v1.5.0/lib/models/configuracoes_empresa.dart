class ConfiguracoesEmpresa {
  final String id;
  final String empresaId;
  final bool preCadastroHabilitado;
  final TipoAprovacao tipoAprovacao;
  final int diasParaAprovacaoAutomatica;
  final bool notificarGerencial;
  final String? emailNotificacao;
  final bool permitirEdicao;
  final DateTime dataAtualizacao;

  ConfiguracoesEmpresa({
    required this.id,
    required this.empresaId,
    required this.preCadastroHabilitado,
    required this.tipoAprovacao,
    required this.diasParaAprovacaoAutomatica,
    required this.notificarGerencial,
    this.emailNotificacao,
    required this.permitirEdicao,
    required this.dataAtualizacao,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'empresaId': empresaId,
      'preCadastroHabilitado': preCadastroHabilitado,
      'tipoAprovacao': tipoAprovacao.name,
      'diasParaAprovacaoAutomatica': diasParaAprovacaoAutomatica,
      'notificarGerencial': notificarGerencial,
      'emailNotificacao': emailNotificacao,
      'permitirEdicao': permitirEdicao,
      'dataAtualizacao': dataAtualizacao.toIso8601String(),
    };
  }

  factory ConfiguracoesEmpresa.fromJson(Map<String, dynamic> json) {
    return ConfiguracoesEmpresa(
      id: json['id'],
      empresaId: json['empresaId'],
      preCadastroHabilitado: json['preCadastroHabilitado'] ?? false,
      tipoAprovacao: TipoAprovacao.values.firstWhere(
        (e) => e.name == json['tipoAprovacao'],
        orElse: () => TipoAprovacao.manual,
      ),
      diasParaAprovacaoAutomatica: json['diasParaAprovacaoAutomatica'] ?? 7,
      notificarGerencial: json['notificarGerencial'] ?? true,
      emailNotificacao: json['emailNotificacao'],
      permitirEdicao: json['permitirEdicao'] ?? true,
      dataAtualizacao: DateTime.parse(json['dataAtualizacao']),
    );
  }

  ConfiguracoesEmpresa copyWith({
    String? id,
    String? empresaId,
    bool? preCadastroHabilitado,
    TipoAprovacao? tipoAprovacao,
    int? diasParaAprovacaoAutomatica,
    bool? notificarGerencial,
    String? emailNotificacao,
    bool? permitirEdicao,
    DateTime? dataAtualizacao,
  }) {
    return ConfiguracoesEmpresa(
      id: id ?? this.id,
      empresaId: empresaId ?? this.empresaId,
      preCadastroHabilitado: preCadastroHabilitado ?? this.preCadastroHabilitado,
      tipoAprovacao: tipoAprovacao ?? this.tipoAprovacao,
      diasParaAprovacaoAutomatica: diasParaAprovacaoAutomatica ?? this.diasParaAprovacaoAutomatica,
      notificarGerencial: notificarGerencial ?? this.notificarGerencial,
      emailNotificacao: emailNotificacao ?? this.emailNotificacao,
      permitirEdicao: permitirEdicao ?? this.permitirEdicao,
      dataAtualizacao: dataAtualizacao ?? this.dataAtualizacao,
    );
  }

  // Configuração padrão para novas empresas
  static ConfiguracoesEmpresa getDefault(String empresaId) {
    return ConfiguracoesEmpresa(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      empresaId: empresaId,
      preCadastroHabilitado: true,
      tipoAprovacao: TipoAprovacao.manual,
      diasParaAprovacaoAutomatica: 7,
      notificarGerencial: true,
      emailNotificacao: null,
      permitirEdicao: true,
      dataAtualizacao: DateTime.now(),
    );
  }
}

enum TipoAprovacao {
  manual,
  automatica,
  desabilitada,
}

extension TipoAprovacaoExtension on TipoAprovacao {
  String get displayName {
    switch (this) {
      case TipoAprovacao.manual:
        return 'Manual (Recomendado)';
      case TipoAprovacao.automatica:
        return 'Automática';
      case TipoAprovacao.desabilitada:
        return 'Desabilitada';
    }
  }

  String get description {
    switch (this) {
      case TipoAprovacao.manual:
        return 'Produtos precisam ser aprovados manualmente';
      case TipoAprovacao.automatica:
        return 'Produtos são aprovados automaticamente após X dias';
      case TipoAprovacao.desabilitada:
        return 'Pré-cadastro não é permitido';
    }
  }
}
