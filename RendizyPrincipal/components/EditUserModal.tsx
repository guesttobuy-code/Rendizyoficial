import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { UserCog, AlertCircle, Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
}

interface EditUserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

export function EditUserModal({ open, onClose, onSuccess, user }: EditUserModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        role: 'staff',
        status: 'active',
        password: '' // Opcional, para reset de senha
    });

    useEffect(() => {
        if (user && open) {
            setFormData({
                name: user.name,
                role: user.role,
                status: user.status,
                password: '' // Sempre vazio inicialmente
            });
            setError(null);
        }
    }, [user, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError(null);
        setLoading(true);

        try {
            const body: any = {
                name: formData.name,
                role: formData.role,
                status: formData.status
            };

            if (formData.password) {
                body.password = formData.password;
            }

            const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/users/${user.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${publicAnonKey}`
                    },
                    body: JSON.stringify(body)
                }
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Erro ao atualizar usuário');
            }

            toast.success('Usuário atualizado com sucesso!');
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error updating user:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            toast.error('Erro ao atualizar usuário');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !loading && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <UserCog className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <DialogTitle>Editar Usuário</DialogTitle>
                            <DialogDescription>
                                Alterar dados de {user.name} ({user.email})
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-name">
                                Nome Completo
                            </Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-role">
                                Função
                            </Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                                disabled={loading}
                            >
                                <SelectTrigger id="edit-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="owner">
                                        <span className="font-medium">Owner</span> - Acesso total
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        <span className="font-medium">Admin</span> - Gestão avançada
                                    </SelectItem>
                                    <SelectItem value="manager">
                                        <span className="font-medium">Manager</span> - Operação + Edição
                                    </SelectItem>
                                    <SelectItem value="staff">
                                        <span className="font-medium">Staff</span> - Operação básica
                                    </SelectItem>
                                    <SelectItem value="readonly">
                                        <span className="font-medium">Read-only</span> - Apenas leitura
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-status">
                                Status
                            </Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                                disabled={loading}
                            >
                                <SelectTrigger id="edit-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        <span className="text-green-600 font-medium">Ativo</span>
                                    </SelectItem>
                                    <SelectItem value="invited">
                                        <span className="text-blue-600 font-medium">Convidado</span>
                                    </SelectItem>
                                    <SelectItem value="suspended">
                                        <span className="text-red-600 font-medium">Suspenso</span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-2 border-t mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-password" className="flex items-center gap-2">
                                    <Lock className="h-3 w-3 text-gray-400" />
                                    Redefinir Senha <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="edit-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Digite nova senha para alterar"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        disabled={loading}
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-500" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-500" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Preencha apenas se desejar alterar a senha do usuário.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
