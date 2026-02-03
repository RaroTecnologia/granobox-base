import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import 'labels_service.dart';

class AlertProduct {
  final String id;
  final String name;
  final String code;
  final String category;
  final String validityDate;
  final int quantity;
  final String? weight;
  final String? unit;
  final String? conservationType; // 'ambiente' | 'refrigerado' | 'congelado'
  final String? storageLocation; // Local de armazenamento
  final int daysToExpiration;
  final String priority; // 'alta' | 'média' | 'baixa'
  final String labelId;
  final String? labelCode; // Código da etiqueta
  final bool isUsed;

  AlertProduct({
    required this.id,
    required this.name,
    required this.code,
    required this.category,
    required this.validityDate,
    required this.quantity,
    this.weight,
    this.unit,
    this.conservationType,
    this.storageLocation,
    required this.daysToExpiration,
    required this.priority,
    required this.labelId,
    this.labelCode,
    required this.isUsed,
  });

  factory AlertProduct.fromJson(Map<String, dynamic> json) {
    return AlertProduct(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      category: json['category'] ?? '',
      validityDate: json['validityDate'] ?? '',
      quantity: json['quantity'] ?? 0,
      weight: json['weight'],
      unit: json['unit'],
      conservationType: json['conservationType'],
      storageLocation: json['storageLocation'],
      daysToExpiration: json['daysToExpiration'] ?? 0,
      priority: json['priority'] ?? 'baixa',
      labelId: json['labelId'] ?? '',
      labelCode: json['labelCode'],
      isUsed: json['isUsed'] ?? false,
    );
  }
}

class AlertsKPIs {
  final int totalProducts;
  final int expired;
  final int expiring7Days;
  final int expiring30Days;
  final double percentageExpired;
  final double percentageExpiring7Days;
  final double targetExpired;
  final double targetExpiring7Days;
  final int score;
  final String level; // 'Bronze' | 'Prata' | 'Ouro' | 'Diamante'
  final String nextLevel;
  final int pointsToNextLevel;

  AlertsKPIs({
    required this.totalProducts,
    required this.expired,
    required this.expiring7Days,
    required this.expiring30Days,
    required this.percentageExpired,
    required this.percentageExpiring7Days,
    required this.targetExpired,
    required this.targetExpiring7Days,
    required this.score,
    required this.level,
    required this.nextLevel,
    required this.pointsToNextLevel,
  });

  factory AlertsKPIs.fromJson(Map<String, dynamic> json) {
    return AlertsKPIs(
      totalProducts: json['totalProducts'] ?? 0,
      expired: json['expired'] ?? 0,
      expiring7Days: json['expiring7Days'] ?? 0,
      expiring30Days: json['expiring30Days'] ?? 0,
      percentageExpired: (json['percentageExpired'] ?? 0).toDouble(),
      percentageExpiring7Days: (json['percentageExpiring7Days'] ?? 0).toDouble(),
      targetExpired: (json['targetExpired'] ?? 0).toDouble(),
      targetExpiring7Days: (json['targetExpiring7Days'] ?? 0).toDouble(),
      score: json['score'] ?? 0,
      level: json['level'] ?? 'Bronze',
      nextLevel: json['nextLevel'] ?? 'Prata',
      pointsToNextLevel: json['pointsToNextLevel'] ?? 0,
    );
  }
}

class AlertsData {
  final List<AlertProduct> expired;
  final List<AlertProduct> expiring7Days;
  final List<AlertProduct> expiring30Days;
  final AlertsKPIs kpis;

  AlertsData({
    required this.expired,
    required this.expiring7Days,
    required this.expiring30Days,
    required this.kpis,
  });

