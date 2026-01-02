# Integração do MedicalNotesEditor - Documentação Completa

## 📋 Visão Geral

O `MedicalNotesEditor` é um componente avançado de editor de notas médicas com suporte a:
- **Múltiplas abas** (criação, renomeação, remoção)
- **Modo Avançado** (Quill Rich Text Editor com HTML)
- **Modo Simples** (Textarea com texto plano)
- **Sincronização automática** com array de MedicalNotes
- **Preparação para IA** (seleção de texto com menu de ações)

## 🎯 Como Usar

### 1. Importar o Componente

```tsx
import { MedicalNotesEditor, type MedicalNote } from "@/components/medical-notes-editor"
```

### 2. Estrutura de Dados

O componente trabalha com um array de `MedicalNote`:

```typescript
interface MedicalNote {
  id?: string              // ID do banco (opcional ao criar)
  title: string            // Título da aba/nota
  content: string          // Conteúdo (HTML ou texto plano)
  mode: "advanced" | "simple"  // Modo do editor
  order: number            // Ordem de exibição
  allowFutureUse?: boolean // Permite reutilizar a nota em atendimentos futuros
}
```

### 3. Integração Básica no Formulário

```tsx
const [medicalNotes, setMedicalNotes] = useState<MedicalNote[]>([])

// No JSX:
<MedicalNotesEditor 
  medicalNotes={medicalNotes}
  onChange={setMedicalNotes}
/>
```

**Comportamento:**
- **Sem notas iniciais**: Cria 3 abas padrão (Queixa Principal, História Atual, Exame Físico)
- **Com notas carregadas**: Reconstrói as abas a partir do array
- **onChange**: Disparado sempre que qualquer aba mudar (título, conteúdo, ordem)

---

## 📤 Enviando os Dados via Formulário

### 1. Preparar o Payload

Ao enviar para a API, inclua o array `medicalNotes`:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  const payload = {
    patientId: formData.patientId,
    professionalId: formData.professionalId,
    attendanceDate: formData.attendanceDate,
    bloodPressure: formData.bloodPressure,
    heartRate: formData.heartRate,
    temperature: formData.temperature,
    respiratoryRate: formData.respiratoryRate,
    status: formData.status,
    // Array de notas médicas
    medicalNotes: medicalNotes.filter(note => note.content.trim() !== ""),
  }
  
  try {
    if (attendanceId) {
      await api.put(`/attendances/${attendanceId}`, payload)
    } else {
      await api.post('/attendances', payload)
    }
    
    router.push('/admin/atendimentos')
  } catch (error) {
    console.error('Erro ao salvar:', error)
  }
}
```

### 2. Exemplo de Payload Completo

```json
{
  "patientId": "patient-123",
  "professionalId": "prof-456",
  "attendanceDate": "2025-12-29T14:30",
  "bloodPressure": "120/80",
  "heartRate": 72,
  "temperature": 37.5,
  "respiratoryRate": 16,
  "status": "EmAndamento",
  "medicalNotes": [
    {
      "title": "Queixa Principal",
      "content": "<p><strong>Dor de cabeça</strong> intensa há 2 dias</p>",
      "mode": "advanced",
      "order": 0,
      "allowFutureUse": true
    },
    {
      "title": "História Atual",
      "content": "• Dor pulsátil\n• Fotofobia\n• Náuseas leves",
      "mode": "simple",
      "order": 1,
      "allowFutureUse": false
    },
    {
      "title": "Exame Físico",
      "content": "Paciente alerta e orientado. Sem sinais neurológicos focais.",
      "mode": "simple",
      "order": 2,
      "allowFutureUse": false
    }
  ]
}
```

---

## 📥 Carregando os Dados na Edição

### 1. Estrutura no Hook useEffect

Quando um `attendanceId` é fornecido, carregue os dados:

```tsx
const [medicalNotes, setMedicalNotes] = useState<MedicalNote[]>([])

