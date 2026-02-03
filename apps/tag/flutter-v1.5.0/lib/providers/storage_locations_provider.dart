import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/storage_location_models.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

class StorageLocationsProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final AuthProvider _authProvider;
  
  List<StorageLocation> _storageLocations = [];
  bool _isLoading = false;
  String? _error;
  String? _clientId;

  StorageLocationsProvider(this._authProvider) {
    _authProvider.addListener(_onAuthChanged);
    _onAuthChanged();
  }

  void _onAuthChanged() {
    if (_authProvider.isAuthenticated && _authProvider.user?.clientId != null) {
      _clientId = _authProvider.user!.clientId;
    } else {
      _clientId = null;
      _storageLocations.clear();
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _authProvider.removeListener(_onAuthChanged);
    super.dispose();
  }

  List<StorageLocation> get storageLocations => _storageLocations;
  bool get isLoading => _isLoading;
  String? get error => _error;


  Future<void> loadStorageLocations({bool activeOnly = true, String? token}) async {
    // Usar o token do AuthProvider se não fornecido
    final authToken = token ?? await _authProvider.authToken;
    if (authToken == null) {
      _error = 'Token de autenticação não encontrado';
      notifyListeners();
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('🔄 [StorageLocationsProvider] Fazendo requisição para: /storage-locations${activeOnly ? '?active=true' : ''}');
      print('🔄 [StorageLocationsProvider] Token: ${authToken != null ? "✅ Presente" : "❌ Ausente"}');
      
      final response = await _apiService.get(
        '/storage-locations${activeOnly ? '?active=true' : ''}',
        token: authToken,
      );

      print('📡 [StorageLocationsProvider] Status da resposta: ${response.statusCode}');
      print('📄 [StorageLocationsProvider] Body da resposta: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        _storageLocations = data
            .map((json) => StorageLocation.fromJson(json))
            .toList();
        _error = null;
        print('✅ [StorageLocationsProvider] Locais carregados: ${_storageLocations.length}');
      } else {
        _error = 'Erro ao carregar locais de armazenamento: ${response.statusCode}';
        print('❌ [StorageLocationsProvider] Erro: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      _error = 'Erro ao carregar locais de armazenamento: $e';
      debugPrint('❌ [StorageLocationsProvider] Erro ao carregar locais de armazenamento: $e');
      print('❌ [StorageLocationsProvider] Stack trace: ${StackTrace.current}');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<StorageLocation?> createStorageLocation(CreateStorageLocationRequest request, {String? token}) async {
    final authToken = token ?? await _authProvider.authToken;
    if (authToken == null) {
      _error = 'Token de autenticação não encontrado';
      notifyListeners();
      return null;
    }

    try {
      final response = await _apiService.post(
        '/storage-locations',
        data: request.toJson(),
        token: authToken,
      );

      if (response.statusCode == 201) {
        final storageLocation = StorageLocation.fromJson(jsonDecode(response.body));
        _storageLocations.add(storageLocation);
        notifyListeners();
        return storageLocation;
      } else {
        _error = 'Erro ao criar local de armazenamento: ${response.statusCode}';
        notifyListeners();
        return null;
      }
    } catch (e) {
      _error = 'Erro ao criar local de armazenamento: $e';
      debugPrint('Erro ao criar local de armazenamento: $e');
      notifyListeners();
      return null;
    }
  }

  Future<bool> updateStorageLocation(String id, UpdateStorageLocationRequest request, {String? token}) async {
    final authToken = token ?? await _authProvider.authToken;
    if (authToken == null) {
      _error = 'Token de autenticação não encontrado';
      notifyListeners();
      return false;
    }

    try {
      final response = await _apiService.patch(
        '/storage-locations/$id',
        data: request.toJson(),
        token: authToken,
      );

      if (response.statusCode == 200) {
        final updatedLocation = StorageLocation.fromJson(jsonDecode(response.body));
        final index = _storageLocations.indexWhere((loc) => loc.id == id);
        if (index != -1) {
          _storageLocations[index] = updatedLocation;
          notifyListeners();
        }
        return true;
      } else {
        _error = 'Erro ao atualizar local de armazenamento: ${response.statusCode}';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Erro ao atualizar local de armazenamento: $e';
      debugPrint('Erro ao atualizar local de armazenamento: $e');
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteStorageLocation(String id, {String? token}) async {
    final authToken = token ?? await _authProvider.authToken;
    if (authToken == null) {
      _error = 'Token de autenticação não encontrado';
      notifyListeners();
      return false;
    }

    try {
      final response = await _apiService.delete('/storage-locations/$id', token: authToken);

      if (response.statusCode == 200) {
        _storageLocations.removeWhere((loc) => loc.id == id);
        notifyListeners();
        return true;
      } else {
        _error = 'Erro ao deletar local de armazenamento: ${response.statusCode}';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Erro ao deletar local de armazenamento: $e';
      debugPrint('Erro ao deletar local de armazenamento: $e');
      notifyListeners();
      return false;
    }
  }

  StorageLocation? getStorageLocationById(String? id) {
    if (id == null) return null;
    try {
      return _storageLocations.firstWhere((loc) => loc.id == id);
    } catch (e) {
      return null;
    }
  }

  List<StorageLocation> getStorageLocationsByType(StorageLocationType type) {
    return _storageLocations.where((loc) => loc.tipo == type).toList();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Reset ao trocar de cliente
  void resetAll() {
    _storageLocations.clear();
    _clientId = null;
    _error = null;
    _isLoading = false;
    notifyListeners();
  }
}


