import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Users, Loader2, UserPlus, Mail, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  invitedAt?: string;
  joinedAt?: string;
}

interface ViewUsersModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  onAddUser?: () => void;
}

export function ViewUsersModal({ 
  open, 
  onClose, 
  organizationId, 
  organizationName,
  onAddUser 
}: ViewUsersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && organizationId) {
      loadUsers();
    }
  }, [open, organizationId]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/users?organizationId=${organizationId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
      } else {
        throw new Error(result.error || 'Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      staff: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      readonly: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    };
    
    return (
      <Badge className={colors[role] || colors.staff} variant="secondary">
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      invited: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    
    return (
      <Badge className={colors[status] || colors.active} variant="secondary">
        {status === 'invited' ? 'Convidado' : status === 'active' ? 'Ativo' : 'Suspenso'}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle>Usuários - {organizationName}</DialogTitle>
                <DialogDescription>
                  Gerencie os usuários desta imobiliária
                </DialogDescription>
              </div>
            </div>
            {onAddUser && (
              <Button onClick={onAddUser} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Carregando usuários...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhum usuário encontrado</p>
              <p className="text-sm text-gray-400 mb-4">
                Comece adicionando o primeiro usuário para esta imobiliária
              </p>
              {onAddUser && (
                <Button onClick={onAddUser} variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Usuário
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-400" />
                          {getRoleBadge(user.role)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {users.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-500">
                Total: {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
              </p>
              <Button variant="outline" onClick={loadUsers} size="sm">
                <Loader2 className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

