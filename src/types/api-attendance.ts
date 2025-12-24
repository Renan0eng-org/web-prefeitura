// API Request/Response Types

export interface CreateAttendanceRequest {
  patientId: string
  professionalId: string
  attendanceDate: string
  chiefComplaint: string
  presentingIllness?: string
  medicalHistory?: string
  physicalExamination?: string
  diagnosis?: string
  treatment?: string
  bloodPressure?: string
  heartRate?: number
  temperature?: number
  respiratoryRate?: number
  status?: AttendanceStatus
}

export interface UpdateAttendanceRequest {
  chiefComplaint?: string
  presentingIllness?: string
  medicalHistory?: string
  physicalExamination?: string
  diagnosis?: string
  treatment?: string
  bloodPressure?: string
  heartRate?: number
  temperature?: number
  respiratoryRate?: number
  status?: AttendanceStatus
}

export interface UpdateAttendanceStatusRequest {
  status: AttendanceStatus
}

export interface AttendanceListResponse {
  data: Attendance[]
  total: number
  page: number
  pageSize: number
}

export interface AttendanceDetailResponse extends Attendance {}

export interface CreateAttendanceResponse {
  id: string
  message: string
}

export interface UpdateAttendanceResponse {
  message: string
}

export interface DeleteAttendanceResponse {
  message: string
}

export interface ChangeAttendanceStatusResponse {
  message: string
}

// Enum
export enum AttendanceStatus {
  EmAndamento = "Em Andamento",
  Concluído = "Concluído",
  Cancelado = "Cancelado"
}

// Models
export interface Patient {
  id: string
  name: string
  cpf: string
  email?: string
  phone?: string
  birthDate?: string
}

export interface Professional {
  id: string
  name: string
  crm?: string
  specialization?: string
  email?: string
  phone?: string
}

export interface AttendancePrescription {
  id: string
  attendanceId: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  createdAt: string
}

export interface AttendanceAttachment {
  id: string
  attendanceId: string
  fileName: string
  fileUrl: string
  fileType: string
  uploadedAt: string
}

export interface Attendance {
  id: string
  appointmentId?: string
  patientId: string
  professionalId: string
  attendanceDate: string
  
  // Clinical Information
  chiefComplaint: string
  presentingIllness?: string
  medicalHistory?: string
  physicalExamination?: string
  diagnosis?: string
  treatment?: string
  
  // Vital Signs
  bloodPressure?: string
  heartRate?: number
  temperature?: number
  respiratoryRate?: number
  
  // Status and Metadata
  status: AttendanceStatus
  patient?: Patient
  professional?: Professional
  prescriptions?: AttendancePrescription[]
  attachments?: AttendanceAttachment[]
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface AttendanceFormData {
  patientId: string
  professionalId: string
  attendanceDate: string
  chiefComplaint: string
  presentingIllness?: string
  medicalHistory?: string
  physicalExamination?: string
  diagnosis?: string
  treatment?: string
  bloodPressure?: string
  heartRate?: string
  temperature?: string
  respiratoryRate?: string
  status?: AttendanceStatus
}
