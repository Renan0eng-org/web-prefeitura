# Documentação - Módulo de Atendimento

## Visão Geral
Módulo para gerenciar atendimentos de pacientes, com suporte para criar atendimentos a partir de agendamentos existentes ou criar novos atendimentos do zero.

---

## 1. Estrutura do Banco de Dados

### Tabela: `appointments` (Já Existente)
```sql
CREATE TABLE appointments (
    id VARCHAR(36) PRIMARY KEY,
    patientId VARCHAR(36) NOT NULL,
    professionalId VARCHAR(36) NOT NULL,
    scheduledAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('Pendente', 'Confirmado', 'Cancelado', 'Completo') DEFAULT 'Pendente',
    notes TEXT,
    FOREIGN KEY (patientId) REFERENCES patients(id),
    FOREIGN KEY (professionalId) REFERENCES professionals(id),
    INDEX idx_status (status),
    INDEX idx_scheduledAt (scheduledAt),
    INDEX idx_patientId (patientId)
);
```

### Tabela: `attendances` (Nova - Atendimentos)
```sql
CREATE TABLE attendances (
    id VARCHAR(36) PRIMARY KEY,
    appointmentId VARCHAR(36),
    patientId VARCHAR(36) NOT NULL,
    professionalId VARCHAR(36) NOT NULL,
    attendanceDate DATETIME NOT NULL,
    
    -- Informações Clínicas
    chiefComplaint TEXT NOT NULL,                    -- Queixa principal
    presentingIllness TEXT,                          -- História da doença atual
    medicalHistory TEXT,                             -- Histórico médico
    physicalExamination TEXT,                        -- Exame físico
    diagnosis TEXT,                                  -- Diagnóstico
    treatment TEXT,                                  -- Tratamento recomendado
    
    -- Métricas Vitais (se necessário)
    bloodPressure VARCHAR(20),                       -- Ex: 120/80
    heartRate INT,                                   -- Batimentos por minuto
    temperature DECIMAL(5, 2),                       -- Em Celsius
    respiratoryRate INT,                             -- Respirações por minuto
    
    -- Status
    status ENUM('Em Andamento', 'Concluído', 'Cancelado') DEFAULT 'Em Andamento',
    
    -- Auditoria
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createdBy VARCHAR(36),
    
    FOREIGN KEY (appointmentId) REFERENCES appointments(id),
    FOREIGN KEY (patientId) REFERENCES patients(id),
    FOREIGN KEY (professionalId) REFERENCES professionals(id),
    FOREIGN KEY (createdBy) REFERENCES users(id),
    
    INDEX idx_status (status),
    INDEX idx_appointmentId (appointmentId),
    INDEX idx_patientId (patientId),
    INDEX idx_attendanceDate (attendanceDate),
    INDEX idx_professionalId (professionalId)
);
```

### Tabela: `attendance_prescriptions` (Opcional - Prescrições)
```sql
CREATE TABLE attendance_prescriptions (
    id VARCHAR(36) PRIMARY KEY,
    attendanceId VARCHAR(36) NOT NULL,
    medication VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,                    -- Ex: "500mg"
    frequency VARCHAR(100) NOT NULL,                 -- Ex: "8 em 8 horas"
    duration VARCHAR(100) NOT NULL,                  -- Ex: "10 dias"
    instructions TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (attendanceId) REFERENCES attendances(id) ON DELETE CASCADE,
    INDEX idx_attendanceId (attendanceId)
);
```

### Tabela: `attendance_attachments` (Opcional - Arquivos)
```sql
CREATE TABLE attendance_attachments (
    id VARCHAR(36) PRIMARY KEY,
    attendanceId VARCHAR(36) NOT NULL,
    fileName VARCHAR(255) NOT NULL,
    fileUrl VARCHAR(512) NOT NULL,
    fileType VARCHAR(50),                            -- Ex: "image/jpeg", "application/pdf"
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (attendanceId) REFERENCES attendances(id) ON DELETE CASCADE,
    INDEX idx_attendanceId (attendanceId)
);
```

---

## 2. Rotas API Backend

### Base URL: `/api/attendances`

