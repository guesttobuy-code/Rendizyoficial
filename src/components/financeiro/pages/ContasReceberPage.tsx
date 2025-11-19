/**
 * RENDIZY - Contas a Receber Page
 * Gestão completa de contas a receber
 * 
 * @version v1.0.103.234
 */

import React, { useState } from 'react';
import { KpiCard } from '../components/KpiCard';
import { Money } from '../components/Money';
import { PeriodPicker } from '../components/PeriodPicker';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Card } from '../../ui/card';
import { Plus, Search, Download, DollarSign, TrendingUp, Calendar, AlertTriangle, Check, X, Mail, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Titulo, Currency } from '../../../types/financeiro';

export function ContasReceberPage() {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moedaFilter, setMoedaFilter] = useState<Currency | 'all'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Mock data - substituir por API real
  const titulos: Titulo[] = [
    {
      id: '1',
      tipo: 'receber',
      emissao: '2025-10-15',
      vencimento: '2025-11-15',
      pessoa: 'João Silva',
      descricao: 'Aluguel Outubro/2025 - Apt 501',
      moeda: 'BRL',
      valorOriginal: 3500,
      valor: 3500,
      saldo: 3500,
      status: 'aberto',
      diasVencimento: 14,
      recorrente: true,
      totalParcelas: 12,
      parcela: 10,
      createdAt: '2025-10-15T10:00:00Z',
      updatedAt: '2025-10-15T10:00:00Z'
    },
    {
      id: '2',
      tipo: 'receber',
      emissao: '2025-10-01',
      vencimento: '2025-10-31',
      pessoa: 'Maria Santos',
      descricao: 'Aluguel Outubro/2025 - Casa 12',
      moeda: 'BRL',
      valorOriginal: 5000,
      valor: 5000,
      saldo: 0,
      valorPago: 5000,
      status: 'pago',
      dataPagamento: '2025-10-29',
      formaPagamento: 'PIX',
      recorrente: false,
      createdAt: '2025-10-01T10:00:00Z',
      updatedAt: '2025-10-29T14:30:00Z'
    },
    {
      id: '3',
      tipo: 'receber',
      emissao: '2025-09-15',
      vencimento: '2025-10-15',
      pessoa: 'Carlos Oliveira',
      descricao: 'Aluguel Setembro/2025 - Apt 302',
      moeda: 'BRL',
      valorOriginal: 2800,
      valor: 2800,
      saldo: 2800,
      status: 'vencido',
      diasVencimento: -17,
      recorrente: true,
      createdAt: '2025-09-15T10:00:00Z',
      updatedAt: '2025-09-15T10:00:00Z'
    }
  ];

  // KPIs calculados
  const kpis = {
    totalReceber: titulos.filter(t => t.status !== 'pago').reduce((sum, t) => sum + t.saldo, 0),
    recebidos: titulos.filter(t => t.status === 'pago').reduce((sum, t) => sum + (t.valorPago || 0), 0),
    vencidos: titulos.filter(t => t.status === 'vencido').reduce((sum, t) => sum + t.saldo, 0),
    arDays: 28.5 // Mock - calcular média real
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon?: React.ReactNode }> = {
      aberto: { variant: 'default', label: 'A Vencer', icon: <Calendar className="h-3 w-3" /> },
      pago: { variant: 'default', label: 'Quitado', icon: <Check className="h-3 w-3" /> },
      vencido: { variant: 'destructive', label: 'Vencido', icon: <AlertTriangle className="h-3 w-3" /> },
      parcial: { variant: 'secondary', label: 'Parcial', icon: <DollarSign className="h-3 w-3" /> },
      cancelado: { variant: 'outline', label: 'Cancelado', icon: <X className="h-3 w-3" /> }
    };

    const config = variants[status] || variants.aberto;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl">Contas a Receber</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestão de títulos e recebimentos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Título
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo Título a Receber</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  <p className="text-sm text-gray-500">
                    Formulário de criação será implementado aqui
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard
            title="Total a Receber"
            value={<Money amount={kpis.totalReceber} />}
            hint="Títulos em aberto"
            icon={<DollarSign className="h-5 w-5" />}
            tone="info"
          />
          <KpiCard
            title="Recebidos"
            value={<Money amount={kpis.recebidos} />}
            hint="Neste período"
            icon={<Check className="h-5 w-5" />}
            tone="success"
          />
          <KpiCard
            title="Vencidos"
            value={<Money amount={kpis.vencidos} />}
            hint="Necessita atenção"
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="danger"
          />
          <KpiCard
            title="Prazo Médio"
            value={`${kpis.arDays.toFixed(0)} dias`}
            hint="AR Days (média)"
            icon={<TrendingUp className="h-5 w-5" />}
            tone="neutral"
            trend={{ direction: 'down', pct: -5.2 }}
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <PeriodPicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            className="w-64"
          />

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar cliente, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="aberto">A Vencer</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="pago">Quitado</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
            </SelectContent>
          </Select>

          <Select value={moedaFilter} onValueChange={(v) => setMoedaFilter(v as Currency | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Moeda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="BRL">BRL</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {titulos.map((titulo) => (
                <TableRow key={titulo.id}>
                  <TableCell>
                    <input type="checkbox" className="rounded" />
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(titulo.emissao), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col">
                      <span>{format(new Date(titulo.vencimento), 'dd/MM/yyyy')}</span>
                      {titulo.diasVencimento !== undefined && titulo.diasVencimento < 0 && (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          {Math.abs(titulo.diasVencimento)} dias vencido
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{titulo.pessoa}</span>
                      {titulo.recorrente && (
                        <span className="text-xs text-gray-500">
                          {titulo.parcela}/{titulo.totalParcelas}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">
                    {titulo.descricao}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money amount={titulo.valor} currency={titulo.moeda} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money amount={titulo.saldo} currency={titulo.moeda} colorize />
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(titulo.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" title="Receber">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Enviar cobrança">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Detalhes">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

export default ContasReceberPage;
