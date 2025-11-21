/**
 * RENDIZY - Contas a Pagar Page
 * Gestão completa de contas a pagar
 */

import React, { useState } from 'react';
import { KpiCard } from '../components/KpiCard';
import { Money } from '../components/Money';
import { PeriodPicker } from '../components/PeriodPicker';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { DollarSign, TrendingDown, Calendar, AlertTriangle, Check, FileText, Upload } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Titulo } from '../../../types/financeiro';

export function ContasPagarPage() {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));

  // Mock data
  const titulos: Titulo[] = [
    {
      id: '1',
      tipo: 'pagar',
      emissao: '2025-10-15',
      vencimento: '2025-11-05',
      pessoa: 'Construtora XYZ Ltda',
      descricao: 'Reforma Apt 501 - Mão de obra',
      moeda: 'BRL',
      valorOriginal: 8500,
      valor: 8500,
      saldo: 8500,
      status: 'aberto',
      diasVencimento: -4,
      recorrente: false,
      createdAt: '2025-10-15T10:00:00Z',
      updatedAt: '2025-10-15T10:00:00Z'
    },
    {
      id: '2',
      tipo: 'pagar',
      emissao: '2025-11-01',
      vencimento: '2025-11-10',
      pessoa: 'Energia Elétrica S.A.',
      descricao: 'Conta de Luz - Condomínio',
      moeda: 'BRL',
      valorOriginal: 1250,
      valor: 1250,
      saldo: 0,
      valorPago: 1250,
      status: 'pago',
      dataPagamento: '2025-11-08',
      formaPagamento: 'Débito Automático',
      recorrente: true,
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2025-11-08T08:00:00Z'
    }
  ];

  const kpis = {
    totalPagar: titulos.filter(t => t.status !== 'pago').reduce((sum, t) => sum + t.saldo, 0),
    pagos: titulos.filter(t => t.status === 'pago').reduce((sum, t) => sum + (t.valorPago || 0), 0),
    vencidos: titulos.filter(t => t.status === 'vencido' || (t.diasVencimento && t.diasVencimento < 0)).reduce((sum, t) => sum + t.saldo, 0),
    apDays: 32.8
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      aberto: { variant: 'default', label: 'A Pagar' },
      pago: { variant: 'default', label: 'Pago' },
      vencido: { variant: 'destructive', label: 'Vencido' },
      parcial: { variant: 'secondary', label: 'Parcial' }
    };
    const config = variants[status] || variants.aberto;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns: DataTableColumn<Titulo>[] = [
    {
      key: 'emissao',
      label: 'Emissão',
      sortable: true,
      render: (value) => format(new Date(value), 'dd/MM/yyyy')
    },
    {
      key: 'vencimento',
      label: 'Vencimento',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span>{format(new Date(value), 'dd/MM/yyyy')}</span>
          {row.diasVencimento !== undefined && row.diasVencimento < 0 && (
            <span className="text-xs text-red-600">
              {Math.abs(row.diasVencimento)} dias vencido
            </span>
          )}
        </div>
      )
    },
    {
      key: 'pessoa',
      label: 'Fornecedor',
      sortable: true
    },
    {
      key: 'descricao',
      label: 'Descrição',
      render: (value) => <span className="max-w-xs truncate">{value}</span>
    },
    {
      key: 'valor',
      label: 'Valor',
      sortable: true,
      className: 'text-right',
      render: (value, row) => <Money amount={value} currency={row.moeda} />
    },
    {
      key: 'saldo',
      label: 'Saldo',
      sortable: true,
      className: 'text-right',
      render: (value, row) => <Money amount={value} currency={row.moeda} colorize />
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" title="Pagar">
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Detalhes">
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl">Contas a Pagar</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestão de fornecedores e pagamentos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">Novo Título</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Título a Pagar</DialogTitle>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard
            title="Total a Pagar"
            value={<Money amount={kpis.totalPagar} />}
            icon={<DollarSign className="h-5 w-5" />}
            tone="warning"
          />
          <KpiCard
            title="Pagos"
            value={<Money amount={kpis.pagos} />}
            icon={<Check className="h-5 w-5" />}
            tone="success"
          />
          <KpiCard
            title="Vencidos"
            value={<Money amount={kpis.vencidos} />}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="danger"
          />
          <KpiCard
            title="Prazo Médio"
            value={`${kpis.apDays.toFixed(0)} dias`}
            icon={<TrendingDown className="h-5 w-5" />}
            tone="neutral"
          />
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
        <DataTable
          data={titulos}
          columns={columns}
          pageSize={10}
          selectable
        />
      </div>
    </div>
  );
}

export default ContasPagarPage;