useEffect(() => {
  const loadData = async () => {
    try {
      setIsLoading(true)
      
      if (attendanceId) {
        const attRes = await api.get(`/attendances/${attendanceId}`)
        const att = attRes.data
        
        // Sincronizar formData
        setFormData({
          patientId: att.patientId,
          professionalId: att.professionalId,
          attendanceDate: formatDateToLocal(new Date(att.attendanceDate)),
          bloodPressure: att.bloodPressure || "",
          heartRate: att.heartRate || "",
          temperature: att.temperature || "",
          respiratoryRate: att.respiratoryRate || "",
          status: att.status || "EmAndamento",
        })
        
        // Carregar notas médicas
        if (att.medicalNotes && Array.isArray(att.medicalNotes)) {
          setMedicalNotes(att.medicalNotes)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar atendimento:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  loadData()
}, [attendanceId])
```

### 2. O MedicalNotesEditor Reconstrói as Abas

Uma vez que `medicalNotes` é atualizado, o componente automaticamente:
- **Ordena** por `order`
- **Cria abas** com os títulos carregados
- **Preenche conteúdo** de cada aba
- **Define modo** (advanced/simple) baseado na primeira nota

---

## 🎨 Comportamento das Abas

### Abas Padrão (sem dados carregados)
O componente inicia com 3 abas:
1. **Queixa Principal**
2. **História Atual**
3. **Exame Físico**

### Criando Novas Abas
- Clique no botão **"+"** para criar abas adicionais
- Novas abas são incluídas no array `medicalNotes`
- Order é incrementado automaticamente

### Renomeando Abas
- Clique **duas vezes** no nome da aba
- Digite o novo nome e pressione **Enter** ou clique fora
- Mudanças de título são refletidas no array

### Removendo Abas
- Passe o mouse sobre a aba
- Clique no **"X"** para remover
- Aba é removida do array `medicalNotes`

---

## 💾 Modo Avançado vs Simples

### Modo Avançado (Quill)
- Conteúdo é salvo como **HTML**
- `mode: "advanced"`
- Suporta formatação rica (bold, italic, links, listas, cores)

```json
{
  "title": "Avaliação",
  "content": "<p><strong>Paciente</strong> apresenta <em>melhora</em></p>",
  "mode": "advanced",
  "order": 0
}
```

### Modo Simples (Textarea)
- Conteúdo é salvo como **texto plano**
- `mode: "simple"`
- Suporta tópicos/subtópicos com símbolos

```json
{
  "title": "Observações",
  "content": "• Tópico 1:\n  ◦ Subtópico 1\n  ◦ Subtópico 2",
  "mode": "simple",
  "order": 1
}
```

**Importante:** Todos as abas compartilham o mesmo modo (advanced ou simple) durante a edição.

---

## 🚀 Fluxo Completo: Criar → Enviar → Editar

### 1️⃣ Criar Novo Atendimento
```
User abre CriarAtendimentoView (sem attendanceId)
  ↓
medicalNotes = [] (vazio)
  ↓
MedicalNotesEditor cria 3 abas padrão automaticamente
  ↓
User preenche dados incluindo notas
  ↓
onChange atualiza medicalNotes com array de 3+ notas
  ↓
User clica "Salvar"
  ↓
handleSubmit envia POST /attendances com payload:
  { ...formData, medicalNotes: [...] }
  ↓
API cria atendimento + cria registros em MedicalNote
  ↓
Router redireciona para lista
```

### 2️⃣ Editar Atendimento Existente
```
User clica para editar atendimento (com attendanceId)
  ↓
useEffect carrega dados via GET /attendances/{id}
  ↓
setMedicalNotes(att.medicalNotes)
  ↓
MedicalNotesEditor recebe array via prop "medicalNotes"
  ↓
Componente reconstrói abas a partir do array (sorted by order)
  ↓
User faz alterações (edita conteúdo, adiciona/remove abas)
  ↓
onChange atualiza medicalNotes automaticamente
  ↓
User clica "Salvar"
  ↓
handleSubmit envia PUT /attendances/{id} com:
  { ...formData, medicalNotes: [...] }
  ↓
API deleta notas antigas e cria novas (comportamento do backend)
  ↓
Router redireciona
```

---

## 🔄 Sincronização de Dados

### Props do MedicalNotesEditor
```tsx
interface MedicalNotesEditorProps {
  medicalNotes?: MedicalNote[]
  onChange: (notes: MedicalNote[]) => void
}
```

### onChange Callback
Chamado sempre que:
- Conteúdo de qualquer aba mudar
- Título de aba for renomeado
- Aba for adicionada
- Aba for removida
- Modo (advanced/simple) for alternado

```tsx
const handleNotesChange = (notes: MedicalNote[]) => {
  console.log('Notas atualizadas:', notes)
  setMedicalNotes(notes)
}
```

**Array retornado:**
```typescript
[
  { title: "Aba 1", content: "...", mode: "advanced", order: 0 },
  { title: "Aba 2", content: "...", mode: "advanced", order: 1 },
  { title: "Aba 3", content: "...", mode: "advanced", order: 2 }
]
```

---

## ⚠️ Pontos Importantes

### 1. Validação de Campos Obrigatórios

Valide que há pelo menos uma nota com conteúdo:

```tsx
const hasValidNote = medicalNotes.some(note => note.content && note.content.trim() !== "")

if (!hasValidNote) {
  setAlert('Por favor, preencha pelo menos uma nota médica', 'error')
  return
}
```

### 2. Filtrar Notas Vazias ao Enviar

Remova notas sem conteúdo antes de enviar:

```tsx
const payload = {
  ...formData,
  medicalNotes: medicalNotes.filter(note => note.content.trim() !== "")
}
```

### 3. Substituição Completa no PUT

⚠️ **Importante:** Ao fazer PUT com `medicalNotes`, o backend **deleta todas as notas antigas** e cria novas.

Não é possível fazer update parcial. Se quiser preservar IDs, implemente lógica adicional no backend.

### 4. Order é Crítico

O campo `order` determina a sequência das abas. Certifique-se de que:
- Começa em 0
- É sequencial (0, 1, 2, ...)
- Não há duplicatas

### 5. Modo Único por Sessão

Durante a edição, todas as abas compartilham o mesmo `mode`:
- Se alternar para Advanced, TODAS viram HTML
- Se alternar para Simple, TODAS viram texto plano

---

## 📝 Exemplo Completo em CriarAtendimentoView

```tsx
export default function CriarAtendimentoView({ attendanceId }: Props) {
  const [formData, setFormData] = useState({
    patientId: "",
    professionalId: "",
    attendanceDate: formatDateToLocal(new Date()),
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    status: "EmAndamento",
  })

  const [medicalNotes, setMedicalNotes] = useState<MedicalNote[]>([])

  // 1. Carregar dados na edição
  useEffect(() => {
    if (attendanceId) {
      api.get(`/attendances/${attendanceId}`).then(res => {
        const att = res.data
        setFormData(prev => ({ ...prev, ...att }))
        if (att.medicalNotes) {
          setMedicalNotes(att.medicalNotes)
        }
      })
    }
  }, [attendanceId])

  // 2. Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasValidNote = medicalNotes.some(n => n.content.trim())
    if (!hasValidNote) {
      alert('Preencha pelo menos uma nota')
      return
    }
    
    const payload = {
      ...formData,
      medicalNotes: medicalNotes.filter(n => n.content.trim())
    }
    
    const method = attendanceId ? 'put' : 'post'
    const url = attendanceId 
      ? `/attendances/${attendanceId}` 
      : '/attendances'
    
    await api[method](url, payload)
    router.push('/admin/atendimentos')
  }

  // 3. Render
  return (
    <form onSubmit={handleSubmit}>
      {/* Outros campos... */}
      
      <MedicalNotesEditor 
        medicalNotes={medicalNotes}
        onChange={setMedicalNotes}
      />
      
      <button type="submit">Salvar</button>
    </form>
  )
}
```

---

## 🎓 Próximos Passos

### Implementar Ações de IA
As ações "Melhorar", "Simplificar" e "Criar tópicos" estão como stubs. Para integrar:

```tsx
// Em medical-notes-editor.tsx
const aiActions = [
  {
    icon: Wand2,
    label: "Melhorar",
    action: async () => {
      const improved = await api.post('/ai/improve', { text: selectedText })
      // Inserir texto melhorado no editor
      setShowAiMenu(false)
    },
  }
]
```

### Histórico de Versões
Implemente versionamento de notas:
- Salvar snapshot antes de cada PUT
- Permitir rollback para versão anterior
- Exibir diff entre versões

### Anexos e Imagens
Permitir upload de imagens/arquivos nas notas:
- Botão de anexo no toolbar do Quill
- Upload para storage (S3/local)
- Inserir URL no conteúdo HTML

---

**Documento atualizado:** 29/12/2025  
**Versão:** 2.0 (Migração para medicalNotes array)

---

## 📤 Enviando os Dados via Formulário

### 1. Preparar o Payload

Ao enviar para a API, os dados das notas devem estar inclusos:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  const payload = {
    patientId: formData.patientId,
    professionalId: formData.professionalId,
    attendanceDate: formData.attendanceDate,
    // Dados das notas médicas
    chiefComplaint: formData.chiefComplaint,
    presentingIllness: formData.presentingIllness,
    medicalHistory: formData.medicalHistory,
    physicalExamination: formData.physicalExamination,
    diagnosis: formData.diagnosis,
    treatment: formData.treatment,
    // Vitais e outros
    bloodPressure: formData.bloodPressure,
    heartRate: formData.heartRate,
    temperature: formData.temperature,
    respiratoryRate: formData.respiratoryRate,
    status: formData.status,
  }
  
  try {
    setIsSubmitting(true)
    
    if (attendanceId) {
      // Atualizar atendimento existente
      await api.put(`/attendances/${attendanceId}`, payload)
      setAlert({ type: 'success', message: 'Atendimento atualizado com sucesso' })
    } else {
      // Criar novo atendimento
      await api.post('/attendances', payload)
      setAlert({ type: 'success', message: 'Atendimento criado com sucesso' })
    }
    
    router.push('/admin/atendimentos')
  } catch (error) {
    console.error('Erro ao salvar atendimento:', error)
    setAlert({ type: 'error', message: 'Erro ao salvar atendimento' })
  } finally {
    setIsSubmitting(false)
  }
}
```

### 2. Exemplo de Payload Completo

```json
{
  "patientId": "patient-123",
  "professionalId": "prof-456",
  "attendanceDate": "2025-12-29T14:30",
  "chiefComplaint": "Dor de cabeça intensa",
  "presentingIllness": "<p>Iniciou há 2 dias, acompanhada de febre</p>",
  "medicalHistory": "• Histórico familiar de migrânea:\n  ◦ Mãe tinha episódios frequentes",
  "physicalExamination": "Paciente apresenta fotofobia moderada",
  "diagnosis": "Migrânea com aura",
  "treatment": "Prescrever analgésico e repouso",
  "bloodPressure": "120/80",
  "heartRate": 72,
  "temperature": 37.5,
  "respiratoryRate": 16,
  "status": "EmAndamento"
}
```

---

## 📥 Carregando os Dados na Edição

### 1. Estrutura no Hook useEffect

Quando um `attendanceId` é fornecido, carregue os dados:

```tsx
useEffect(() => {
  const loadData = async () => {
    try {
      setIsLoading(true)
      
      if (attendanceId) {
        // Carregar atendimento existente
        const attRes = await api.get(`/attendances/${attendanceId}`)
        const att = attRes.data
        
        // Sincronizar formData com os dados da API
        setFormData((prev) => ({
          ...prev,
          patientId: att.patientId,
          professionalId: att.professionalId,
          attendanceDate: formatDateToLocal(new Date(att.attendanceDate)),
          // Notas médicas
          chiefComplaint: att.chiefComplaint || "",
          presentingIllness: att.presentingIllness || "",
          medicalHistory: att.medicalHistory || "",
          physicalExamination: att.physicalExamination || "",
          diagnosis: att.diagnosis || "",
          treatment: att.treatment || "",
          // Vitais
          bloodPressure: att.bloodPressure || "",
          heartRate: att.heartRate || "",
          temperature: att.temperature || "",
          respiratoryRate: att.respiratoryRate || "",
          status: att.status || AttendanceStatus.EmAndamento,
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar atendimento:', error)
      setAlert({ type: 'error', message: 'Erro ao carregar dados' })
    } finally {
      setIsLoading(false)
    }
  }
  
  loadData()
}, [attendanceId])
```

### 2. O MedicalNotesEditor Sincroniza Automaticamente

Uma vez que `formData` é atualizado, o componente reflete as mudanças:

```tsx
<MedicalNotesEditor 
  data={{
    chiefComplaint: formData.chiefComplaint,      // ← Preenchido automaticamente
    presentingIllness: formData.presentingIllness,
    medicalHistory: formData.medicalHistory,
    physicalExamination: formData.physicalExamination,
    diagnosis: formData.diagnosis,
    treatment: formData.treatment
  }}
  onChange={handleNotesChange}
/>
```

---

## 🎨 Comportamento das Abas

### Abas Padrão
O componente inicia com 3 abas:
1. **Queixa Principal** → `chiefComplaint`
2. **História Atual** → `presentingIllness`
3. **Exame Físico** → `physicalExamination`

### Criando Novas Abas
- Clique no botão **"+"** para criar abas adicionais
- Essas abas **não sincronizam** automaticamente com formData
- Use para organizações temporárias de anotações

### Renomeando Abas
- Clique **duas vezes** no nome da aba
- Digite o novo nome e pressione **Enter** ou clique fora

### Removendo Abas
- Passe o mouse sobre a aba
- Clique no **"X"** para remover
- Abas padrão não podem ser removidas se forem as únicas

---

## 💾 Tratamento de Modo Avançado vs Simples

### Modo Avançado (Quill)
- Conteúdo é salvo como **HTML**
- Suporta formatação rica (bold, italic, links, etc.)
- Ideal para documentação detalhada

```tsx
// Salvo como:
"<p><strong>Paciente apresenta</strong> sintomas de gripe</p>"
```

### Modo Simples (Textarea)
- Conteúdo é salvo como **texto plano**
- Suporta tópicos/subtópicos com símbolos
- Mais rápido e direto

```tsx
// Salvo como:
"• Tópico 1:\n  ◦ Subtópico 1\n  ◦ Subtópico 2"
```

---

## 🚀 Fluxo Completo: Criar → Enviar → Editar

### 1️⃣ Criar Novo Atendimento
```
User abre CriarAtendimentoView (sem attendanceId)
  ↓
formData inicia vazio
  ↓
User preenche dados incluindo notas no MedicalNotesEditor
  ↓
User clica "Salvar"
  ↓
handleSubmit envia POST /attendances com payload completo
  ↓
API retorna sucesso
  ↓
Router redireciona para lista de atendimentos
```

### 2️⃣ Editar Atendimento Existente
```
User clica para editar atendimento (com attendanceId)
  ↓
useEffect carrega dados via GET /attendances/{id}
  ↓
formData é preenchido com dados da API
  ↓
MedicalNotesEditor recebe dados via prop "data"
  ↓
Abas são sincronizadas automaticamente
  ↓
User faz alterações nos campos
  ↓
User clica "Salvar"
  ↓
handleSubmit envia PUT /attendances/{id} com payload atualizado
  ↓
API retorna sucesso
  ↓
Router redireciona para lista
```

---

## 🔄 Sincronização de Dados

### Props do MedicalNotesEditor
```tsx
interface MedicalNotesEditorProps {
  data: {
    chiefComplaint: string
    presentingIllness: string
    medicalHistory: string
    physicalExamination: string
    diagnosis: string
    treatment: string
  }
  onChange: (field: string, value: string) => void
}
```

### onChange Callback
Chamado sempre que o conteúdo de uma aba padrão mudar:

```tsx
const handleNotesChange = (field: string, value: string) => {
  console.log(`Campo ${field} foi atualizado para:`, value)
  setFormData(prev => ({
    ...prev,
    [field]: value
  }))
}
```

**Campos possíveis:**
- `"chiefComplaint"`
- `"presentingIllness"`
- `"medicalHistory"`
- `"physicalExamination"`
- `"diagnosis"`
- `"treatment"`

---

## ⚠️ Pontos Importantes

### 1. Validação de Campos Obrigatórios
Se algum campo é obrigatório na API, valide antes de enviar:

```tsx
if (!formData.chiefComplaint.trim()) {
  setAlert({ type: 'error', message: 'Queixa Principal é obrigatória' })
  return
}
```

### 2. HTML vs Texto Plano
Considere o modo do editor ao processar dados:

```tsx
// Se Quill está ativo (advancedMode = true), espere HTML
// Se Textarea está ativo (advancedMode = false), espere texto plano

// Na API, armazene ambos ou processe após receber
```

### 3. Abas Adicionais (Não-padrão)
As abas criadas pelo "+" não são sincronizadas automaticamente. Para salvá-las:
- Implemente estado adicional para rastrear abas extras
- Ou combine o conteúdo em um campo único antes de enviar

### 4. Compatibilidade com Mobile
O componente é responsivo, mas o Quill pode ter limitações em telas pequenas. Considere oferecer apenas modo "Simples" em mobile:

```tsx
const { isMobile } = useMobile() // hook customizado
const [advancedMode, setAdvancedMode] = useState(!isMobile)
```

---

## 📝 Exemplo Completo em CriarAtendimentoView

```tsx
export default function CriarAtendimentoView({ attendanceId }: Props) {
  const [formData, setFormData] = useState({
    patientId: "",
    professionalId: "",
    chiefComplaint: "",
    presentingIllness: "",
    medicalHistory: "",
    physicalExamination: "",
    diagnosis: "",
    treatment: "",
    // ... outros campos
  })

  // 1. Carregar dados na edição
  useEffect(() => {
    if (attendanceId) {
      api.get(`/attendances/${attendanceId}`).then(res => {
        setFormData(prev => ({
          ...prev,
          ...res.data // spread todos os campos
        }))
      })
    }
  }, [attendanceId])

  // 2. Handler para mudanças nas notas
  const handleNotesChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 3. Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const method = attendanceId ? 'put' : 'post'
    const url = attendanceId 
      ? `/attendances/${attendanceId}` 
      : '/attendances'
    
    await api[method](url, formData)
    router.push('/admin/atendimentos')
  }

  // 4. Render
  return (
    <form onSubmit={handleSubmit}>
      <MedicalNotesEditor 
        data={{
          chiefComplaint: formData.chiefComplaint,
          presentingIllness: formData.presentingIllness,
          medicalHistory: formData.medicalHistory,
          physicalExamination: formData.physicalExamination,
          diagnosis: formData.diagnosis,
          treatment: formData.treatment
        }}
        onChange={handleNotesChange}
      />
      
      <button type="submit">Salvar</button>
    </form>
  )
}
```

---

## 🎓 Próximos Passos

### Implementar Ações de IA
As ações "Melhorar", "Simplificar" e "Criar tópicos" estão como stubs. Para integrar:

```tsx
// Em medical-notes-editor.tsx, dentro de aiActions:
{
  icon: Wand2,
  label: "Melhorar",
  action: async () => {
    const improved = await callAiService(selectedText, "improve")
    // Inserir texto melhorado no editor
    setShowAiMenu(false)
  },
}
```

### Salvar Abas Adicionais
Para persistir abas extras criadas pelo usuário:
- Adicione campo `customTabs` no tipo `Attendance`
- Rastreie em estado separado no componente
- Serialize JSON ao enviar

### Validação em Tempo Real
Adicione validação conforme o usuário digita:
- Aviso de campos vazios obrigatórios
- Contador de palavras
- Sugestões de formatação

---

**Documento atualizado:** 29/12/2025
**Versão:** 1.0
