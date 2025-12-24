export enum AttendanceStatus {
  EmAndamento = "Em Andamento",
  Concluido = "Concluido",
  Cancelado = "Cancelado"
}

export interface Patient {
  id: string
  name: string
  cpf: string
}

export interface Professional {
  id: string
  name: string
  crm?: string
}

export interface AttendancePrescription {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface AttendanceAttachment {
  id: string
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
