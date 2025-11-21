/**
 * RENDIZY - Fluxo de Caixa Page
 * Projeção de fluxo de caixa com cenários
 */

import React, { useState } from 'react';
import { KpiCard } from '../components/KpiCard';
import { Money } from '../components/Money';
import { PeriodPicker } from '../components/PeriodPicker';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ProjecaoFluxoCaixa } from '../../../types/financeiro';

export function FluxoCaixaPage() {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(addMonths(new Date(), 5)));
  const [cenario, setCenario] = useState<'base' | 'otimista' | 'pessimista'>('base');

  // Mock data - 6 meses
  const projecoes: ProjecaoFluxoCaixa[] = [
    { periodo: 'Nov/25', entradas: 145000, saidas: 68000, saldo: 77000, saldoAcumulado: 77000, cenario: 'base' },
    { periodo: 'Dez/25', entradas: 198000, saidas: 95000, saldo: 103000, saldoAcumulado: 180000, cenario: 'base' },
    { periodo: 'Jan/26', entradas: 175000, saidas: 82000, saldo: 93000, saldoAcumulado: 273000, cenario: 'base' },
    { periodo: 'Fev/26', entradas: 162000, saidas: 78000, saldo: 84000, saldoAcumulado: 357000, cenario: 'base' },
    { periodo: 'Mar/26', entradas: 188000, saidas: 91000, saldo: 97000, saldoAcumulado: 454000, cenario: 'base' },
    { periodo: 'Abr/26', entradas: 201000, saidas: 98000, saldo: 103000, saldoAcumulado: 557000, cenario: 'base' }
  ];

  const kpis = {
    saldoAtual: 557000,
    entradasPrevistas: projecoes.reduce((sum, p) => sum + p.entradas, 0),
    saidasPrevistas: projecoes.reduce((sum, p) => sum + p.saidas, 0),
    saldoFinal: 557000
  };

  const chartData = projecoes.map(p => ({
    periodo: p.periodo,
    'Entradas': p.entradas,
    'Saídas': p.saidas,
    'Saldo': p.saldo,
    'Acumulado': p.saldoAcumulado
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl">Fluxo de Caixa</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Projeções e análise de liquidez
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={cenario} onValueChange={(v) => setCenario(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="otimista">Otimista</SelectItem>
                <SelectItem value="pessimista">Pessimista</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard
            title="Saldo Atual"
            value={<Money amount={kpis.saldoAtual} />}
            icon={<DollarSign className="h-5 w-5" />}
            tone="info"
          />
          <KpiCard
            title="Entradas Previstas"
            value={<Money amount={kpis.entradasPrevistas} />}
            hint="Próximos 6 meses"
            icon={<TrendingUp className="h-5 w-5" />}
            tone="success"
          />
          <KpiCard
            title="Saídas Previstas"
            value={<Money amount={kpis.saidasPrevistas} />}
            hint="Próximos 6 meses"
            icon={<TrendingDown className="h-5 w-5" />}
            tone="warning"
          />
          <KpiCard
            title="Saldo Projetado"
            value={<Money amount={kpis.saldoFinal} />}
            hint="Final do período"
            icon={<DollarSign className="h-5 w-5" />}
            tone="success"
            trend={{ direction: 'up', pct: 15.3 }}
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
        <Tabs defaultValue="grafico">
          <TabsList>
            <TabsTrigger value="grafico">Gráfico</TabsTrigger>
            <TabsTrigger value="tabela">Tabela</TabsTrigger>
          </TabsList>

          <TabsContent value="grafico" className="mt-4">
            <Card className="p-6">
              <h3 className="text-lg mb-4">Projeção de Fluxo de Caixa</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Entradas"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorEntradas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Saídas"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorSaidas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Acumulado"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorAcumulado)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="tabela" className="mt-4">
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider">Período</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Entradas</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Saídas</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Saldo</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {projecoes.map((proj, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">{proj.periodo}</td>
                      <td className="px-4 py-3 text-right">
                        <Money amount={proj.entradas} colorize />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money amount={-proj.saidas} colorize />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money amount={proj.saldo} colorize />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money amount={proj.saldoAcumulado} colorize />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default FluxoCaixaPage;
