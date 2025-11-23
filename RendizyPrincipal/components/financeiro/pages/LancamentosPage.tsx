/**
 * RENDIZY - Lançamentos Page
 * Gestão de lançamentos financeiros manuais
 */

import React, { useState, useEffect } from 'react';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { Money } from '../components/Money';
import { PeriodPicker } from '../components/PeriodPicker';
import { SplitEditor } from '../components/SplitEditor';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Plus, Download, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Lancamento, SplitDestino } from '../../../types/financeiro';
import { financeiroApi } from '../../../utils/api';

export function LancamentosPage() {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'transferencia'>('entrada');
  const [valor, setValor] = useState(0);
  const [splits, setSplits] = useState<SplitDestino[]>([]);
  const [usarSplit, setUsarSplit] = useState(false);

  // Carregar lançamentos do backend
  useEffect(() => {
    loadLancamentos();
  }, [startDate, endDate]);

  const loadLancamentos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await financeiroApi.lancamentos.list({
        dataInicio: format(startDate, 'yyyy-MM-dd'),
        dataFim: format(endDate, 'yyyy-MM-dd'),
        page: 1,
        limit: 100,
        orderBy: 'data',
        order: 'desc',
      });
      
      if (response.success && response.data) {
        setLancamentos(response.data.data || []);
      } else {
        setError(response.error || 'Erro ao carregar lançamentos');
        setLancamentos([]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar lançamentos:', err);
      setError(err.message || 'Erro ao carregar lançamentos');
      setLancamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const lancamentoData: Partial<Lancamento> = {
        tipo,
        data: format(new Date(), 'yyyy-MM-dd'),
        competencia: format(new Date(), 'yyyy-MM-dd'),
        descricao: '', // TODO: Adicionar campo de descrição no form
        valor,
        moeda: 'BRL',
        hasSplit: usarSplit,
        splits: usarSplit ? splits : undefined,
        conciliado: false,
      };

      let response;
      if (editingLancamento) {
        response = await financeiroApi.lancamentos.update(editingLancamento.id, lancamentoData);
      } else {
        response = await financeiroApi.lancamentos.create(lancamentoData);
      }

      if (response.success) {
        setIsDialogOpen(false);
        setEditingLancamento(null);
        // Reset form
        setTipo('entrada');
        setValor(0);
        setSplits([]);
        setUsarSplit(false);
        // Recarregar lista
        await loadLancamentos();
      } else {
        setError(response.error || 'Erro ao salvar lançamento');
      }
    } catch (err: any) {
      console.error('Erro ao salvar lançamento:', err);
      setError(err.message || 'Erro ao salvar lançamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await financeiroApi.lancamentos.delete(id);
      
      if (response.success) {
        await loadLancamentos();
      } else {
        setError(response.error || 'Erro ao excluir lançamento');
      }
    } catch (err: any) {
      console.error('Erro ao excluir lançamento:', err);
      setError(err.message || 'Erro ao excluir lançamento');
    } finally {
      setLoading(false);
    }
  };
    {
      id: '1',
      tipo: 'entrada',
      data: '2025-11-01',
      descricao: 'Aluguel recebido - Apt 501',
      valor: 3500,
      moeda: 'BRL',
      categoriaId: 'cat1',
      categoriaNome: 'Receita de Aluguéis',
      conciliado: true,
      hasSplit: false,
      createdBy: 'user1',
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2025-11-01T10:00:00Z'
    },
    {
      id: '2',
      tipo: 'saida',
      data: '2025-11-05',
      descricao: 'Manutenção preventiva - Casa 12',
      valor: 1250,
      moeda: 'BRL',
      categoriaId: 'cat2',
      categoriaNome: 'Manutenção',
      conciliado: false,
      hasSplit: false,
      createdBy: 'user1',
      createdAt: '2025-11-05T14:30:00Z',
      updatedAt: '2025-11-05T14:30:00Z'
    },
    {
      id: '3',
      tipo: 'transferencia',
      data: '2025-11-10',
      descricao: 'Transferência entre contas',
      valor: 5000,
      moeda: 'BRL',
      conciliado: true,
      hasSplit: false,
      createdBy: 'user1',
      createdAt: '2025-11-10T09:15:00Z',
      updatedAt: '2025-11-10T09:15:00Z'
    }
  ];

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'entrada') return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
    if (tipo === 'saida') return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
    return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
  };

  const getTipoBadge = (tipo: string) => {
    const configs = {
      entrada: { variant: 'default' as const, label: 'Entrada' },
      saida: { variant: 'destructive' as const, label: 'Saída' },
      transferencia: { variant: 'secondary' as const, label: 'Transferência' }
    };
    const config = configs[tipo as keyof typeof configs];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns: DataTableColumn<Lancamento>[] = [
    {
      key: 'data',
      label: 'Data',
      sortable: true,
      render: (value) => format(new Date(value), 'dd/MM/yyyy')
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value) => (
        <div className="flex items-center gap-2">
          {getTipoIcon(value)}
          {getTipoBadge(value)}
        </div>
      )
    },
    {
      key: 'descricao',
      label: 'Descrição',
      sortable: true,
      render: (value) => <span className="max-w-md truncate">{value}</span>
    },
    {
      key: 'categoriaNome',
      label: 'Categoria',
      render: (value) => value || <span className="text-gray-400">-</span>
    },
    {
      key: 'valor',
      label: 'Valor',
      sortable: true,
      className: 'text-right',
      render: (value, row) => (
        <Money
          amount={row.tipo === 'saida' ? -value : value}
          currency={row.moeda}
          colorize
        />
      )
    },
    {
      key: 'conciliado',
      label: 'Status',
      render: (value) => (
        <Badge variant={value ? 'default' : 'outline'}>
          {value ? 'Conciliado' : 'Pendente'}
        </Badge>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl">Lançamentos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestão de movimentações financeiras
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lançamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Lançamento</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Tipo e Valor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={valor}
                        onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <Label>Descrição</Label>
                    <Textarea placeholder="Descreva o lançamento..." rows={2} />
                  </div>

                  {/* Split */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={usarSplit}
                      onChange={(e) => setUsarSplit(e.target.checked)}
                      className="rounded"
                    />
                    <Label>Dividir entre múltiplos beneficiários</Label>
                  </div>

                  {usarSplit && (
                    <SplitEditor
                      valorTotal={valor}
                      splits={splits}
                      onChange={setSplits}
                    />
                  )}

                  {/* Botões */}
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

        <PeriodPicker
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading && lancamentos.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando lançamentos...</span>
          </div>
        ) : lancamentos.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <span className="text-gray-500">Nenhum lançamento encontrado no período selecionado</span>
          </div>
        ) : (
          <DataTable
            data={lancamentos}
            columns={columns}
            pageSize={25}
          />
        )}
      </div>
    </div>
  );
}

export default LancamentosPage;