#### 2.1 Listagem de Atendimentos
```
GET /attendances
Query Parameters:
  - page: number (default: 1)
  - pageSize: number (default: 10)
  - patientName: string (optional)
  - professionalName: string (optional)
  - status: 'Em Andamento' | 'Concluído' | 'Cancelado' (optional)
  - attendanceFrom: ISO string (optional)
  - attendanceTo: ISO string (optional)
  - createdFrom: ISO string (optional)
  - createdTo: ISO string (optional)
  - appointmentId: string (optional)

Response:
{
  "data": [
    {
      "id": "uuid",
      "appointmentId": "uuid | null",
      "patient": {
        "id": "uuid",
        "name": "string",
        "cpf": "string"
      },
      "professional": {
        "id": "uuid",
        "name": "string",
        "crm": "string"
      },
      "attendanceDate": "ISO string",
      "chiefComplaint": "string",
      "diagnosis": "string",
      "status": "Em Andamento | Concluído | Cancelado",
      "createdAt": "ISO string",
      "updatedAt": "ISO string"
    }
  ],
  "total": number,
  "page": number,
  "pageSize": number
}
```

#### 2.2 Obter Atendimento por ID
```
GET /attendances/:id

Response:
{
  "id": "uuid",
  "appointmentId": "uuid | null",
  "patientId": "uuid",
  "professionalId": "uuid",
  "attendanceDate": "ISO string",
  "chiefComplaint": "string",
  "presentingIllness": "string",
  "medicalHistory": "string",
  "physicalExamination": "string",
  "diagnosis": "string",
  "treatment": "string",
  "bloodPressure": "string",
  "heartRate": number,
  "temperature": number,
  "respiratoryRate": number,
  "status": "Em Andamento | Concluído | Cancelado",
  "patient": { ... },
  "professional": { ... },
  "createdAt": "ISO string",
  "updatedAt": "ISO string",
  "prescriptions": [
    {
      "id": "uuid",
      "medication": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "instructions": "string"
    }
  ],
  "attachments": [
    {
      "id": "uuid",
      "fileName": "string",
      "fileUrl": "string",
      "fileType": "string",
      "uploadedAt": "ISO string"
    }
  ]
}
```

#### 2.3 Criar Atendimento do Zero
```
POST /attendances
Content-Type: application/json

Request Body:
{
  "patientId": "uuid",
  "professionalId": "uuid",
  "attendanceDate": "ISO string",
  "chiefComplaint": "string",
  "presentingIllness": "string (optional)",
  "medicalHistory": "string (optional)",
  "physicalExamination": "string (optional)",
  "diagnosis": "string (optional)",
  "treatment": "string (optional)",
  "bloodPressure": "string (optional)",
  "heartRate": number (optional),
  "temperature": number (optional),
  "respiratoryRate": number (optional),
  "status": "Em Andamento | Concluído | Cancelado" (default: "Em Andamento")
}

Response: 
{
  "id": "uuid",
  "message": "Atendimento criado com sucesso"
}
```

#### 2.4 Criar Atendimento a partir de Agendamento
```
POST /attendances/from-appointment/:appointmentId
Content-Type: application/json

Request Body:
{
  "chiefComplaint": "string",
  "presentingIllness": "string (optional)",
  "medicalHistory": "string (optional)",
  "physicalExamination": "string (optional)",
  "diagnosis": "string (optional)",
  "treatment": "string (optional)",
  "status": "Em Andamento | Concluído" (default: "Em Andamento")
}

Response:
{
  "id": "uuid",
  "appointmentId": "uuid",
  "message": "Atendimento criado a partir do agendamento"
}
```

#### 2.5 Atualizar Atendimento
```
PUT /attendances/:id
Content-Type: application/json

Request Body:
{
  "chiefComplaint": "string (optional)",
  "presentingIllness": "string (optional)",
  "medicalHistory": "string (optional)",
  "physicalExamination": "string (optional)",
  "diagnosis": "string (optional)",
  "treatment": "string (optional)",
  "bloodPressure": "string (optional)",
  "heartRate": number (optional)",
  "temperature": number (optional)",
  "respiratoryRate": number (optional)",
  "status": "Em Andamento | Concluído | Cancelado" (optional)
}

Response:
{
  "message": "Atendimento atualizado com sucesso"
}
```

#### 2.6 Atualizar Status do Atendimento
```
PUT /attendances/:id/status
Content-Type: application/json

Request Body:
{
  "status": "Em Andamento | Concluído | Cancelado"
}

Response:
{
  "message": "Status atualizado com sucesso"
}
```

#### 2.7 Excluir Atendimento
```
DELETE /attendances/:id

Response:
{
  "message": "Atendimento excluído com sucesso"
}
```

---

### Rotas de Prescrições (Opcional)

#### 2.8 Adicionar Prescrição
```
POST /attendances/:attendanceId/prescriptions
Content-Type: application/json

Request Body:
{
  "medication": "string",
  "dosage": "string",
  "frequency": "string",
  "duration": "string",
  "instructions": "string (optional)"
}

Response:
{
  "id": "uuid",
  "message": "Prescrição adicionada com sucesso"
}
```

