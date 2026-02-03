/// Modelo de usuário cliente
class ClientUser {
  final String id;
  final String name;
  final String email;
  final String role;
  final String status;
  final String clientId;
  final DateTime? lastLoginAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  ClientUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.status,
    required this.clientId,
    this.lastLoginAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ClientUser.fromJson(Map<String, dynamic> json) {
    return ClientUser(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      status: json['status'] ?? 'pending',
      clientId: json['clientId'] ?? '',
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.parse(json['lastLoginAt'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
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
      'lastLoginAt': lastLoginAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}


