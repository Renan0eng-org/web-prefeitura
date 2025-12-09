// types/form-builder.ts

export interface FormQuestionOption {
  idOption: string;
  text: string;
  value?: number | null;
}

// Expanda os tipos de pergunta aqui
export type QuestionType = 'MULTIPLE_CHOICE' | 'SHORT_TEXT' | 'PARAGRAPH' | 'CHECKBOXES';

export interface FormQuestion {
  idQuestion: string;
  text: string;
  type: QuestionType;
  required: boolean; // Nova propriedade!
  options: FormQuestionOption[];
}

export interface ScoreRule {
  minScore: number;
  maxScore: number;
  classification: string;
  conduct: string;
  targetUserId: string;
  order: number;
}

export interface FormState {
  title: string;
  description: string;
  questions: FormQuestion[];
  scoreRules?: ScoreRule[];
}

// Tipo para o usuário que respondeu
export interface FormSubmitter {
  idUser: string;
  name: string;
  email: string;
}

// Tipo para a lista de respostas (Tela 1)
export interface FormResponseSummary {
  idResponse: string; // ID da Response
  submittedAt: string;
  user: FormSubmitter | null;
  totalScore: number | null;
}

// Tipo para o formulário na lista
export interface FormWithResponses {
  idForm: string;
  title: string;
  responses: FormResponseSummary[];
}

// Tipo para a resposta individual (Tela 2)
export interface ResponseAnswerDetail {
  idResponse: string;
  value: string | null;
  values: string[];
  score: number | null;
  question: {
    idQuestion: string;
    text: string;
    value?: number | null;
    type: QuestionType;
    options: FormQuestionOption[];
  };
}

// Tipo para o detalhe da resposta (Tela 2)
export interface FormResponseDetail {
  idResponse: string;
  submittedAt: string;
  user: FormSubmitter | null;
  form: {
    idForm: string;
    title: string;
  };
  answers: ResponseAnswerDetail[];
}