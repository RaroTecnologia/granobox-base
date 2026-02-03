/// Modelos de dados para autenticação

class LoginRequest {
  final String email;
  final String password;

  LoginRequest({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
    };
  }
}

class LoginResponse {
  final String accessToken;
  final User user;

  LoginResponse({
    required this.accessToken,
    required this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['access_token'] ?? '',
      user: User.fromJson(json['user'] ?? {}),
    );
  }
}

class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String status;
  final String clientId;
  final Client client;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.status,
    required this.clientId,
    required this.client,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
      status: json['status'] ?? '',
      clientId: json['clientId'] ?? '',
      client: Client.fromJson(json['client'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'status': status,
      'clientId': clientId,
      'client': client.toJson(),
    };
  }
}

class Client {
  final String id;
  final String? businessName;
  final String? fullName;
  final String clientType;
  final String? tagmentApiKey;
  final bool hasRotuloModule;

  Client({
    required this.id,
    this.businessName,
    this.fullName,
    required this.clientType,
    this.tagmentApiKey,
    this.hasRotuloModule = false,
  });

  factory Client.fromJson(Map<String, dynamic> json) {
    return Client(
      id: json['id'] ?? '',
      businessName: json['businessName'],
      fullName: json['fullName'],
      clientType: json['clientType'] ?? 'individual',
      tagmentApiKey: json['tagmentApiKey'], // Campo opcional
      hasRotuloModule: json['hasRotuloModule'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'businessName': businessName,
      'fullName': fullName,
      'clientType': clientType,
      'tagmentApiKey': tagmentApiKey,
      'hasRotuloModule': hasRotuloModule,
    };
  }
}

