export type VocalMode = 
  | 'Singing' 
  | 'Rap' 
  | 'Spoken Word' 
  | 'Belting' 
  | 'Whisper' 
  | 'Melodic Line' 
  | 'Country' 
  | 'Scream Rock' 
  | 'Rock and Roll' 
  | 'Grunge' 
  | 'Folk' 
  | 'Opera';

export type RhythmicSubdivision = 'Boom Bap' | 'Trap-Chopper' | 'Pop-Sync' | string;

export type StyleDetailLevel = 'Simple' | 'Complex' | 'Extreme' | 'God Mode';

export interface MasterVectorState {
  title: string;
  bpm: number;
  key: string;
  tonalityCadence: string;
  melodicSequence: string;
  coreStyle: string[];
  styleDetail: StyleDetailLevel;
  overallFeeling: string;
  directStyleVector: string;
}

export interface LyristDeskState {
  theme: string;
  vocalInfluences: string;
  soundInfluences: string;
  verseCount: number;
  hasHook: boolean;
  hasBridge: boolean;
  rhymeLogic: string[];
  overallApproach: string[];
  language: string;
  accent: string;
  isCowriterMode: boolean;
  isInstrumental: boolean;
  pastedLyrics: string;
  revisionTarget: string;
  requiredKeywords: string;
}

export interface SurgicalSlidersState {
  phoneticWeirdness: number;
  styleInfluence: number;
  explicitPercent: number;
  adlibPercent: number;
  backingVocalPercent: number;
  scratchDensity: number;
  vocalMode: VocalMode;
  rhythmicSubdivisions: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface GPMState {
  masterVector: MasterVectorState;
  lyristDesk: LyristDeskState;
  surgicalSliders: SurgicalSlidersState;
  chatHistory: ChatMessage[];
}

export interface SunoDraft {
  title: string;
  masterStyleVector: string;
  lyricScript: string;
  geniusNotes: string;
}

export interface GPMResponse {
  optionA: SunoDraft;
  optionB: SunoDraft;
  sessionMap: {
    chords: string;
    mastering: string;
    inspiration: string;
  };
}