  factory AlertsData.fromJson(Map<String, dynamic> json) {
    return AlertsData(
      expired: (json['expired'] as List<dynamic>?)
              ?.map((item) => AlertProduct.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      expiring7Days: (json['expiring7Days'] as List<dynamic>?)
              ?.map((item) => AlertProduct.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      expiring30Days: (json['expiring30Days'] as List<dynamic>?)
              ?.map((item) => AlertProduct.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      kpis: AlertsKPIs.fromJson(json['kpis'] as Map<String, dynamic>),
    );
  }
}

class AlertsService {
  static String get _baseUrl => AppConfig.apiBaseUrl;
  final LabelsService _labelsService = LabelsService();

  int _calculateDaysToExpiration(String validityDate) {
    final agora = DateTime.now();
    // Normalizar para meia-noite para comparar apenas as datas
    final today = DateTime(agora.year, agora.month, agora.day);
    final expiration = DateTime.parse(validityDate);
    // Normalizar a data de vencimento para meia-noite
    final expirationNormalizado = DateTime(expiration.year, expiration.month, expiration.day);
    final diffTime = expirationNormalizado.difference(today);
    return diffTime.inDays;
  }

  String _calculatePriority(int daysToExpiration, int quantity) {
    if (daysToExpiration < 0) {
      // Vencido - prioridade baseada na quantidade
      return quantity > 100 ? 'alta' : 'média';
    } else if (daysToExpiration <= 3) {
      // Vencendo em 3 dias ou menos
      return 'alta';
    } else if (daysToExpiration <= 7) {
      // Vencendo em 7 dias
      return quantity > 50 ? 'média' : 'baixa';
    } else {
      // Vencendo em 30 dias
      return 'baixa';
    }
  }

  int _calculateScore(AlertsKPIs kpis) {
    int score = 100;

    // Penalizar produtos vencidos (peso maior)
    if (kpis.percentageExpired > kpis.targetExpired) {
      final excess = kpis.percentageExpired - kpis.targetExpired;
      score -= (excess * 30).round(); // 30 pontos por % acima da meta
    }

    // Penalizar produtos vencendo em 7 dias
    if (kpis.percentageExpiring7Days > kpis.targetExpiring7Days) {
      final excess = kpis.percentageExpiring7Days - kpis.targetExpiring7Days;
      score -= (excess * 15).round(); // 15 pontos por % acima da meta
    }

    // Bonificar boa gestão
    if (kpis.percentageExpired == 0) {
      score += 10; // Bônus por zero vencidos
    }

    return score.clamp(0, 100);
  }

  Map<String, dynamic> _calculateLevel(int score) {
    if (score >= 90) {
      return {'level': 'Diamante', 'nextLevel': 'Diamante', 'pointsToNextLevel': 0};
    } else if (score >= 75) {
      return {'level': 'Ouro', 'nextLevel': 'Diamante', 'pointsToNextLevel': 90 - score};
    } else if (score >= 60) {
      return {'level': 'Prata', 'nextLevel': 'Ouro', 'pointsToNextLevel': 75 - score};
    } else {
      return {'level': 'Bronze', 'nextLevel': 'Prata', 'pointsToNextLevel': 60 - score};
    }
  }

  AlertProduct _convertLabelToAlertProduct(Map<String, dynamic> label) {
    final validityDate = label['validityDate'] ?? '';
    final daysToExpiration = _calculateDaysToExpiration(validityDate);
    final quantity = label['quantity'] ?? 0;
    final priority = _calculatePriority(daysToExpiration, quantity);
    final isUsed = label['metadata']?['isUsed'] ?? false;
    
    // Buscar storageLocation se disponível (pode vir como objeto ou string)
    String? storageLocation;
    if (label['storageLocation'] != null) {
      if (label['storageLocation'] is String) {
        storageLocation = label['storageLocation'] as String;
      } else if (label['storageLocation'] is Map) {
        final storageLoc = label['storageLocation'] as Map<String, dynamic>;
        storageLocation = storageLoc['name'] ?? storageLoc['description'] ?? storageLoc['code'];
      }
    }
    // Também verificar se vem em storageLocationId e buscar o nome
    if (storageLocation == null && label['storageLocationId'] != null) {
      // Se tiver storageLocationId mas não o objeto completo, tentar buscar do relacionamento
      if (label['storageLocation'] == null && label['storageLocationId'] is String) {
        // Não temos o objeto completo, então não podemos mostrar o nome
        // Mas vamos deixar null para não mostrar conservação
      }
    }

    return AlertProduct(
      id: label['product']?['id'] ?? '',
      name: label['product']?['name'] ?? 'Produto',
      code: label['product']?['code'] ?? '',
      category: label['product']?['category']?['name'] ?? 'Produto',
      validityDate: validityDate,
      quantity: quantity,
      weight: label['weight'],
      unit: label['unit'],
      conservationType: label['conservationType'],
      storageLocation: storageLocation,
      daysToExpiration: daysToExpiration,
      priority: priority,
      labelId: label['id'] ?? '',
      labelCode: label['code'] ?? label['labelCode'],
      isUsed: isUsed,
    );
  }

  /// Buscar dados de alertas
  Future<AlertsData> getAlertsData(String clientId, {String? authToken}) async {
    try {
      print('🔍 AlertsService - Buscando alertas para cliente: $clientId');

      // Buscar etiquetas do cliente (usa endpoint sem paginação para simplicidade)
      // O endpoint /labels já exclui etiquetas pendentes por padrão
      final allLabels = await _labelsService.buscarEtiquetas(
        clientId: clientId,
        type: 'validity',
        authToken: authToken,
      );
      
      print('✅ AlertsService - Total de etiquetas carregadas: ${allLabels.length}');

      // Filtrar apenas etiquetas de validade que não foram usadas e que foram impressas
      // ⭐ Múltiplas verificações para garantir que etiquetas baixadas não apareçam:
      // 1. metadata.isUsed não pode ser true
      // 2. status não pode ser 'consumed' (status do backend quando é dada baixa)
      // 3. status deve ser 'printed' (excluir pending, failed, etc.)
      final validityLabels = allLabels.where((label) {
        final type = label['type'];
        final status = label['status']?.toString().toLowerCase();
        final isUsedInMetadata = label['metadata']?['isUsed'] ?? false;
        
        return type == 'validity' &&
               !isUsedInMetadata &&
               status != 'consumed' &&
               status == 'printed';
      }).toList();

      // Converter para AlertProduct
      final alertProducts = validityLabels
          .map((label) => _convertLabelToAlertProduct(label))
          .toList();

      // Separar por categorias de vencimento
      final expired = alertProducts
          .where((product) => product.daysToExpiration < 0)
          .toList()
        ..sort((a, b) => a.daysToExpiration.compareTo(b.daysToExpiration)); // Ordenar: mais negativo primeiro (venceram há mais dias)
      
      final expiring7Days = alertProducts
          .where((product) =>
              product.daysToExpiration >= 0 &&
              product.daysToExpiration <= 7)
          .toList()
        ..sort((a, b) => a.daysToExpiration.compareTo(b.daysToExpiration)); // Ordenar: 0 (hoje) primeiro, depois 1, 2, 3...
      
      final expiring30Days = alertProducts
          .where((product) =>
              product.daysToExpiration > 7 &&
              product.daysToExpiration <= 30)
          .toList()
        ..sort((a, b) => a.daysToExpiration.compareTo(b.daysToExpiration)); // Ordenar: 8, 9, 10... até 30

      // Calcular KPIs
      final totalProducts = alertProducts.length;
      final percentageExpired = totalProducts > 0
          ? ((expired.length / totalProducts) * 100).toDouble()
          : 0.0;
      final percentageExpiring7Days = totalProducts > 0
          ? ((expiring7Days.length / totalProducts) * 100).toDouble()
          : 0.0;

      // Metas (configuráveis)
      const targetExpired = 0.2; // 0.2%
      const targetExpiring7Days = 0.5; // 0.5%

      final partialKpis = AlertsKPIs(
        totalProducts: totalProducts,
        expired: expired.length,
        expiring7Days: expiring7Days.length,
        expiring30Days: expiring30Days.length,
        percentageExpired: percentageExpired,
        percentageExpiring7Days: percentageExpiring7Days,
        targetExpired: targetExpired,
        targetExpiring7Days: targetExpiring7Days,
        score: 0, // Será calculado abaixo
        level: 'Bronze',
        nextLevel: 'Prata',
        pointsToNextLevel: 0,
      );

      final score = _calculateScore(partialKpis);
      final levelInfo = _calculateLevel(score);

      final kpis = AlertsKPIs(
        totalProducts: partialKpis.totalProducts,
        expired: partialKpis.expired,
        expiring7Days: partialKpis.expiring7Days,
        expiring30Days: partialKpis.expiring30Days,
        percentageExpired: partialKpis.percentageExpired,
        percentageExpiring7Days: partialKpis.percentageExpiring7Days,
        targetExpired: partialKpis.targetExpired,
        targetExpiring7Days: partialKpis.targetExpiring7Days,
        score: score,
        level: levelInfo['level'] as String,
        nextLevel: levelInfo['nextLevel'] as String,
        pointsToNextLevel: levelInfo['pointsToNextLevel'] as int,
      );

      print('✅ AlertsService - Alertas obtidos: ${expired.length} vencidos, ${expiring7Days.length} vencendo em 7 dias, ${expiring30Days.length} vencendo em 30 dias');

      return AlertsData(
        expired: expired,
        expiring7Days: expiring7Days,
        expiring30Days: expiring30Days,
        kpis: kpis,
      );
    } catch (error) {
      print('❌ Erro ao buscar dados de alertas: $error');
      rethrow;
    }
  }

  /// Marcar um produto como resolvido (dar baixa na etiqueta)
  Future<void> resolveAlert(String labelId, {String? authToken}) async {
    try {
      print('🔄 AlertsService - Resolvendo alerta: $labelId');
      final success = await _labelsService.marcarComoUsada(labelId, authToken: authToken);
      if (!success) {
        throw Exception('Falha ao marcar etiqueta como usada');
      }
      print('✅ AlertsService - Alerta resolvido com sucesso');
    } catch (error) {
      print('❌ Erro ao resolver alerta: $error');
      rethrow;
    }
  }
}

