export interface TriggerKeyword {
  id?: string;
  word: string;
  weight: number;
}

export interface Trigger {
  id: string;
  triggerId: string;
  name: string;
  description: string | null;
  keywords: TriggerKeyword[];
  minScore: number;
  priority: number;
  active: boolean;
  canStack: boolean;
  systemPrompt: string;
  temperature: number | null;
  maxTokens: number | null;
  markers: string[];
  agentId: string;
  agent?: {
    id: string;
    name: string;
  };
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string | null;
  active: boolean;
  isDefault: boolean;
  triggers?: Trigger[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TriggerStats {
  total: number;
  active: number;
  inactive: number;
  triggers: {
    id: string;
    triggerId: string;
    name: string;
    active: boolean;
    priority: number;
  }[];
}

export interface TriggerLogEvent {
  type: 'log' | 'heartbeat';
  message?: string;
  timestamp: string;
}

export interface TriggerTestResult {
  trigger: {
    id: string;
    triggerId: string;
    name: string;
  } | null;
  score: number;
  stackedTriggers?: {
    id: string;
    triggerId: string;
    name: string;
  }[];
}
