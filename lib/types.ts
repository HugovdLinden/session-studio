export const phases = ['discover', 'define', 'develop', 'deliver', 'iterate'] as const;
export const goals = ['understand', 'frame', 'fluency', 'flexibility', 'select'] as const;
export type Phase = typeof phases[number];
export type Goal = typeof goals[number];
export type Level = 'novice' | 'bachelor' | 'master';
export type Category = 'diverging' | 'reverging' | 'converging' | 'resting' | 'organisation' | 'unclassified';
export type Difficulty = 'easy' | 'medium' | 'difficult';
export interface MethodStage { id:string; title:string; stepIndices:number[]; requiresStageIds:string[]; betweenSessionNote?:string }
export interface Intake { name: string; description: string; phase: Phase; goal: Goal; minutes: number; participants: number; level: Level }
export interface Step { title: string; summary: string; detail: string }
export interface MethodSourceRecord { name:string; book:string; section:string; heading:string; fit:string; input:string; core:string; output:string; consideration:string; planningEstimate:string; sourceGroup:string; sourceScope:string; citation:string }
export interface FrameworkRecord { id:string; name:string; kind:'model'|'approach'|'perspective'; source:string; status:'indexed'|'recovered'; notes:string[] }
export interface PlanningKnowledge { skill:string; sourceFiles:Record<string,string>; coverage:{delft:string;roadMap:string}; methods:Record<string,MethodSourceRecord>; frameworks:FrameworkRecord[]; guidance:{title:string;source:string;notes:string[];status:string}[] }
export interface Ratings { defaultMinutes: number | null; minParticipants: number | null; maxParticipants: number | null; difficulty: Difficulty | null }
export interface Method extends Ratings { id: string; name: string; category: Category; subtype?: string; phases: Phase[]; goals: Goal[]; takeaway: string; input: string; materials: string; steps: Step[]; source: string; sourceRecord?:MethodSourceRecord; verifiedProcedure: boolean; revision: number; metadataOrigin: 'missing' | 'user' | 'demo' | 'source' | 'estimate'; stages?: MethodStage[]; knownMin?: number; knownMax?: number }
export interface Activity { minimumMinutes?:number; stageId?:string; methodRunId?:string; requiresStageIds?:string[]; betweenSessionNote?:string; instanceId: string; methodId: string; name: string; category: Category; takeaway: string; input: string; materials: string; source: string; defaultMinutes: number; minParticipants: number; maxParticipants: number | null; steps: (Step & { minutes: number })[]; operational: boolean }
export interface Plan { id: string; version: number; intake: Intake; activities: Activity[]; demo: boolean; generatedAt: string; acceptedWarnings: string[]; pinnedMethodId?: string }
export interface Alternatives { recommended: Method[]; available: Method[]; explanation: string }
export const phaseLabels: Record<Phase,string> = {discover:'Discover · first diamond',define:'Define · first diamond',develop:'Develop · second diamond',deliver:'Deliver · second diamond',iterate:'Later iteration'};
export const goalLabels: Record<Goal,string> = {understand:'Understand the problem',frame:'Reframe the problem',fluency:'Generate more ideas',flexibility:'Explore different perspectives',select:'Compare and choose ideas'};
export const levelLabels: Record<Level,string> = {novice:'Novice',bachelor:'Intermediate',master:'Expert'};
