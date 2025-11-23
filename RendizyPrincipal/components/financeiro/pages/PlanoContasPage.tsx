/**
 * RENDIZY - Plano de Contas Page
 * Gestão completa do plano de contas (categorias)
 * 
 * @version v1.0.103.500
 */

import React, { useState, useEffect } from 'react';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Plus, Edit, Trash2, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import type { ContaContabil } from '../../../types/financeiro';
import { financeiroApi } from '../../../utils/api';
import { toast } from 'sonner';

export function PlanoContasPage() {
  const [categorias, setCategorias] = useState<ContaContabil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<ContaContabil | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tipo: 'receita' as 'receita' | 'despesa',
    natureza: 'credora' as 'credora' | 'devedora',
    parentId: '',
    ativo: true,
  });

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await financeiroApi.categorias.list();
      
      if (response.success && response.data) {
        setCategorias(response.data || []);
      } else {
        setError(response.error || 'Erro ao carregar categorias');
        setCategorias([]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
      setError(err.message || 'Erro ao carregar categorias');
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.codigo.trim() || !formData.nome.trim()) {
      toast.error('Código e nome são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const categoriaData: Partial<ContaContabil> = {
        codigo: formData.codigo.trim(),
        nome: formData.nome.trim(),
        tipo: formData.tipo,
        natureza: formData.natureza,
        parentId: formData.parentId || undefined,
        ativo: formData.ativo,
      };

      let response;
      if (editingCategoria) {
        // TODO: Implementar update quando disponível no backend
        toast.error('Edição ainda não implementada no backend');
        return;
      } else {
        response = await financeiroApi.categorias.create(categoriaData);
      }

      if (response.success) {
        toast.success('Categoria salva com sucesso!');
        setIsDialogOpen(false);
        setEditingCategoria(null);
        resetForm();
        await loadCategorias();
      } else {
        setError(response.error || 'Erro ao salvar categoria');
        toast.error(response.error || 'Erro ao salvar categoria');
      }
    } catch (err: any) {
      console.error('Erro ao salvar categoria:', err);
      setError(err.message || 'Erro ao salvar categoria');
      toast.error(err.message || 'Erro ao salvar categoria');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nome: '',
      tipo: 'receita',
      natureza: 'credora',
      parentId: '',
      ativo: true,
    });
  };

  const handleEdit = (categoria: ContaContabil) => {
    setEditingCategoria(categoria);
    setFormData({
      codigo: categoria.codigo,
      nome: categoria.nome,
      tipo: categoria.tipo,
      natureza: categoria.natureza,
      parentId: categoria.parentId || '',
      ativo: categoria.ativo,
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingCategoria(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  // Organizar categorias em hierarquia
  const buildHierarchy = (cats: ContaContabil[]): ContaContabil[] => {
    const map = new Map<string, ContaContabil & { children?: ContaContabil[] }>();
    const roots: (ContaContabil & { children?: ContaContabil[] })[] = [];

    // Criar mapa
    cats.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    // Construir árvore
    cats.forEach(cat => {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        const parent = map.get(cat.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots as ContaContabil[];
  };

  const renderCategoryTree = (categories: (ContaContabil & { children?: ContaContabil[] })[], level = 0): React.ReactNode => {
    return categories.map(cat => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expandedCategories.has(cat.id);

      return (
        <React.Fragment key={cat.id}>
          <tr className={level > 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
            <td style={{ paddingLeft: `${level * 24 + 12}px` }} className="py-2">
              <div className="flex items-center gap-2">
                {hasChildren && (
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                {!hasChildren && <span className="w-6" />}
                <span className="font-mono text-sm">{cat.codigo}</span>
              </div>
            </td>
            <td className="py-2">
              <span>{cat.nome}</span>
            </td>
            <td className="py-2">
              <Badge variant={cat.tipo === 'receita' ? 'default' : 'destructive'}>
                {cat.tipo === 'receita' ? 'Receita' : 'Despesa'}
              </Badge>
            </td>
            <td className="py-2">
              <Badge variant="outline">{cat.natureza}</Badge>
            </td>
            <td className="py-2">
              <Badge variant={cat.ativo ? 'default' : 'secondary'}>
                {cat.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </td>
            <td className="py-2 text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(cat)}
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
                      // TODO: Implementar delete quando disponível no backend
                      toast.error('Exclusão ainda não implementada no backend');
                    }
                  }}
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </td>
          </tr>
          {hasChildren && isExpanded && cat.children && (
            <>
              {renderCategoryTree(cat.children, level + 1)}
            </>
          )}
        </React.Fragment>
      );
    });
  };

  const hierarchicalCategories = buildHierarchy(categorias);
  const parentCategories = categorias.filter(c => !c.parentId);

  const columns: DataTableColumn<ContaContabil>[] = [
    {
      key: 'codigo',
      label: 'Código',
      sortable: true,
      render: (value) => <span className="font-mono">{value}</span>
    },
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value) => (
        <Badge variant={value === 'receita' ? 'default' : 'destructive'}>
          {value === 'receita' ? 'Receita' : 'Despesa'}
        </Badge>
      )
    },
    {
      key: 'natureza',
      label: 'Natureza',
      render: (value) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'ativo',
      label: 'Status',
      render: (value) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl">Plano de Contas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestão de categorias contábeis
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Código *</Label>
                    <Input
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="Ex: 3.1"
                    />
                  </div>
                  <div>
                    <Label>Nome *</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Receita de Aluguéis"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: 'receita' | 'despesa') => 
                        setFormData({ ...formData, tipo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Natureza *</Label>
                    <Select
                      value={formData.natureza}
                      onValueChange={(value: 'credora' | 'devedora') => 
                        setFormData({ ...formData, natureza: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credora">Credora</SelectItem>
                        <SelectItem value="devedora">Devedora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Categoria Pai</Label>
                  <Select
                    value={formData.parentId}
                    onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma (categoria raiz)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma (categoria raiz)</SelectItem>
                      {parentCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.codigo} - {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="rounded"
                  />
                  <Label>Categoria ativa</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading && categorias.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando categorias...</span>
          </div>
        ) : categorias.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <span className="text-gray-500">Nenhuma categoria encontrada</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Código</th>
                  <th className="text-left p-3 font-semibold">Nome</th>
                  <th className="text-left p-3 font-semibold">Tipo</th>
                  <th className="text-left p-3 font-semibold">Natureza</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {renderCategoryTree(hierarchicalCategories)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlanoContasPage;

