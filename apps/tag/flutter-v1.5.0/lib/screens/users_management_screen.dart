import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../services/users_service.dart';
import '../models/client_user_models.dart';
import '../widgets/management_screen_header.dart';

class UsersManagementScreen extends StatefulWidget {
  const UsersManagementScreen({super.key});

  @override
  State<UsersManagementScreen> createState() => _UsersManagementScreenState();
}

class _UsersManagementScreenState extends State<UsersManagementScreen> {
  List<ClientUser> _users = [];
  bool _isLoading = false;
  String? _error;
  final UsersService _usersService = UsersService();

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthProvider>();
      final clientId = auth.user?.clientId;
      final token = await auth.authToken;

      if (clientId == null || token == null) {
        throw Exception('Cliente ou token não disponível');
      }

      final users = await _usersService.getUsers(
        clientId: clientId,
        authToken: token,
      );

      setState(() {
        _users = users;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao carregar usuários: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  String _formatRole(String role) {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'user':
        return 'Usuário';
      default:
        return role;
    }
  }

  String _formatStatus(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'inactive':
        return 'Inativo';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'inactive':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  void _showCreateUserDialog() {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final messageController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Novo Usuário',
          style: TextStyle(color: Colors.white),
        ),
        content: SizedBox(
          width: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Nome',
                  labelStyle: TextStyle(color: AppTheme.dark300),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.dark600),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.primary),
                  ),
                ),
                style: const TextStyle(color: Colors.white),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailController,
                decoration: InputDecoration(
                  labelText: 'E-mail',
                  labelStyle: TextStyle(color: AppTheme.dark300),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.dark600),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.primary),
                  ),
                ),
                style: const TextStyle(color: Colors.white),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: messageController,
                decoration: InputDecoration(
                  labelText: 'Mensagem (opcional)',
                  labelStyle: TextStyle(color: AppTheme.dark300),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.dark600),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.primary),
                  ),
                ),
                style: const TextStyle(color: Colors.white),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar', style: TextStyle(color: Colors.white)),
          ),
          ElevatedButton(
            onPressed: () async {
              final auth = context.read<AuthProvider>();
              final clientId = auth.user?.clientId;
              final token = await auth.authToken;

              if (clientId == null || token == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Erro: Cliente ou token não disponível')),
                );
                return;
              }

              try {
                await _usersService.sendInvite(
                  clientId: clientId,
                  authToken: token,
                  name: nameController.text.trim(),
                  email: emailController.text.trim(),
                  message: messageController.text.trim().isEmpty
                      ? null
                      : messageController.text.trim(),
                );

                Navigator.pop(context);
                _loadUsers();
                
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Convite enviado com sucesso!'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erro ao enviar convite: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            child: const Text('Enviar Convite'),
          ),
        ],
      ),
    );
  }

  void _showResendInviteDialog(ClientUser user) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Reenviar Convite',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'Deseja reenviar o convite para ${user.email}?',
          style: const TextStyle(color: Colors.white),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar', style: TextStyle(color: Colors.white)),
          ),
          ElevatedButton(
            onPressed: () async {
              final auth = context.read<AuthProvider>();
              final clientId = auth.user?.clientId;
              final token = await auth.authToken;

              if (clientId == null || token == null) return;

              try {
                await _usersService.resendInvite(
                  clientId: clientId,
                  authToken: token,
                  email: user.email,
                );

                Navigator.pop(context);
                
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Convite reenviado com sucesso!'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erro ao reenviar convite: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            child: const Text('Reenviar'),
          ),
        ],
      ),
    );
  }

  void _confirmarMudarStatus(ClientUser user) {
    final isActive = user.status.toLowerCase() == 'active';
    final acao = isActive ? 'desativar' : 'ativar';
    final acaoCapital = isActive ? 'Desativar' : 'Ativar';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(
          '$acaoCapital Usuário',
          style: const TextStyle(color: Colors.white),
        ),
        content: Text(
          isActive
              ? 'Tem certeza que deseja desativar o usuário "${user.name}"?\n\nEle não poderá mais acessar o sistema.'
              : 'Tem certeza que deseja ativar o usuário "${user.name}"?',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancelar',
              style: TextStyle(color: AppTheme.dark300),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _mudarStatusUsuario(user);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: isActive ? Colors.red : AppTheme.primary,
              foregroundColor: Colors.white,
            ),
            child: Text(acaoCapital),
          ),
        ],
      ),
    );
  }

  Future<void> _mudarStatusUsuario(ClientUser user) async {
    final messenger = ScaffoldMessenger.of(context);
    final auth = context.read<AuthProvider>();
    final clientId = auth.user?.clientId;
    final token = await auth.authToken;

    if (clientId == null || token == null) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Erro: Cliente ou token não disponível'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final isActive = user.status.toLowerCase() == 'active';

    try {
      final updated = await _usersService.updateUserStatus(
        clientId: clientId,
        userId: user.id,
        authToken: token,
        isActive: !isActive,
      );

      // Atualizar lista local
      setState(() {
        final index = _users.indexWhere((u) => u.id == user.id);
        if (index != -1) {
          _users[index] = updated;
        }
      });

      messenger.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(PhosphorIcons.checkCircle, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isActive
                      ? 'Usuário desativado com sucesso'
                      : 'Usuário ativado com sucesso',
                ),
              ),
            ],
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(PhosphorIcons.xCircle, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Erro ao atualizar status: ${e.toString()}'),
              ),
            ],
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark800,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text('Gerenciar Usuários'),
      ),
      body: Column(
        children: [
          ManagementScreenHeader(
            title: 'Usuários',
            subtitle: 'Gerencie os usuários e suas permissões',
            icon: PhosphorIcons.userCircle,
            itemCount: _users.length,
            itemLabel: _users.length == 1 ? 'usuário' : 'usuários',
            onRefresh: _loadUsers,
          ),
          Expanded(child: _buildBody()),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateUserDialog,
        backgroundColor: AppTheme.primary,
        icon: const Icon(PhosphorIcons.userPlus, color: Colors.white),
        label: const Text('Novo Usuário', style: TextStyle(color: Colors.white)),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(PhosphorIcons.warning, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Erro ao carregar usuários',
              style: const TextStyle(fontSize: 18, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: TextStyle(fontSize: 14, color: AppTheme.dark300),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadUsers,
              icon: const Icon(PhosphorIcons.arrowClockwise),
              label: const Text('Tentar Novamente'),
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            ),
          ],
        ),
      );
    }

    if (_users.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(PhosphorIcons.users, size: 64, color: AppTheme.dark600),
            const SizedBox(height: 16),
            const Text(
              'Nenhum usuário cadastrado',
              style: TextStyle(fontSize: 18, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              'Adicione usuários para gerenciar o acesso ao sistema',
              style: TextStyle(fontSize: 14, color: AppTheme.dark300),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _users.length,
      itemBuilder: (context, index) {
        final user = _users[index];
        return _buildUserCard(user);
      },
    );
  }

  Widget _buildUserCard(ClientUser user) {
    final statusColor = _getStatusColor(user.status);
    final isActive = user.status.toLowerCase() == 'active';
    final isPending = user.status.toLowerCase() == 'pending';
    final isInactive = user.status.toLowerCase() == 'inactive';

    return Opacity(
      opacity: isInactive ? 0.6 : 1.0,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.dark800,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isActive ? AppTheme.dark700 : AppTheme.dark600,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isActive
                      ? AppTheme.primary.withOpacity(0.2)
                      : AppTheme.dark700,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isActive ? AppTheme.primary : AppTheme.dark400,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            user.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        if (isInactive)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.red.withOpacity(0.3)),
                            ),
                            child: const Text(
                              'INATIVO',
                              style: TextStyle(
                                color: Colors.red,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        if (isPending)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.orange.withOpacity(0.3)),
                            ),
                            child: const Text(
                              'PENDENTE',
                              style: TextStyle(
                                color: Colors.orange,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user.email,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.dark300,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            PhosphorIcons.shieldStar,
                            color: AppTheme.primary,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatRole(user.role),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Actions
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (isPending)
                    IconButton(
                      icon: const Icon(PhosphorIcons.envelope, color: AppTheme.primary),
                      onPressed: () => _showResendInviteDialog(user),
                      tooltip: 'Reenviar Convite',
                    ),
                  if (isActive || isInactive)
                    IconButton(
                      onPressed: () => _confirmarMudarStatus(user),
                      icon: Icon(
                        isActive ? PhosphorIcons.toggleRight : PhosphorIcons.toggleLeft,
                        color: isActive ? AppTheme.primary : AppTheme.dark400,
                        size: 32,
                      ),
                      tooltip: isActive ? 'Desativar' : 'Ativar',
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

