/**
 * RENDIZY - Configurações Financeiras Page
 * Configurações do módulo financeiro
 * 
 * @version v1.0.103.600
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card } from '../../ui/card';
import { Settings, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function ConfiguracoesFinanceirasPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [config, setConfig] = useState({
    moedaPadrao: 'BRL',
    formatoData: 'dd/MM/yyyy',
    diasVencimentoPadrao: 30,
    alertaVencimento: 7,
    calcularImpostos: true,
    impostoPadrao: 0,
  });

  useEffect(() => {
    // Carregar configurações salvas (se houver)
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // TODO: Implementar quando backend tiver endpoint de configurações
      // Por enquanto, usar valores padrão
    } catch (err: any) {
      console.error('Erro ao carregar configurações:', err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setSaved(false);
      
      // TODO: Implementar quando backend tiver endpoint de configurações
      // Por enquanto, apenas simular salvamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaved(true);
      toast.success('Configurações salvas com sucesso!');
      
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Configurações Financeiras
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure as preferências do módulo financeiro
            </p>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">
          {/* Moeda e Formato */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Moeda e Formato</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Moeda Padrão</Label>
                <Select
                  value={config.moedaPadrao}
                  onValueChange={(value) => setConfig({ ...config, moedaPadrao: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Formato de Data</Label>
                <Select
                  value={config.formatoData}
                  onValueChange={(value) => setConfig({ ...config, formatoData: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                    <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Vencimentos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Vencimentos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dias de Vencimento Padrão</Label>
                <Input
                  type="number"
                  value={config.diasVencimentoPadrao}
                  onChange={(e) => setConfig({ ...config, diasVencimentoPadrao: parseInt(e.target.value) || 30 })}
                  min="1"
                />
              </div>
              <div>
                <Label>Alerta de Vencimento (dias antes)</Label>
                <Input
                  type="number"
                  value={config.alertaVencimento}
                  onChange={(e) => setConfig({ ...config, alertaVencimento: parseInt(e.target.value) || 7 })}
                  min="1"
                />
              </div>
            </div>
          </Card>

          {/* Impostos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Impostos</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.calcularImpostos}
                  onChange={(e) => setConfig({ ...config, calcularImpostos: e.target.checked })}
                  className="rounded"
                />
                <Label>Calcular impostos automaticamente</Label>
              </div>
              {config.calcularImpostos && (
                <div>
                  <Label>Imposto Padrão (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.impostoPadrao}
                    onChange={(e) => setConfig({ ...config, impostoPadrao: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ConfiguracoesFinanceirasPage;

