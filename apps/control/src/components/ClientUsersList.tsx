import { Users, User, Shield, Eye, Clock, CheckCircle, XCircle, Key } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useClientUsers } from '../hooks/useClientInvites';
import { usersService } from '../services/api';
import { useState } from 'react';

interface ClientUsersListProps {
  clientId: string;
}

export function ClientUsersList({ clientId }: ClientUsersListProps) {
  // Temporariamente usando dados mock para testar
  const users = [
    {
      id: 'e0504a78-ebb9-4f4c-8e8e-4ca137c9021e',
      name: 'Tiago Levorato',
      email: 'tiagolevorato@treslados.group',
      role: 'admin',
      status: 'active',
      lastLoginAt: '2025-09-10T23:11:02.720Z',
      createdAt: '2025-09-04T17:30:05.438Z',
    }
  ];
  const isLoading = false;
  const error = null;
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja resetar a senha do usuário ${userName}?`)) {
      return;
    }

    setResettingPassword(userId);
    
    try {
      await usersService.resetPassword(userId);
      alert('Senha resetada com sucesso! O usuário receberá um email com a nova senha.');
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      alert('Erro ao resetar senha. Tente novamente.');
    } finally {
      setResettingPassword(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} className="text-primary-600" />;
      case 'operator':
        return <User size={16} className="text-gray-600" />;
      case 'viewer':
        return <Eye size={16} className="text-gray-500" />;
      default:
        return <User size={16} className="text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'operator':
        return 'Operador';
      case 'viewer':
        return 'Visualizador';
      default:
        return role;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      case 'inactive':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'inactive':
        return 'Inativo';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Usuários do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando usuários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Usuários do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle size={48} className="text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Erro ao carregar usuários</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={20} />
          Usuários do Cliente ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users size={48} className="text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Nenhum usuário cadastrado</p>
            <p className="text-sm text-gray-500">Envie um convite para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(user.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(user.status)}
                      {getStatusLabel(user.status)}
                    </div>
                  </Badge>

                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {getRoleLabel(user.role)}
                    </p>
                    {user.lastLoginAt && (
                      <p className="text-xs text-gray-500">
                        Último acesso: {formatDate(user.lastLoginAt)}
                      </p>
                    )}
                    {!user.lastLoginAt && user.status === 'active' && (
                      <p className="text-xs text-gray-500">
                        Criado em: {formatDate(user.createdAt)}
                      </p>
                    )}
                  </div>

                  {/* Botão de Reset de Senha */}
                  {user.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(user.id, user.name)}
                      disabled={resettingPassword === user.id}
                      className="flex items-center gap-2"
                    >
                      {resettingPassword === user.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          Resetando...
                        </>
                      ) : (
                        <>
                          <Key size={16} />
                          Resetar Senha
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
