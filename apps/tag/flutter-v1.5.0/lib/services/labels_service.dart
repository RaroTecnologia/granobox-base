import 'dart:convert';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class LabelsService {
  static String get _baseUrl => AppConfig.apiBaseUrl;

  /// Buscar etiquetas com paginação
  Future<Map<String, dynamic>> buscarEtiquetasPaginadas({
    String? clientId,
    String? type,
    String? status,
    String? search,
    String? validityDateFrom,
    String? validityDateTo,
    int page = 1,
    int limit = 20,
    String sortBy = 'createdAt',
    String sortOrder = 'DESC',
    String? authToken,
  }) async {
    try {
      print('🔍 LabelsService - Buscando etiquetas paginadas (página $page)...');
      
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
        'sortBy': sortBy,
        'sortOrder': sortOrder,
      };
      
      if (clientId != null) queryParams['clientId'] = clientId;
      if (type != null) queryParams['type'] = type;
      if (status != null) queryParams['status'] = status;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (validityDateFrom != null) queryParams['validityDateFrom'] = validityDateFrom;
      if (validityDateTo != null) queryParams['validityDateTo'] = validityDateTo;

      final url = '$_baseUrl/labels/paginated?${Uri(queryParameters: queryParams).query}';
      print('🌐 URL: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> result = jsonDecode(response.body);
        print('✅ Etiquetas obtidas: ${result['data']?.length ?? 0} (página $page de ${result['meta']?['totalPages'] ?? '?'})');
        print('📊 Total: ${result['meta']?['total'] ?? 0}');
        return result;
      } else {
        print('❌ Erro ao buscar etiquetas: ${response.statusCode}');
        return {'data': [], 'meta': {'page': page, 'limit': limit, 'total': 0, 'totalPages': 0, 'hasNextPage': false, 'hasPreviousPage': false}};
      }
    } catch (e) {
      print('❌ Erro de conexão ao buscar etiquetas: $e');
      return {'data': [], 'meta': {'page': page, 'limit': limit, 'total': 0, 'totalPages': 0, 'hasNextPage': false, 'hasPreviousPage': false}};
    }
  }

  /// Buscar todas as etiquetas (sem paginação - para compatibilidade)
  Future<List<Map<String, dynamic>>> buscarEtiquetas({
    String? clientId,
    String? type,
    String? authToken,
  }) async {
    try {
      print('🔍 LabelsService - Buscando etiquetas...');
      print('🌐 URL: $_baseUrl/labels');
      print('🔑 ClientId: $clientId');
      print('📋 Type: $type');

      String url = '$_baseUrl/labels';
      final queryParams = <String, String>{};
      // Bust cache
      queryParams['_ts'] = DateTime.now().millisecondsSinceEpoch.toString();
      
      if (clientId != null) queryParams['clientId'] = clientId;
      if (type != null) queryParams['type'] = type;
      
      if (queryParams.isNotEmpty) {
        url += '?${Uri(queryParameters: queryParams).query}';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ Etiquetas obtidas: ${data.length}');
        return data.cast<Map<String, dynamic>>();
      } else {
        print('❌ Erro ao buscar etiquetas: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        return [];
      }
    } catch (e) {
      print('❌ Erro de conexão ao buscar etiquetas: $e');
      return [];
    }
  }

  /// Buscar etiquetas pendentes
  Future<List<Map<String, dynamic>>> buscarEtiquetasPendentes({
    String? clientId,
    String? authToken,
  }) async {
    try {
      print('🔍 LabelsService - Buscando etiquetas pendentes...');
      print('🌐 URL: $_baseUrl/labels/pending');
      print('🔑 ClientId: $clientId');

      String url = '$_baseUrl/labels/pending';
      final qp = <String, String>{};
      qp['_ts'] = DateTime.now().millisecondsSinceEpoch.toString();
      if (clientId != null) {
        qp['clientId'] = clientId;
      }
      if (qp.isNotEmpty) {
        url += '?${Uri(queryParameters: qp).query}';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ Etiquetas pendentes obtidas: ${data.length}');
        return data.cast<Map<String, dynamic>>();
      } else {
        print('❌ Erro ao buscar etiquetas pendentes: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        return [];
      }
    } catch (e) {
      print('❌ Erro de conexão ao buscar etiquetas pendentes: $e');
      return [];
    }
  }

  /// Buscar etiqueta por código
  Future<Map<String, dynamic>?> buscarEtiquetaPorCodigo(String code, {String? authToken}) async {
    try {
      print('🔍 LabelsService - Buscando etiqueta por código: $code');
      print('🌐 URL: $_baseUrl/labels/code/$code');

      final response = await http.get(
        Uri.parse('$_baseUrl/labels/code/$code'),
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Etiqueta encontrada: $code');
        return data as Map<String, dynamic>;
      } else {
        print('❌ Etiqueta não encontrada: $code');
        return null;
      }
    } catch (e) {
      print('❌ Erro de conexão ao buscar etiqueta: $e');
      return null;
    }
  }

  /// Buscar etiqueta por ID
  Future<Map<String, dynamic>?> buscarEtiquetaPorId(String id, {String? authToken}) async {
    try {
      print('🔍 LabelsService - Buscando etiqueta por ID: $id');
      print('🌐 URL: $_baseUrl/labels/$id');

      final response = await http.get(
        Uri.parse('$_baseUrl/labels/$id'),
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Etiqueta encontrada: $id');
        return data as Map<String, dynamic>;
      } else {
        print('❌ Etiqueta não encontrada: $id');
        return null;
      }
    } catch (e) {
      print('❌ Erro de conexão ao buscar etiqueta por ID: $e');
      return null;
    }
  }

  /// Criar etiqueta (registra antes da impressão)
  Future<Map<String, dynamic>?> criarEtiqueta({
    required String type,
    String? conservationType,
    required int quantity,
    String? weight,
    String? unit,
    String? price,
    required String productionDate,
    required String validityDate,
    String? manufacturingBatch,
    String? expiryDate,
    required String clientId,
    String? productId,
    String? storageLocationId,
    String? operationId, // ⭐ NOVO: ID da operação
    String? notes,
    Map<String, dynamic>? metadata,
    String? authToken,
  }) async {
    try {
      final body = {
        'type': type,
        if (conservationType != null) 'conservationType': conservationType,
        'quantity': quantity,
        if (weight != null) 'weight': weight,
        if (unit != null) 'unit': unit,
        if (price != null) 'price': price,
        'productionDate': productionDate,
        'validityDate': validityDate,
        if (manufacturingBatch != null && manufacturingBatch.isNotEmpty) 'manufacturingBatch': manufacturingBatch,
        if (expiryDate != null && expiryDate.isNotEmpty) 'expiryDate': expiryDate,
        'clientId': clientId,
        if (productId != null && productId.isNotEmpty) 'productId': productId,
        if (storageLocationId != null) 'storageLocationId': storageLocationId,
        if (operationId != null && operationId.isNotEmpty) 'operationId': operationId, // ⭐ NOVO
        if (notes != null) 'notes': notes,
        if (metadata != null) 'metadata': metadata,
      };
      final response = await http.post(
        Uri.parse('$_baseUrl/labels'),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode(body),
      );
      if (response.statusCode == 201) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Marcar etiquetas como impressas
  Future<bool> marcarComoImpressas(List<String> ids, {String? authToken}) async {
    try {
      print('🔍 LabelsService - Marcando etiquetas como impressas...');
      print('🌐 URL: $_baseUrl/labels/mark-printed');
      print('📋 IDs: $ids');

      final response = await http.post(
        Uri.parse('$_baseUrl/labels/mark-printed'),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({'ids': ids}),
      );

      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');

      if (response.statusCode == 200) {
        print('✅ Etiquetas marcadas como impressas');
        return true;
      } else {
        print('❌ Erro ao marcar etiquetas como impressas: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('❌ Erro de conexão ao marcar etiquetas: $e');
      return false;
    }
  }

  /// Atualizar metadados da etiqueta (ex.: marcar como usada)
  Future<Map<String, dynamic>?> atualizarMetadata(String id, Map<String, dynamic> metadata, {String? authToken}) async {
    try {
      print('🔍 LabelsService - Atualizando metadata da etiqueta...');
      print('🌐 URL: $_baseUrl/labels/$id');
      print('📋 Metadata: ${jsonEncode(metadata)}');

      final response = await http.patch(
        Uri.parse('$_baseUrl/labels/$id'),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({'metadata': metadata}),
      );

      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } else {
        print('❌ Erro ao atualizar metadata: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('❌ Erro de conexão ao atualizar metadata: $e');
      return null;
    }
  }

  /// Atualizar etiqueta com campos adicionais (validityDate, conservationType, metadata)
  Future<Map<String, dynamic>?> atualizarEtiqueta(
    String id, {
    String? validityDate,
    String? conservationType,
    Map<String, dynamic>? metadata,
    String? authToken,
  }) async {
    try {
      print('🔍 LabelsService - Atualizando etiqueta...');
      print('🌐 URL: $_baseUrl/labels/$id');

      final body = <String, dynamic>{};
      if (validityDate != null) body['validityDate'] = validityDate;
      if (conservationType != null) body['conservationType'] = conservationType;
      if (metadata != null) body['metadata'] = metadata;

      print('📋 Body: ${jsonEncode(body)}');

      final response = await http.patch(
        Uri.parse('$_baseUrl/labels/$id'),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode(body),
      );

      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } else {
        print('❌ Erro ao atualizar etiqueta: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('❌ Erro de conexão ao atualizar etiqueta: $e');
      return null;
    }
  }

  /// Aplicar baixa em lote (marcar múltiplas etiquetas como usadas)
  Future<bool> aplicarBaixaEmLote(List<String> ids, {String? authToken}) async {
    try {
      print('🔄 LabelsService - Aplicando baixa em lote para ${ids.length} etiquetas...');
      
      int sucessos = 0;
      for (final id in ids) {
        final sucesso = await marcarComoUsada(id, authToken: authToken);
        if (sucesso) sucessos++;
      }
      
      print('✅ Baixa em lote concluída: $sucessos/${ids.length} etiquetas');
      return sucessos == ids.length;
    } catch (e) {
      print('❌ Erro ao aplicar baixa em lote: $e');
      return false;
    }
  }

  /// Marcar etiqueta como usada
  Future<bool> marcarComoUsada(String id, {String? authToken}) async {
    try {
      final url = '$_baseUrl/labels/$id';
      
      // ⭐ Primeiro, buscar a etiqueta para obter o metadata atual
      final etiquetaAtual = await buscarEtiquetaPorId(id, authToken: authToken);
      final metadataAtual = Map<String, dynamic>.from(etiquetaAtual?['metadata'] ?? {});
      
      // ⭐ Fazer merge do metadata (preservar dados antigos)
      final metadataAtualizado = {
        ...metadataAtual,
        'isUsed': true,
        'usedAt': DateTime.now().toIso8601String(),
      };
      
      final response = await http.patch(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'metadata': metadataAtualizado,
        }),
      );

      print('📋 [marcarComoUsada] ID: $id, Status: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      print('❌ Erro ao marcar etiqueta como usada: $e');
      return false;
    }
  }

  /// Atualizar status da etiqueta
  Future<bool> atualizarStatus(String id, String status, {String? authToken}) async {
    try {
      print('🔍 LabelsService - Atualizando status da etiqueta...');
      print('🌐 URL: $_baseUrl/labels/$id/status');
      print('📋 ID: $id');
      print('📋 Status: $status');

      final response = await http.patch(
        Uri.parse('$_baseUrl/labels/$id/status'),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({'status': status}),
      );

      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');

      if (response.statusCode == 200) {
        print('✅ Status da etiqueta atualizado');
        return true;
      } else {
        print('❌ Erro ao atualizar status: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('❌ Erro de conexão ao atualizar status: $e');
      return false;
    }
  }

  /// Registrar evento na etiqueta (ex.: updated, printed)
  Future<bool> adicionarEvento(String id, {
    required String type,
    String? userId,
    Map<String, dynamic>? metadata,
    String? authToken,
  }) async {
    try {
      print('🔍 LabelsService - Adicionando evento na etiqueta...');
      print('🌐 URL: $_baseUrl/labels/$id/events');
      final body = <String, dynamic>{
        'type': type,
        if (userId != null) 'userId': userId,
        if (metadata != null) 'metadata': metadata,
      };
      final response = await http.post(
        Uri.parse('$_baseUrl/labels/$id/events'),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode(body),
      );
      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');
      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      print('❌ Erro ao adicionar evento: $e');
      return false;
    }
  }

  /// Criar etiquetas em lote (retorna lista de {id, code})
  Future<List<Map<String, dynamic>>> criarEtiquetasBatch({
    required String type,
    String? conservationType,
    required String clientId,
    String? productId,
    String? storageLocationId,
    required int quantity,
    required String productionDate,
    required String validityDate,
    String? manufacturingBatch,
    String? expiryDate,
    Map<String, dynamic>? metadata,
    String? authToken,
  }) async {
    try {
      final body = {
        'type': type,
        if (conservationType != null) 'conservationType': conservationType,
        'clientId': clientId,
        if (productId != null && productId.isNotEmpty) 'productId': productId,
        if (storageLocationId != null) 'storageLocationId': storageLocationId,
        'quantity': quantity,
        'productionDate': productionDate,
        'validityDate': validityDate,
        if (manufacturingBatch != null && manufacturingBatch.isNotEmpty) 'manufacturingBatch': manufacturingBatch,
        if (expiryDate != null && expiryDate.isNotEmpty) 'expiryDate': expiryDate,
        if (metadata != null) 'metadata': metadata,
      };
      print('🔍 LabelsService - Criar etiquetas em lote');
      print('🌐 URL: $_baseUrl/labels/batch');
      print('📤 Body: ' + jsonEncode(body));
      final response = await http.post(
        Uri.parse('$_baseUrl/labels/batch'),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode(body),
      );
      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');
      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> items = data['items'] ?? [];
        return items.cast<Map<String, dynamic>>();
      }
      try {
        final err = jsonDecode(response.body);
        print('❌ Erro batch: ${err}');
      } catch (_) {}
      return [];
    } catch (e) {
      print('❌ Exceção ao criar batch: $e');
      return [];
    }
  }

  /// Buscar histórico de eventos de uma etiqueta
  Future<List<Map<String, dynamic>>> getLabelHistory(String labelId, {String? authToken}) async {
    try {
      print('📜 LabelsService - Buscando histórico da etiqueta $labelId...');
      
      final url = '$_baseUrl/labels/$labelId/history';
      print('🌐 URL: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> history = jsonDecode(response.body);
        print('✅ Histórico obtido: ${history.length} eventos');
        return history.cast<Map<String, dynamic>>();
      } else {
        print('❌ Erro ao buscar histórico: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('❌ Erro de conexão ao buscar histórico: $e');
      return [];
    }
  }
}
