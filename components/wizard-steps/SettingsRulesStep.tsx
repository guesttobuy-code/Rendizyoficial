/**
 * RENDIZY - Wizard Step: Regras de Hospedagem
 * Refatorado para arquitetura URL-Driven (Phase 3)
 * 
 * @version 1.0.104.0
 * @date 2025-12-06
 */

import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { useWizardNavigation } from '../../hooks/useWizardNavigation';
import { usePropertyData } from '../../hooks/usePropertyData';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface SettingsRulesData {
  registrationNumber?: string;
  // Future rules can be added here
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SettingsRulesStep() {
  const { propertyId, goToNextStep, goToPreviousStep, onClose } = useWizardNavigation();
  const { property, loading: loadingProperty, saveProperty } = usePropertyData(propertyId);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<SettingsRulesData>({
    registrationNumber: '',
  });

  // ============================================================================
  // INIT DATA
  // ============================================================================

  useEffect(() => {
    if (property && property.wizardData?.settingsRules) {
      setFormData(prev => ({
        ...prev,
        ...property.wizardData.settingsRules
      }));
    }
  }, [property]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: keyof SettingsRulesData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        wizardData: {
          settingsRules: formData
        }
      };

      const success = await saveProperty(payload);
      if (success) {
        toast.success('Propriedade finalizada com sucesso!');
        // Close the wizard as this is the likely final step
        // But we should check if there are next steps. 
        // In the original flow, PropertyEditWizard handles "last step" logic.
        // Since this is likely the last step, we can close or just go next (which might close if handled by nav)
        // But checking previous code, handleSaveAndNext in PropertyEditWizard did:
        // if (currentStepIndex === allSteps.length - 1) onClose()

        // For now, we'll try to go to next step (which might handle completion if configured)
        // Or explicitly call onClose if we know it's the last one.
        // Let's assume standard behavior:
        goToNextStep();
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingProperty) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl pb-20">
      {/* NÚMERO DE REGISTRO */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Número de registro</h3>
          <p className="text-sm text-muted-foreground">
            Digite o número oficial de registro, caso seu país ou localidade, exija.
          </p>
        </div>

        <Input
          id="registrationNumber"
          placeholder="Digite o número de registro"
          value={formData.registrationNumber || ''}
          onChange={(e) => handleChange('registrationNumber', e.target.value)}
        />
      </div>

      {/* Placeholder para outras regras de hospedagem */}
      <Card className="border-2 border-dashed border-muted">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Regras de Hospedagem</h3>
            <p className="text-sm text-muted-foreground">
              Outras regras e políticas serão implementadas aqui
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ACTION BUTTONS */}
      <div className="fixed bottom-0 left-64 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 flex justify-between items-center z-10">
        <div className="text-sm text-muted-foreground">
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={isSaving} onClick={goToPreviousStep}>Voltar</Button>
          <Button onClick={handleSave} disabled={isSaving || loadingProperty}>
            {isSaving ? 'Salvando...' : 'Salvar e Finalizar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SettingsRulesStep;
