# Guia de Integração - Módulo de Atendimentos

## Estrutura de Arquivos Criados

```
src/
├── types/
│   └── attendance.ts                          # Tipos e enums
├── components/
│   └── appointments/
│       └── AtendimentoDialog.tsx              # Dialog para criar/editar
├── views/
│   └── admin/
│       └── atendimentos/
│           └── AtendimentosTab.tsx            # Componente principal
└── app/
    └── admin/
        └── atendimentos/
            ├── layout.tsx                     # Layout da página
            └── page.tsx                       # Página principal
```

## Instalação

### 1. Componentes UI Necessários (Verificar Disponibilidade)

Os seguintes componentes do shadcn/ui já devem estar instalados:
- `Dialog` - Para criar/editar atendimentos
- `Select` - Para seleção de paciente/profissional
- `Textarea` - Para campos clínicos
- `Input` - Para inputs de texto
- `Badge` - Para status
- `Button` - Botões gerais
- `Table` - Listagem
- `DateRangePicker` - Filtros de data
- `RadioGroup` - Filtros de status
- `Skeleton` - Carregamento
- `Pagination` - Paginação

Se algum não estiver instalado, use:
```bash
npx shadcn-ui@latest add [component-name]
```

### 2. Permissões Necessárias

Adicione ao seu sistema de permissões as seguintes entradas:

```typescript
// Na tabela de permissões do backend
{
  "recurso": "atendimento",
  "modulo": "atendimentos",
  "permissoes": {
    "visualizar": true,
    "criar": true,
    "editar": true,
    "excluir": true
  }
}
```

### 3. Configurar API

Os endpoints esperados são:

```
GET    /attendances           - Listagem paginada
GET    /attendances/:id       - Detalhe
POST   /attendances           - Criar
PUT    /attendances/:id       - Atualizar
PUT    /attendances/:id/status - Mudar status
DELETE /attendances/:id       - Excluir

GET    /patients?pageSize=1000   - Lista de pacientes
GET    /professionals?pageSize=1000 - Lista de profissionais
```

## Funcionalidades Implementadas

### AtendimentosTab.tsx

✅ **Listagem**
- Paginação completa
- Colunas customizáveis (localStorage)
- Filtros avançados:
  - Nome do paciente
  - Nome do profissional
  - Data de atendimento (range)
  - Data de criação (range)
  - Status (Em Andamento, Concluído, Cancelado)
- Exportação para Excel
- Atualizar dados em tempo real

✅ **Ações por Item**
- Visualizar (read-only)
- Editar (se houver permissão)
- Marcar como Concluído
- Cancelar
- Excluir (se houver permissão)

✅ **Permissões**
- Verifica `atendimento.visualizar` antes de mostrar a tab
- Verifica `atendimento.criar` para botão "Novo Atendimento"
- Verifica `atendimento.editar` para ações de edição/status
- Verifica `atendimento.excluir` para ação de exclusão

✅ **UX/Design**
- Padrão visual consistente com AgendamentosTab
- Loading skeletons
- Feedback com alertas
- Dialog responsivo
- Estados vazios tratados

### AtendimentoDialog.tsx

✅ **Campos Clínicos**
- Queixa principal (obrigatório)
- História da doença atual
- Histórico médico
- Exame físico
- Diagnóstico
- Tratamento recomendado

✅ **Métricas Vitais**
- Pressão arterial
- Frequência cardíaca (bpm)
- Temperatura (°C)
- Frequência respiratória (rpm)

✅ **Seleção de Entidades**
- Dropdown de pacientes (carregamento automático)
- Dropdown de profissionais (carregamento automático)
- Data/hora do atendimento

✅ **Modo Visualização**
- `visibleOnly` prop desabilita todos os campos
- Mostra botão "Fechar" em vez de "Cancelar"
- Apropriado para leitura de registros

## Configuração de Permissões no Sistema

Se estiver usando o sistema de permissões baseado em níveis de acesso, adicione ao menu de permissões:

```typescript
// Exemplo da estrutura esperada
{
  recurso: "atendimento",
  permissoes: {
    visualizar: boolean,
    criar: boolean,
    editar: boolean,
    excluir: boolean
  }
}
```

## Notas Importantes

1. **Validações Backend**: Certifique-se que o backend valida:
   - Existência de paciente e profissional
   - Data de atendimento não pode ser futura
   - Campos obrigatórios

2. **Relacionamentos**:
   - Atendimento pode estar vinculado a um Agendamento (appointmentId opcional)
   - Sempre deve ter patientId, professionalId, attendanceDate, chiefComplaint

3. **Status**:
   - Enum com 3 valores: "Em Andamento", "Concluído", "Cancelado"
   - Padrão ao criar: "Em Andamento"

4. **Exportação Excel**:
   - Inclui colunas: Paciente, Profissional, Data, Queixa, Diagnóstico, Criação, Status
   - Arquivo nomeado: `atendimentos.xlsx`

5. **Localização**:
   - Todos os textos em Português Brasil
   - Datas formatadas com `pt-BR`

## Próximos Passos no Backend

1. Criar tabelas no banco de dados (ver [atendimento-module.md](./atendimento-module.md))
2. Implementar controllers e services
3. Configurar rotas e middleware de autenticação
4. Validar permissões em cada endpoint
5. Adicionar logs de auditoria

## Testes Recomendados

```bash
# Criar atendimento do zero
POST /attendances {
  patientId: "uuid",
  professionalId: "uuid",
  attendanceDate: "2025-12-24T14:30:00",
  chiefComplaint: "Dor de cabeça"
}

# Listar com filtros
GET /attendances?patientName=João&status=Em Andamento&page=1&pageSize=10

# Atualizar status
PUT /attendances/{id}/status {
  status: "Concluído"
}

# Exportar Excel
GET /attendances?pageSize=1000 → converter para XLSX
```

## Suporte

Para dúvidas sobre a integração, consulte:
- [Documentação do Módulo](./atendimento-module.md)
- Componente AgendamentosTab como referência
- Tipos em `src/types/attendance.ts`
