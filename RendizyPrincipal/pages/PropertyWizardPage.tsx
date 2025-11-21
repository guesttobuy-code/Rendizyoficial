/**
 * RENDIZY - Property Wizard Page
 * 
 * Página para criação/edição de propriedades
 * v1.0.103.174 - Agora com sidebar sempre visível
 * 
 * @version 1.0.103.174
 * @date 2025-10-31
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { PropertyEditWizard } from '../components/PropertyEditWizard';
import { toast } from 'sonner@2.0.3';
import { propertiesApi } from '../utils/api';

export function PropertyWizardPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se é edição ou criação
  const isEditMode = !!id && id !== 'new';

  // Carregar propriedade se for edição
  useEffect(() => {
    const loadProperty = async () => {
      if (!isEditMode) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Carregando propriedade:', id);
        const response = await propertiesApi.get(id);
        
        if (response.success && response.data) {
          console.log('✅ Propriedade carregada:', response.data);
          setProperty(response.data);
          setError(null);
        } else {
          console.error('❌ Propriedade não encontrada');
          setError('Propriedade não encontrada');
          toast.error('Propriedade não encontrada');
          
          // Redirecionar após 2 segundos
          setTimeout(() => {
            navigate('/properties');
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar propriedade:', error);
        setError('Erro ao carregar propriedade. Verifique sua conexão.');
        toast.error('Erro ao carregar propriedade');
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/properties');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id, isEditMode, navigate]);

  // Salvar propriedade
  const handleSave = async (data: any) => {
    console.log('💾 [PropertyWizardPage] handleSave chamado');
    console.log('📊 [PropertyWizardPage] Dados a salvar:', data);
    console.log('🔧 [PropertyWizardPage] Modo:', isEditMode ? 'EDIÇÃO' : 'CRIAÇÃO');
    
    setSaving(true);

    try {
      let response;
      
      if (isEditMode) {
        console.log('📝 [PropertyWizardPage] Atualizando propriedade ID:', id);
        response = await propertiesApi.update(id, data);
      } else {
        console.log('➕ [PropertyWizardPage] Criando nova propriedade');
        response = await propertiesApi.create(data);
      }

      console.log('📡 [PropertyWizardPage] Resposta da API:', response);

      if (response.success) {
        console.log('✅ [PropertyWizardPage] Sucesso! Navegando para /properties');
        toast.success(
          isEditMode 
            ? 'Propriedade atualizada com sucesso!' 
            : 'Propriedade criada com sucesso!'
        );
        
        // Usar navigate em vez de window.location
        navigate('/properties');
      } else {
        console.error('❌ [PropertyWizardPage] Erro na resposta:', response.error);
        toast.error(response.error || 'Erro ao salvar propriedade');
      }
    } catch (error) {
      console.error('❌ [PropertyWizardPage] Exceção ao salvar:', error);
      toast.error('Erro ao salvar propriedade');
    } finally {
      setSaving(false);
      console.log('🏁 [PropertyWizardPage] handleSave finalizado');
    }
  };

  // Voltar para lista
  const handleBack = () => {
    navigate('/properties');
  };

  // Error state (quando propriedade não encontrada)
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Propriedade não encontrada</h2>
          <p className="text-muted-foreground mb-6">
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Ir para Dashboard
            </Button>
            <Button
              onClick={() => navigate('/properties')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Imóveis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando propriedade...</p>
          
          {/* Botão de emergência mesmo durante loading */}
          <div className="mt-6">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      {/* Header com breadcrumb e botão voltar */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Imóveis
              </Button>
              
              <div className="h-4 w-px bg-border" />
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Gestão de Imóveis</span>
                <span>›</span>
                <span className="text-foreground font-medium">
                  {isEditMode 
                    ? `Editar: ${property?.internalName || 'Imóvel'}` 
                    : 'Nova Propriedade'}
                </span>
              </div>
            </div>

            {/* Botão de emergência sempre visível */}
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Wizard Component (ocupa toda a altura restante) */}
      <div className="container mx-auto px-6 py-8">
        <PropertyEditWizard
          open={true}
          onClose={handleBack}
          property={property || {}}
          onSave={handleSave}
          isSaving={saving}
          isFullScreen={true}
        />
      </div>
    </div>
  );
}
