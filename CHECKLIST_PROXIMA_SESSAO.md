# ✅ CHECKLIST - Próximas Etapas da Implementação V3

## 🎯 SESSÃO ANTERIOR (✅ COMPLETA)

- [x] Criar enum PropertyStepId com 17 valores
- [x] Criar propertySteps.ts com configuração centralizada
- [x] Refatorizar PropertyEditorPage (422 linhas)
- [x] Implementar 3 tabs de blocos (Conteúdo | Financeiro | Configurações)
- [x] Criar sidebar com steps agrupados
- [x] Implementar badges de validação (Required/Recommended/Optional)
- [x] Criar componentes Steps 1-8 (7 do conteúdo + 1 financeiro)
- [x] Criar componente Step 13 (settings)
- [x] Validar compilação (0 errors)
- [x] Criar documentação completa

---

## 🚀 PRÓXIMA SESSÃO (ESTIMADO ~1-2 HORAS)

### Tarefa 1: Criar Placeholders Steps 9-12 (Financeiro)

**Arquivo 1: PropertyStep9ResidentialPricing.tsx**
```typescript
// Localização: components/properties/steps/financial/

// Campos sugeridos:
- Preço base por noite (input)
- Preço fim de semana (input)
- Preço feriado (input)
- Desconto semanal % (input)
- Desconto mensal % (input)
- [Salvar e Avançar]

// Linhas estimadas: 80-100
```

**Arquivo 2: PropertyStep10SeasonalConfig.tsx**
```typescript
// Localização: components/properties/steps/financial/

// Campos sugeridos:
- Adicionar período de temporada (botão)
- Tabela com: Data Início | Data Fim | Tipo | [Edit] [Delete]
- Tipos de temporada: "Alta", "Média", "Baixa"
- [+ Adicionar Período]
- [Salvar e Avançar]

// Linhas estimadas: 120-150
```

**Arquivo 3: PropertyStep11IndividualPricing.tsx**
```typescript
// Localização: components/properties/steps/financial/

// Campos sugeridos:
- Seletor de cômodo (dropdown)
- Preço adicional por cômodo (input)
- Desconto grupo (%)
- [Salvar e Avançar]

// Linhas estimadas: 100-130
```

**Arquivo 4: PropertyStep12DerivedPricing.tsx**
```typescript
// Localização: components/properties/steps/financial/

// Campos sugeridos:
- Taxa de serviço % (input)
- Taxa de limpeza R$ (input)
- Depósito caução % (input)
- [Salvar e Avançar]

// Linhas estimadas: 100-120
```

**Checklist Arquivo:**
- [ ] Importar componentes necessários
- [ ] Criar interface PropertyStepXProps
- [ ] Implementar JSX com formulários
- [ ] Adicionar botão "Salvar e Avançar"
- [ ] Sem erros TypeScript

---

### Tarefa 2: Criar Placeholders Steps 14-17 (Configurações)

**Arquivo 1: PropertyStep14BookingConfig.tsx**
```typescript
// Localização: components/properties/steps/settings/

// Campos sugeridos:
- Dia check-in não permitido (multi-select)
- Hora check-in (time input)
- Hora check-out (time input)
- Requer pré-pagamento (toggle)
- % antecipado requerido (input)
- [Salvar e Avançar]

// Linhas estimadas: 100-120
```

**Arquivo 2: PropertyStep15TagsGroups.tsx**
```typescript
// Localização: components/properties/steps/settings/

// Campos sugeridos:
- Adicionar tag (input + botão Add)
- Lista de tags adicionadas: [tag1] [tag2] [×]
- Grupo de propriedade (dropdown)
- [Salvar e Avançar]

// Linhas estimadas: 80-100
```

**Arquivo 3: PropertyStep16ICalSync.tsx**
```typescript
// Localização: components/properties/steps/settings/

// Campos sugeridos:
- URL iCal (input)
- Auto-sync habilitado (toggle)
- Frequência sync (dropdown: Diária/Horária)
- Último sync: [data/hora]
- [Testar Conexão]
- [Salvar e Avançar]

// Linhas estimadas: 100-120
```

**Arquivo 4: PropertyStep17OTAIntegrations.tsx**
```typescript
// Localização: components/properties/steps/settings/

// Campos sugeridos:
- Airbnb habilitado (toggle)
- Booking habilitado (toggle)
- Expedia habilitado (toggle)
- Credentials (inputs opcionais)
- [Conectar] botões
- [Salvar e Avançar]

// Linhas estimadas: 100-130
```

---

### Tarefa 3: Integrar Steps 9-12 e 14-17 em PropertyEditorPage

**Imports a Adicionar:**
```typescript
import { PropertyStep9ResidentialPricing } from '../components/properties/steps/financial/PropertyStep9ResidentialPricing';
import { PropertyStep10SeasonalConfig } from '../components/properties/steps/financial/PropertyStep10SeasonalConfig';
import { PropertyStep11IndividualPricing } from '../components/properties/steps/financial/PropertyStep11IndividualPricing';
import { PropertyStep12DerivedPricing } from '../components/properties/steps/financial/PropertyStep12DerivedPricing';
import { PropertyStep14BookingConfig } from '../components/properties/steps/settings/PropertyStep14BookingConfig';
import { PropertyStep15TagsGroups } from '../components/properties/steps/settings/PropertyStep15TagsGroups';
import { PropertyStep16ICalSync } from '../components/properties/steps/settings/PropertyStep16ICalSync';
import { PropertyStep17OTAIntegrations } from '../components/properties/steps/settings/PropertyStep17OTAIntegrations';
```

