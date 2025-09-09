export interface GameSession {
  id: string;
  title: string;
  mode: 'practice' | 'live';
  startAt: Date;
  endAt?: Date;
  status: 'setup' | 'active' | 'paused' | 'completed';
  maxTeams: number;
  currentRound: number;
  totalRounds: number;
  currentStatementIndex: number;
}

export interface Team {
  id: string;
  sessionId: string;
  name: string;
  budgetRemaining: number;
  timeRemaining: number;
  members: string[];
  deciderOrder: string[];
  deciderPointer: number;
  score: number;
  completedStatements: number;
  team_number?: number;
  budget?: number;
}

export interface Statement {
  id: string;
  sessionId: string;
  text: string;
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  ambiguity: 1 | 2 | 3 | 4 | 5;
  truthLabel: 'true' | 'false' | 'unknowable';
  reasonKey: string;
  requiredEvidenceTypes: string[];
  recommendedItems: string[];
  visualRefs: string[];
  metadata?: Record<string, any>;
}

export interface StoreItem {
  id: string;
  sessionId: string;
  name: string;
  category: 'people_process' | 'data_artifact' | 'analytics_view' | 'quality_check' | 'context_intel';
  costMoney: number;
  costTimeMin: number;
  deliveryType: 'artifact' | 'live_widget' | 'observable_cell';
  artifactId?: string;
  widgetConfig?: {
    type: 'bar' | 'line' | 'area' | 'pie';
    dim: string;
    metric: string;
  };
  observableConfig?: {
    notebookId: string;
    cells: string[];
    mode: 'iframe' | 'runtime';
    height: number;
  };
  description: string;
  isPersistent: boolean;
}

export interface Purchase {
  id: string;
  teamId: string;
  roundId: string;
  itemId: string;
  costMoney: number;
  costTimeMin: number;
  purchasedAt: Date;
  deliveredAt?: Date;
  status: 'pending' | 'delivered' | 'expired';
}

export interface Round {
  id: string;
  teamId: string;
  statementId: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'skipped';
}

export interface Decision {
  id: string;
  roundId: string;
  teamId: string;
  statementId: string;
  choice: 'true' | 'false' | 'unknown';
  rationale: string;
  correct: boolean;
  pointsAwarded: number;
  deciderName: string;
  submittedAt: Date;
}

export interface GameState {
  session: GameSession;
  teams: Team[];
  currentStatement?: Statement;
  availableStatements: Statement[];
  storeItems: StoreItem[];
  macroTimer: {
    remaining: number;
    isActive: boolean;
    phase: 'setup' | 'round1' | 'debrief1' | 'round2' | 'final';
  };
}

export interface TeamState {
  team: Team;
  currentRound?: Round;
  purchases: Purchase[];
  decisions: Decision[];
  availableItems: StoreItem[];
  deliveryTimeline: Purchase[];
}

export type WSEvent = 
  | { type: 'macro_round:start'; payload: { round: number; duration: number } }
  | { type: 'macro_round:recall'; payload: { round: number } }
  | { type: 'macro_round:stop'; payload: { round: number } }
  | { type: 'admin:broadcast'; payload: { message: string } }
  | { type: 'admin:lock_submissions'; payload: {} }
  | { type: 'state:update'; payload: Partial<GameState> }
  | { type: 'timer:tick'; payload: { remaining: number } }
  | { type: 'purchase:accepted'; payload: { purchase: Purchase } }
  | { type: 'purchase:delivered'; payload: { purchase: Purchase } }
  | { type: 'decision:locked'; payload: { decision: Decision } }
  | { type: 'team:joined'; payload: { team: Team } }
  | { type: 'decider:changed'; payload: { teamId: string; deciderName: string } };

export interface FeatureFlags {
  visualization_mode: 'static' | 'live_lite';
  live_charts_enabled: boolean;
  deferred_feedback: boolean;
  majority_vote: boolean;
  rationale_rubric: boolean;
  decider_mode: 'verbal' | 'enforced';
}
