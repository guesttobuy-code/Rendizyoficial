
import { useNavigate, useParams, useLocation } from 'react-router-dom';

export interface WizardStepConfig {
    id: string;
    path: string;
    label: string;
}

// Definição da Ordem dos Passos e suas URLs (slugs)
export const WIZARD_STEPS: WizardStepConfig[] = [
    { id: 'content-type', path: 'tipo', label: 'Tipo e Identificação' },
    { id: 'content-location', path: 'localizacao', label: 'Localização' },
    { id: 'content-rooms', path: 'comodos', label: 'Cômodos' },
    { id: 'content-location-amenities', path: 'amenidades-local', label: 'Amenidades do Local' },
    { id: 'content-property-amenities', path: 'amenidades-propriedade', label: 'Amenidades da Acomodação' },
    { id: 'content-photos', path: 'fotos', label: 'Fotos' },
    { id: 'content-description', path: 'descricao', label: 'Descrição' },
    { id: 'financial-contract', path: 'contrato', label: 'Configuração de Contrato' },
    { id: 'financial-residential-pricing', path: 'precos-residenciais', label: 'Preços Residenciais' },
    { id: 'financial-fees', path: 'taxas', label: 'Taxas' },
    { id: 'financial-pricing', path: 'precificacao', label: 'Precificação Sazonal' },
    { id: 'financial-derived-pricing', path: 'precos-derivados', label: 'Preços Derivados' },
    { id: 'settings-rules', path: 'regras', label: 'Regras da Casa' },
];

export function useWizardNavigation() {
    const navigate = useNavigate();
    const { id, "*": currentPath } = useParams<{ id: string; "*": string }>();

    // Limpar a barra final se houver
    const cleanPath = currentPath?.replace(/\/$/, '') || '';

    const currentStepIndex = WIZARD_STEPS.findIndex(step => step.path === cleanPath);
    const currentStep = currentStepIndex !== -1 ? WIZARD_STEPS[currentStepIndex] : null;

    const goToStep = (stepPath: string) => {
        if (!id) return;
        navigate(`/properties/${id}/edit/${stepPath}`);
    };

    const goToNextStep = () => {
        if (currentStepIndex === -1 || currentStepIndex === WIZARD_STEPS.length - 1) return;
        const nextStep = WIZARD_STEPS[currentStepIndex + 1];
        goToStep(nextStep.path);
    };

    const goToPreviousStep = () => {
        if (currentStepIndex <= 0) return;
        const prevStep = WIZARD_STEPS[currentStepIndex - 1];
        goToStep(prevStep.path);
    };

    return {
        currentStep,
        currentStepIndex,
        steps: WIZARD_STEPS,
        goToStep,
        goToNextStep,
        goToPreviousStep,
        propertyId: id
    };
}