**Cases a Adicionar no Switch:**
```typescript
case PropertyStepId.RESIDENTIAL_PRICING:
  return (
    <PropertyStep9ResidentialPricing
      data={draftData.residentialPricing || property.residentialPricing || {}}
      errors={visibleErrors}
      onChange={(field, value) => {
        setDraftData({
          ...draftData,
          residentialPricing: { ...(draftData.residentialPricing || property.residentialPricing || {}), [field]: value }
        });
        setShowValidation(false);
      }}
      onSave={async () => {
        setShowValidation(true);
        const dataToSave = draftData.residentialPricing || property.residentialPricing || {};
        const result = await saveStep(currentStep, { residentialPricing: dataToSave });
        if (result.success) {
          handleNextStep();
          setDraftData({});
          setShowValidation(false);
        }
      }}
      isSaving={isSaving}
    />
  );

// ... Repetir para Steps 10, 11, 12, 14, 15, 16, 17
// (total de 8 cases similares)
```

**Checklist PropertyEditorPage:**
- [ ] Todos os 8 imports adicionados
- [ ] Todos os 8 cases no switch
- [ ] Nomes de campos consistentes (camelCase)
- [ ] Sem erros de compilação

---

### Tarefa 4: Validação Final

**Testes a Fazer:**
- [ ] Navegar todos os 17 steps usando sidebar
- [ ] Clicar em cada aba de bloco (Conteúdo → Financeiro → Configurações)
- [ ] Verificar que volta ao primeiro step de cada bloco
- [ ] Usar botões Anterior/Avançar em todos os steps
- [ ] Preencher campo em Step 1 e "Salvar e Avançar"
- [ ] Voltar ao Step 1 e verificar que dado foi preservado
- [ ] Verificar progress bar atualiza (1/17, 2/17, etc)
- [ ] Verificar badges aparecem corretamente
- [ ] Rodar `npm run build` ou equivalente
- [ ] Sem erros em console do navegador

**Compilação:**
- [ ] 0 erros TypeScript
- [ ] 0 warnings não-essenciais
- [ ] Todos os imports resolvidos

---

## 📊 Estimativa de Tempo

| Tarefa | Tempo |
|--------|-------|
| Criar 4 steps Financeiro | 30-40 min |
| Criar 4 steps Configurações | 30-40 min |
| Integrar em PropertyEditorPage | 15-20 min |
| Testes e validação | 10-15 min |
| **Total** | **85-115 min (~1.5h)** |

---

## 🎯 Critério de Sucesso

✅ **Sessão será sucesso se:**
- 17 steps todos navegáveis
- 0 erros de compilação
- Todos os 8 steps placeholder preenchidos
- PropertyEditorPage integrado com tudo
- Documentação atualizada

---

## 💡 Dicas Implementação

1. **Copy-Paste do Padrão:**
   - Use Step 2 Location como template
   - Copy a estrutura: Header → Fields → Save Button
   - Customize apenas os campos

2. **Ser Consistente:**
   - Mesmo className para buttons
   - Mesmo layout de form
   - Mesmo padrão de onChange/onSave

3. **Não Overengineer:**
   - Placeholders podem ser bem simples
   - Implementação real vem depois
   - Foco na estrutura agora

4. **Testar Incrementalmente:**
   - Criar 1 step → testar → próximo
   - Não fazer todos os 8 de uma vez

---

## 🔍 Validação Antes de Commitar

```bash
# 1. Verificar erros TypeScript
npm run build

# 2. Verificar testes
npm run test

# 3. Verificar lint
npm run lint

# 4. Verificar imports
grep -r "PropertyStep[0-9]" pages/PropertyEditorPage.tsx
```

---

## 📋 Pré-Requisitos Próxima Sessão

- [ ] Relembrar estrutura de PropertyEditorPage.tsx
- [ ] Relembrar interface PropertyStepXProps
- [ ] Relembrar padrão de componentes
- [ ] Ter `propertySteps.ts` aberto como referência
- [ ] Documentação deste documento à mão

---

## 🚀 Go-Live Sequence

**Fase 1 (Atual):** ✅ COMPLETA
- Estrutura base (17 steps)
- 9 componentes implementados
- Navegação funcional

**Fase 2 (Próxima):** 📍 A FAZER
- 8 componentes placeholder
- Integração total
- Pronto para testes

**Fase 3 (Depois):** 🔜 FUTURE
- Implementação real
- Lógica de negócio
- Integração backend

**Fase 4 (Depois):** 🔜 FUTURE
- Testes completos
- Go-live staging
- Go-live produção

---

**Boa sorte! Você tem todos os componentes prontos, é só integrar! 🚀**