#### 2.9 Atualizar Prescrição
```
PUT /attendances/:attendanceId/prescriptions/:prescriptionId
Content-Type: application/json

Request Body:
{
  "medication": "string (optional)",
  "dosage": "string (optional)",
  "frequency": "string (optional)",
  "duration": "string (optional)",
  "instructions": "string (optional)"
}

Response:
{
  "message": "Prescrição atualizada com sucesso"
}
```

#### 2.10 Excluir Prescrição
```
DELETE /attendances/:attendanceId/prescriptions/:prescriptionId

Response:
{
  "message": "Prescrição excluída com sucesso"
}
```

---

### Rotas de Anexos (Opcional)

#### 2.11 Fazer Upload de Anexo
```
POST /attendances/:attendanceId/attachments
Content-Type: multipart/form-data

Form Data:
  - file: File

Response:
{
  "id": "uuid",
  "fileName": "string",
  "fileUrl": "string",
  "message": "Arquivo enviado com sucesso"
}
```

#### 2.12 Excluir Anexo
```
DELETE /attendances/:attendanceId/attachments/:attachmentId

Response:
{
  "message": "Arquivo excluído com sucesso"
}
```

---

## 3. Enum - Status de Atendimento

```typescript
enum AttendanceStatus {
  EmAndamento = "Em Andamento",
  Concluído = "Concluído",
  Cancelado = "Cancelado"
}
```

---

## 4. Permissões Necessárias

Adicionar ao sistema de permissões:

```json
{
  "atendimentos": {
    "visualizar": true,
    "criar": true,
    "editar": true,
    "excluir": true
  }
}
```

---

## 5. Campos da Tab de Atendimentos (Frontend)

### Colunas da Tabela:
- **Paciente** - Nome do paciente
- **Profissional** - Nome do profissional/médico
- **Data de Atendimento** - Data/Hora do atendimento
- **Queixa Principal** - Motivo da consulta
- **Diagnóstico** - Diagnóstico realizado
- **Status** - Em Andamento / Concluído / Cancelado
- **Criação** - Data/Hora de criação do registro
- **Ações** - Menu com opções (Visualizar, Editar, Concluir, Cancelar, Excluir)

### Filtros:
- **Nome do Paciente** - Input text
- **Nome do Profissional** - Input text
- **Data de Atendimento** - Date Range Picker
- **Data de Criação** - Date Range Picker
- **Status** - Radio Group (Em Andamento, Concluído, Cancelado, Todos)
- **Agendamento** - Filtrar por ID de agendamento (opcional)

### Exportação:
- Excel com colunas: Paciente, Profissional, Data Atendimento, Queixa Principal, Diagnóstico, Status, Data Criação

---

## 6. Fluxo de Uso

### Cenário 1: Criar Atendimento a partir de Agendamento
1. Usuário visualiza tab de Agendamentos
2. Clica em ação "Criar Atendimento" em um agendamento confirmado
3. Abre dialog/page com dados pré-preenchidos (paciente, profissional, data)
4. Preenche informações clínicas (queixa principal, diagnóstico, etc.)
5. Salva → Cria atendimento vinculado ao agendamento

### Cenário 2: Criar Atendimento do Zero
1. Usuário na tab de Atendimentos
2. Clica em botão "Novo Atendimento"
3. Abre dialog/page vazio
4. Seleciona paciente e profissional
5. Preenche todas as informações clínicas
6. Salva → Cria atendimento sem agendamento vinculado

---

## 7. Relacionamentos

```
Patients (1) ──── (N) Attendances
                       │
                       └─── (N) Attendance_Prescriptions
                       │
                       └─── (N) Attendance_Attachments

Professionals (1) ──── (N) Attendances

Appointments (1) ──── (N) Attendances (opcional)
```

---

## 8. Validações Recomendadas

### Backend:
- Verificar se paciente existe
- Verificar se profissional existe
- Validar data de atendimento (não no futuro)
- Verificar permissões do usuário
- Validar presença de campos obrigatórios

### Frontend:
- Campos obrigatórios: patientId, professionalId, attendanceDate, chiefComplaint
- Data não pode ser no futuro
- Queixa principal com mínimo de caracteres
- Validação de prescrições antes de salvar

---

## 9. Próximas Etapas

1. Criar modelo de dados (TypeScript interfaces)
2. Implementar componente AtendimentosTab.tsx (similar a AgendamentosTab)
3. Criar dialog para novo/editar atendimento
4. Implementar rotas no backend
5. Criar controllers e services
6. Testes automatizados
7. Documentação de API (Swagger/OpenAPI)

