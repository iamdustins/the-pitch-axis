/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Music, 
  PenTool, 
  Sliders, 
  Zap, 
  Check, 
  RefreshCw,
  Info,
  Layers,
  Volume2,
  AlertCircle,
  Drama,
  Laugh,
  Type,
  FileText,
  Brain,
  Download,
  MessageSquare,
  Send,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConsoleRack, InputGroup, Slider } from './components/ConsoleRack';
import { GPMState, GPMResponse, SunoDraft, ChatMessage } from './types';
import { 
  GENRE_MAP, 
  VOCAL_MODES, 
  RHYTHMIC_SUBDIVISIONS, 
  CADENCES, 
  MELODIC_SEQUENCES, 
  STYLE_DETAIL_LEVELS, 
  RHYME_LOGIC_OPTIONS,
  OVERALL_APPROACH_OPTIONS,
  LANGUAGES, 
  ACCENTS 
} from './constants';
import { generateGPMResponse, sendChatMessage } from './services/geminiService';

export default function App() {
  const [state, setState] = useState<GPMState>({
    masterVector: {
      title: "",
      bpm: 0,
      key: "",
      tonalityCadence: "",
      melodicSequence: "",
      coreStyle: [],
      styleDetail: 'Complex',
      overallFeeling: "",
      directStyleVector: ""
    },
    lyristDesk: {
      theme: "",
      vocalInfluences: "",
      soundInfluences: "",
      verseCount: 2,
      hasHook: false,
      hasBridge: false,
      rhymeLogic: [],
      overallApproach: [],
      language: "English",
      accent: "None",
      isCowriterMode: true,
      isInstrumental: false,
      pastedLyrics: "",
      revisionTarget: "",
      requiredKeywords: "",
      vocalDemeanor: ""
    },
    surgicalSliders: {
      phoneticWeirdness: 0,
      styleInfluence: 0,
      explicitPercent: 0,
      adlibPercent: 0,
      backingVocalPercent: 0,
      scratchDensity: 0,
      vocalMode: 'Singing',
      rhythmicSubdivisions: []
    },
    chatHistory: []
  });

  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [response, setResponse] = useState<GPMResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedGenres, setExpandedGenres] = useState<string[]>([]);

  const toggleGenreGroup = (group: string) => {
    setExpandedGenres(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    setChatInput("");
    setIsChatLoading(true);

    setState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, userMessage]
    }));

    try {
      const responseText = await sendChatMessage(state, userMessage.content, state.chatHistory);
      
      let updatedState = null;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.masterVector || parsed.lyristDesk || parsed.surgicalSliders) {
            updatedState = parsed;
          }
        } catch (e) {
          console.warn("Found JSON but failed to parse:", e);
        }
      }

      const modelMessage: ChatMessage = {
        role: 'model',
        content: responseText,
        timestamp: new Date().toISOString()
      };

      setState(prev => {
        const next = {
          ...prev,
          chatHistory: [...prev.chatHistory, modelMessage]
        };
        
        if (updatedState) {
          if (updatedState.masterVector) next.masterVector = { ...next.masterVector, ...updatedState.masterVector };
          if (updatedState.lyristDesk) next.lyristDesk = { ...next.lyristDesk, ...updatedState.lyristDesk };
          if (updatedState.surgicalSliders) next.surgicalSliders = { ...next.surgicalSliders, ...updatedState.surgicalSliders };
        }
        
        return next;
      });
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateGPMResponse(state);
      setResponse(res);
    } catch (err) {
      setError("Failed to generate response. Check your Gemini API connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleGenre = (genre: string) => {
    setState(prev => ({
      ...prev,
      masterVector: {
        ...prev.masterVector,
        coreStyle: prev.masterVector.coreStyle.includes(genre)
          ? prev.masterVector.coreStyle.filter(g => g !== genre)
          : [...prev.masterVector.coreStyle, genre]
      }
    }));
  };

  const exportSessionData = () => {
    const data = { state, response, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gpm-session-${state.masterVector.title || 'untitled'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSessionData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.state) {
          setState(data.state);
          if (data.response) setResponse(data.response);
          setError(null);
        }
      } catch (err) {
        setError("Failed to parse session file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const resetState = () => {
    setState({
      masterVector: {
        title: "",
        bpm: 0,
        key: "",
        tonalityCadence: "",
        melodicSequence: "",
        coreStyle: [],
        styleDetail: 'Complex',
        overallFeeling: "",
        directStyleVector: ""
      },
      lyristDesk: {
        theme: "",
        vocalInfluences: "",
        soundInfluences: "",
        verseCount: 2,
        hasHook: false,
        hasBridge: false,
        rhymeLogic: [],
        overallApproach: [],
        language: "English",
        accent: "None",
        isCowriterMode: true,
        isInstrumental: false,
      pastedLyrics: "",
      revisionTarget: "",
      requiredKeywords: "",
      vocalDemeanor: ""
    },
      surgicalSliders: {
        phoneticWeirdness: 0,
        styleInfluence: 0,
        explicitPercent: 0,
        adlibPercent: 0,
        backingVocalPercent: 0,
        scratchDensity: 0,
        vocalMode: 'Singing',
        rhythmicSubdivisions: []
      },
      chatHistory: []
    });
    setResponse(null);
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-x-hidden font-sans">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/5 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-zinc-500/5 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 m-4 rounded-3xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative group overflow-hidden rounded-2xl">
              <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.05)] transition-all duration-500 group-hover:scale-110">
                <Drama className="w-7 h-7 text-zinc-500 absolute transition-all duration-500 group-hover:translate-y-12 group-hover:opacity-0" />
                <Laugh className="w-7 h-7 chrome-text opacity-0 -translate-y-12 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
              </div>
              <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full animate-ping opacity-75" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-black tracking-tighter uppercase italic chrome-text leading-none">The Pitch Axis</h1>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.4em] leading-none">System.V8 // NeuralDAW</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-mono text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2 cursor-pointer group">
                <input type="file" accept=".json" onChange={importSessionData} className="hidden" />
                <FileText className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" /> Import
              </label>
              <button 
                onClick={exportSessionData}
                className="text-[10px] font-mono text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2 group"
              >
                <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" /> Export
              </button>
              <button 
                onClick={resetState}
                className="text-[10px] font-mono text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2 group"
              >
                <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" /> Reset
              </button>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="mirror-button px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-[0.25em] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-95 italic overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3 text-white">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                {loading ? "Engaging..." : "Architect Session"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 pb-32">
        {/* Left Column: Input Consoles */}
        <div className="lg:col-span-4 space-y-6">
          <ConsoleRack title="A // Master Vector" icon={Music}>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Project Name">
                <input 
                  type="text" 
                  placeholder="Untitled"
                  value={state.masterVector.title}
                  onChange={(e) => setState(prev => ({ ...prev, masterVector: { ...prev.masterVector, title: e.target.value } }))}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:border-white/40 outline-none transition-all placeholder:text-zinc-800"
                />
              </InputGroup>
              <InputGroup label="Core BPM">
                <input 
                  type="number" 
                  placeholder="Auto"
                  value={state.masterVector.bpm || ""}
                  onChange={(e) => setState(prev => ({ ...prev, masterVector: { ...prev.masterVector, bpm: parseInt(e.target.value) || 0 } }))}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:border-white/40 outline-none transition-all placeholder:text-zinc-800"
                />
              </InputGroup>
            </div>

            <InputGroup label="Atmospheric Bias">
              <input 
                type="text" 
                placeholder="e.g. Ruined Cathedral, High-Speed Chase"
                value={state.masterVector.overallFeeling}
                onChange={(e) => setState(prev => ({ ...prev, masterVector: { ...prev.masterVector, overallFeeling: e.target.value } }))}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:border-white/40 outline-none transition-all placeholder:text-zinc-800"
              />
            </InputGroup>
            
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Tonality Mode">
                <select 
                  value={state.masterVector.tonalityCadence}
                  onChange={(e) => setState(prev => ({ ...prev, masterVector: { ...prev.masterVector, tonalityCadence: e.target.value } }))}
                  className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:border-white/30 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Auto-Detect</option>
                  {CADENCES.map(c => <option key={c.name} value={c.name} className="bg-zinc-950">{c.name} — ({c.effect})</option>)}
                </select>
              </InputGroup>
              <InputGroup label="Melodic Flow">
                <select 
                  value={state.masterVector.melodicSequence}
                  onChange={(e) => setState(prev => ({ ...prev, masterVector: { ...prev.masterVector, melodicSequence: e.target.value } }))}
                  className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:border-white/30 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Auto-Detect</option>
                  {MELODIC_SEQUENCES.map(s => <option key={s} value={s} className="bg-zinc-950">{s}</option>)}
                </select>
              </InputGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Key Sig.">
                <input 
                  type="text" 
                  placeholder="Auto"
                  value={state.masterVector.key}
                  onChange={(e) => setState(prev => ({ ...prev, masterVector: { ...prev.masterVector, key: e.target.value } }))}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:border-white/40 outline-none transition-all placeholder:text-zinc-800"
                />
              </InputGroup>
              <InputGroup label="Syntactic Detail">
                <select 
                  value={state.masterVector.styleDetail}
                  onChange={(e) => setState(prev => ({ ...prev, masterVector: { ...prev.masterVector, styleDetail: e.target.value as any } }))}
                  className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:border-white/30 outline-none transition-all appearance-none cursor-pointer"
                >
                  {STYLE_DETAIL_LEVELS.map(l => <option key={l} value={l} className="bg-zinc-950">{l}</option>)}
                </select>
              </InputGroup>
            </div>

            <InputGroup label="Master Style Vector Matrix (I/O)">
              <textarea 
                rows={3}
                placeholder="Paste or Export the direct vector here..."
                value={state.masterVector.directStyleVector}
                onChange={(e) => setState(prev => ({ ...prev, masterVector: { ...prev.masterVector, directStyleVector: e.target.value } }))}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-mono focus:border-white/40 outline-none h-20 resize-none transition-all placeholder:text-zinc-800"
              />
            </InputGroup>

            <InputGroup label="Core Style (Hierarchy)">
              <div className="h-64 overflow-y-auto bg-black/60 border border-white/5 rounded-xl p-2 custom-scrollbar space-y-1">
                {Object.entries(GENRE_MAP).map(([category, subGenres]) => {
                  const isExpanded = expandedGenres.includes(category);
                  const selectedInGroup = subGenres.filter(g => state.masterVector.coreStyle.includes(g));
                  const isStandalone = category === "Standalone";

                  if (isStandalone) {
                    return subGenres.map(genre => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`w-full text-left px-3 py-2 text-[10px] uppercase font-black tracking-widest transition-all rounded-lg flex items-center justify-between group ${
                          state.masterVector.coreStyle.includes(genre) 
                            ? 'bg-white text-black shadow-lg' 
                            : 'hover:bg-white/5 text-zinc-500'
                        }`}
                      >
                        {genre}
                        {state.masterVector.coreStyle.includes(genre) && <Check className="w-3 h-3" />}
                      </button>
                    ));
                  }

                  return (
                    <div key={category} className="space-y-1">
                      <button
                        onClick={() => toggleGenreGroup(category)}
                        className={`w-full text-left px-3 py-2 text-[10px] uppercase font-black tracking-widest transition-all rounded-lg flex items-center justify-between group ${
                          selectedInGroup.length > 0 ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {category}
                          {selectedInGroup.length > 0 && (
                            <span className="bg-white text-black text-[8px] px-1.5 py-0.5 rounded-full ml-1">
                              {selectedInGroup.length}
                            </span>
                          )}
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pl-4 space-y-1 overflow-hidden"
                          >
                            {subGenres.map(genre => (
                              <button
                                key={genre}
                                onClick={() => toggleGenre(genre)}
                                className={`w-full text-left px-3 py-2 text-[10px] uppercase font-bold tracking-widest transition-all rounded-lg flex items-center justify-between group ${
                                  state.masterVector.coreStyle.includes(genre) 
                                    ? 'bg-white/10 text-white border border-white/20' 
                                    : 'hover:bg-white/5 text-zinc-600'
                                }`}
                              >
                                {genre}
                                {state.masterVector.coreStyle.includes(genre) && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </InputGroup>
          </ConsoleRack>

          <ConsoleRack title="B // Lyrist Desk" icon={PenTool}>
            <div className="flex gap-2">
              <button 
                onClick={() => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, isInstrumental: !prev.lyristDesk.isInstrumental } }))}
                className={`mirror-button flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${state.lyristDesk.isInstrumental ? 'bg-white/10 border-white/30 text-white shadow-lg' : 'bg-black/60 border-white/5 text-zinc-600'}`}
              >
                Instrumental
              </button>
              <button 
                disabled={state.lyristDesk.isInstrumental}
                onClick={() => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, isCowriterMode: !prev.lyristDesk.isCowriterMode } }))}
                className={`mirror-button flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${!state.lyristDesk.isCowriterMode && !state.lyristDesk.isInstrumental ? 'bg-white/10 border-white/30 text-white shadow-lg' : 'bg-black/60 border-white/5 text-zinc-600'} disabled:opacity-30`}
              >
                Upgrade Mode
              </button>
            </div>

            {!state.lyristDesk.isInstrumental && (
              <InputGroup label="Structural Architecture">
                <div className="space-y-3 bg-black/60 p-3 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Verses</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(num => (
                        <button
                          key={num}
                          onClick={() => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, verseCount: num } }))}
                          className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border ${state.lyristDesk.verseCount === num ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/5 text-zinc-600 hover:border-white/20'}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, hasHook: !prev.lyristDesk.hasHook } }))}
                      className={`mirror-button flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${state.lyristDesk.hasHook ? 'bg-white/10 border-white/30 text-white shadow-lg' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {state.lyristDesk.hasHook && <Check className="w-3 h-3" />}
                        Include Hook
                      </div>
                    </button>
                    <button
                      onClick={() => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, hasBridge: !prev.lyristDesk.hasBridge } }))}
                      className={`mirror-button flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${state.lyristDesk.hasBridge ? 'bg-white/10 border-white/30 text-white shadow-lg' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {state.lyristDesk.hasBridge && <Check className="w-3 h-3" />}
                        Include Bridge
                      </div>
                    </button>
                  </div>
                </div>
              </InputGroup>
            )}

            {!state.lyristDesk.isInstrumental && !state.lyristDesk.isCowriterMode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                <InputGroup label="Source Lyrics (Raw)">
                  <textarea 
                    value={state.lyristDesk.pastedLyrics}
                    onChange={(e) => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, pastedLyrics: e.target.value } }))}
                    placeholder="Drop your raw data here..."
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono focus:border-white/40 outline-none h-24 resize-none transition-all"
                  />
                </InputGroup>
                <InputGroup label="Surgical target lines">
                  <input 
                    type="text"
                    value={state.lyristDesk.revisionTarget}
                    onChange={(e) => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, revisionTarget: e.target.value } }))}
                    placeholder="Specific lines to architect..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono focus:border-white/40 outline-none transition-all"
                  />
                </InputGroup>
              </motion.div>
            )}

            <InputGroup label="Thematic Core">
              <textarea 
                rows={2}
                placeholder="Leave blank for Architect's intuition"
                value={state.lyristDesk.theme}
                onChange={(e) => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, theme: e.target.value } }))}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-white/40 outline-none transition-all resize-none"
              />
            </InputGroup>

            {!state.lyristDesk.isInstrumental && (
              <InputGroup label="Required Words / Phrases">
                <textarea 
                  rows={2}
                  placeholder="Words the Architect MUST use..."
                  value={state.lyristDesk.requiredKeywords}
                  onChange={(e) => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, requiredKeywords: e.target.value } }))}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-white/40 outline-none transition-all resize-none"
                />
              </InputGroup>
            )}

            {!state.lyristDesk.isInstrumental && (
              <InputGroup label="Vocal Demeanor / Persona (Injection)">
                <textarea 
                  rows={2}
                  placeholder="e.g. Arrogant, Pained, Slick. Architect will interject every ~2 lines."
                  value={state.lyristDesk.vocalDemeanor}
                  onChange={(e) => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, vocalDemeanor: e.target.value } }))}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-white/40 outline-none transition-all resize-none"
                />
              </InputGroup>
            )}

            {!state.lyristDesk.isInstrumental && (
              <div className="space-y-4">
                <InputGroup label="Enunciation Bias">
                  <select 
                    value={state.lyristDesk.accent}
                    onChange={(e) => setState(prev => ({ ...prev, lyristDesk: { ...prev.lyristDesk, accent: e.target.value } }))}
                    className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:border-white/30 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {ACCENTS.map(a => <option key={a} value={a} className="bg-zinc-950">{a}</option>)}
                  </select>
                </InputGroup>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup label="Rhyme Logic (Ranked)">
                    <div className="space-y-1 bg-black/60 p-2 rounded-xl border border-white/5 h-48 overflow-y-auto custom-scrollbar">
                      {RHYME_LOGIC_OPTIONS.map(opt => {
                        const orderIndex = state.lyristDesk.rhymeLogic.indexOf(opt.id);
                        const isSelected = orderIndex !== -1;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setState(prev => ({
                                ...prev,
                                lyristDesk: {
                                  ...prev.lyristDesk,
                                  rhymeLogic: isSelected
                                    ? prev.lyristDesk.rhymeLogic.filter(i => i !== opt.id)
                                    : [...prev.lyristDesk.rhymeLogic, opt.id]
                                }
                              }));
                            }}
                            className={`w-full text-left p-2 rounded-lg border transition-all relative ${
                              isSelected 
                                ? 'bg-white/10 border-white/30 text-white' 
                                : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {isSelected && (
                                <span className="flex-shrink-0 w-3 h-3 bg-white text-black rounded-full text-[8px] flex items-center justify-center font-bold mt-0.5">
                                  {orderIndex + 1}
                                </span>
                              )}
                              <div>
                                <div className="text-[9px] font-black uppercase tracking-wider">{opt.name}</div>
                                <div className="text-[8px] opacity-50 leading-tight mt-0.5">{opt.desc}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </InputGroup>

                  <InputGroup label="Overall Approach (Ranked)">
                    <div className="space-y-1 bg-black/60 p-2 rounded-xl border border-white/5 h-48 overflow-y-auto custom-scrollbar">
                      {OVERALL_APPROACH_OPTIONS.map(opt => {
                        const orderIndex = state.lyristDesk.overallApproach.indexOf(opt.id);
                        const isSelected = orderIndex !== -1;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setState(prev => ({
                                ...prev,
                                lyristDesk: {
                                  ...prev.lyristDesk,
                                  overallApproach: isSelected
                                    ? prev.lyristDesk.overallApproach.filter(i => i !== opt.id)
                                    : [...prev.lyristDesk.overallApproach, opt.id]
                                }
                              }));
                            }}
                            className={`w-full text-left p-2 rounded-lg border transition-all relative ${
                              isSelected 
                                ? 'bg-white/10 border-white/30 text-white' 
                                : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {isSelected && (
                                <span className="flex-shrink-0 w-3 h-3 bg-white text-black rounded-full text-[8px] flex items-center justify-center font-bold mt-0.5">
                                  {orderIndex + 1}
                                </span>
                              )}
                              <div>
                                <div className="text-[9px] font-black uppercase tracking-wider">{opt.name}</div>
                                <div className="text-[8px] opacity-50 leading-tight mt-0.5">{opt.desc}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </InputGroup>
                </div>
              </div>
            )}
          </ConsoleRack>

          <ConsoleRack title="C // Tactical Sliders" icon={Sliders}>
            <Slider label="Phonetic Distortion" value={state.surgicalSliders.phoneticWeirdness} onChange={(v) => setState(prev => ({ ...prev, surgicalSliders: { ...prev.surgicalSliders, phoneticWeirdness: v } }))} />
            <Slider label="System Influence" value={state.surgicalSliders.styleInfluence} onChange={(v) => setState(prev => ({ ...prev, surgicalSliders: { ...prev.surgicalSliders, styleInfluence: v } }))} />
            <Slider label="Explicit Content" value={state.surgicalSliders.explicitPercent} onChange={(v) => setState(prev => ({ ...prev, surgicalSliders: { ...prev.surgicalSliders, explicitPercent: v } }))} />
            
            <div className="pt-4 space-y-4">
              <InputGroup label="Vocal Transmission Mode">
                <div className="grid grid-cols-3 gap-2">
                  {VOCAL_MODES.slice(0, 9).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setState(prev => ({ ...prev, surgicalSliders: { ...prev.surgicalSliders, vocalMode: mode as any } }))}
                      className={`mirror-button py-2 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all border ${state.surgicalSliders.vocalMode === mode ? 'bg-white/10 border-white/30 text-white' : 'bg-black/60 border-white/5 text-zinc-600'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </InputGroup>

              <InputGroup label="Rhythmic Architecture (Ranked)">
                <div className="grid grid-cols-2 gap-2 bg-black/60 p-2 rounded-xl border border-white/5">
                  {RHYTHMIC_SUBDIVISIONS.map(s => {
                    const orderIndex = state.surgicalSliders.rhythmicSubdivisions.indexOf(s);
                    const isSelected = orderIndex !== -1;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setState(prev => ({
                            ...prev,
                            surgicalSliders: { 
                              ...prev.surgicalSliders, 
                              rhythmicSubdivisions: isSelected 
                                ? prev.surgicalSliders.rhythmicSubdivisions.filter(item => item !== s)
                                : [...prev.surgicalSliders.rhythmicSubdivisions, s]
                            }
                          }));
                        }}
                        className={`mirror-button flex items-center justify-between px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                          isSelected 
                            ? 'bg-white/10 text-white border-white/30 shadow-lg' 
                            : 'bg-zinc-900 border-white/5 text-zinc-600 hover:border-white/20'
                        }`}
                      >
                        <span className="relative z-10">{s}</span>
                        {isSelected && (
                          <span className="flex items-center justify-center w-3.5 h-3.5 bg-white text-black rounded-full text-[8px] font-bold relative z-10">
                            {orderIndex + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </InputGroup>
            </div>
          </ConsoleRack>
        </div>

        {/* Right Column: Output Display */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {!response && !loading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="h-full min-h-[600px] glass-panel border-dashed border-2 border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,88,12,0.03),transparent_70%)]" />
                <div className="w-28 h-28 bg-zinc-900 shadow-2xl rounded-[2rem] flex items-center justify-center mb-10 border border-white/5 group transition-all duration-700 hover:rotate-[360deg]">
                  <Drama className="w-14 h-14 text-zinc-800" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-[0.3em] chrome-text mb-6 italic">System Online</h3>
                <p className="text-zinc-500 max-w-sm text-sm font-medium leading-relaxed uppercase tracking-wider">
                  Harmonize the Pitch Axis. Engage calculations. Re-architect reality.
                </p>
                <div className="mt-12 flex gap-4 opacity-10">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                  <div className="w-2 h-2 bg-white rounded-full animate-ping [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-white rounded-full animate-ping [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}

            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[600px] glass-panel rounded-[2.5rem] flex flex-col items-center justify-center p-12 relative overflow-hidden"
              >
                <div className="relative mb-12">
                  <div className="w-24 h-24 border-t-2 border-r-2 border-white/30 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Laugh className="w-10 h-10 chrome-text" />
                  </div>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-[0.4em] chrome-text mb-4 animate-pulse italic">Engaging Architect</h3>
                <div className="w-72 h-px bg-white/10 mt-8 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 15, ease: 'linear' }}
                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  />
                </div>
                <div className="mt-10 flex flex-col items-center gap-3">
                  {["Parsing Style DNA", "Optimizing Vectors", "Synthesizing Soul"].map((text, i) => (
                    <p key={i} className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.5em] animate-pulse" style={{ animationDelay: `${i * 0.5}s` }}>{text}</p>
                  ))}
                </div>
              </motion.div>
            )}

            {response && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                {/* Session Blueprint */}
                <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
                  <div className="bg-white/5 px-8 py-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-white" />
                      <h2 className="text-sm font-black uppercase tracking-[0.3em] italic text-zinc-300">Session Blueprint // AXIS_v8</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Authorized</span>
                    </div>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
                    <BlueprintCard icon={Music} label="Harmonic Matrix" text={response.sessionMap.chords} />
                    <BlueprintCard icon={Volume2} label="Mastering Logic" text={response.sessionMap.mastering} />
                    <BlueprintCard icon={Info} label="Strategic Inspo" text={response.sessionMap.inspiration} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-10">
                  <DraftBox 
                    id="optionA"
                    title="A // THE ARCHITECT PRISTINE" 
                    draft={response.optionA} 
                    onCopy={copyToClipboard}
                    isCopied={copied === 'optionA'}
                    accentColor="zinc"
                  />
                  <DraftBox 
                    id="optionB"
                    title="B // INTUITIVE EXPERIMENTAL" 
                    draft={response.optionB} 
                    onCopy={copyToClipboard}
                    isCopied={copied === 'optionB'}
                    accentColor="silver"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="mirror-button fixed bottom-10 right-10 w-20 h-20 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-all duration-500 z-40 group active:scale-95 group hover:-rotate-12 border border-white/20"
      >
        <div className="absolute inset-0 bg-white rounded-3xl animate-ping opacity-5" />
        <Brain className="w-10 h-10 text-white relative z-10 transition-transform group-hover:scale-110" />
      </button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]" 
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 w-full md:w-[500px] h-full bg-zinc-950 border-l border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[70] flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-widest chrome-text italic">The Architect</h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Neural Feedback Loop</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl text-zinc-500 transition-all hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {state.chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20 group">
                    <MessageSquare className="w-16 h-16 text-zinc-800 transition-transform group-hover:scale-110" />
                    <p className="text-xs font-mono uppercase tracking-[0.4em] text-zinc-500 max-w-[240px] italic">
                      Initialize consciousness to begin drafting session parameters.
                    </p>
                  </div>
                )}
                {state.chatHistory.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[90%] rounded-2xl p-5 text-sm leading-relaxed shadow-xl border ${
                      msg.role === 'user' 
                        ? 'bg-white text-black border-white/10 rounded-tr-none' 
                        : 'bg-white/5 border-white/10 text-zinc-300 rounded-tl-none font-mono'
                    }`}>
                      <div className="markdown-body">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-700 uppercase mt-2 px-1 font-bold tracking-widest">
                      {msg.role === 'user' ? 'Master' : 'Architect'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex flex-col items-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-5 flex items-center gap-4">
                      <RefreshCw className="w-5 h-5 animate-spin text-white" />
                      <span className="text-[11px] font-mono uppercase tracking-[0.3em] chrome-text animate-pulse">Calculating...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                <div className="relative group">
                  <textarea
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Converse with the neural engine..."
                    className="w-full bg-black/60 border border-white/10 rounded-[2rem] px-6 py-5 text-sm focus:border-white/30 outline-none transition-all pr-16 custom-scrollbar resize-none font-mono placeholder:text-zinc-800"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-800 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90"
                  >
                    <Send className="w-5 h-5 text-black" />
                  </button>
                </div>
                <p className="text-[9px] font-mono text-zinc-700 uppercase mt-4 text-center tracking-[0.3em] font-bold">
                  Logic processing active // Architect observing
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function BlueprintCard({ icon: Icon, label, text }: { icon: any, label: string, text: string }) {
  return (
    <div className="space-y-3 group">
      <h4 className="text-[10px] font-mono uppercase text-zinc-600 font-black flex items-center gap-2 group-hover:text-white transition-colors">
        <Icon className="w-3.5 h-3.5" /> {label}
      </h4>
      <div className="text-xs text-zinc-400 font-mono bg-black/60 p-4 rounded-2xl border border-white/5 leading-relaxed min-h-[80px] shadow-inner transition-all group-hover:border-white/10">
        {text}
      </div>
    </div>
  );
}

function DraftBox({ id, title, draft, onCopy, isCopied, accentColor }: any) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fullText = `TITLE: ${draft.title}\n\nSTYLE: ${draft.masterStyleVector}\n\nLYRICS:\n${draft.lyricScript}\n\nNOTES:\n${draft.geniusNotes}`;
  
  const handleFieldCopy = (text: string, fieldId: string) => {
    onCopy(text, `${id}-${fieldId}`);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className={`glass-panel rounded-[2.5rem] overflow-hidden transition-all duration-500 ${accentColor === 'silver' ? 'border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.05)]' : 'shadow-2xl'}`}>
      <div className={`px-8 py-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 ${accentColor === 'silver' ? 'bg-white/[0.03]' : 'bg-white/[0.02]'}`}>
        <h3 className={`text-sm font-black italic uppercase tracking-[0.3em] ${accentColor === 'silver' ? 'chrome-text' : 'text-zinc-400'}`}>{title}</h3>
        
        <div className="flex flex-wrap items-center gap-3">
          {[
            { id: 'title', label: 'T', icon: Type, text: draft.title },
            { id: 'style', label: 'S', icon: Zap, text: draft.masterStyleVector },
            { id: 'lyrics', label: 'L', icon: FileText, text: draft.lyricScript },
            { id: 'notes', label: 'N', icon: Brain, text: draft.geniusNotes },
          ].map((btn) => (
            <button 
              key={btn.id}
              onClick={() => handleFieldCopy(btn.text, btn.id)}
              className={`mirror-button flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                copiedField === btn.id 
                  ? 'bg-white border-white text-black shadow-lg' 
                  : 'bg-black/40 border-white/5 text-zinc-500 hover:text-white hover:border-white/20'
              }`}
            >
              <btn.icon className="w-3.5 h-3.5" /> {btn.label}
            </button>
          ))}
          
          <div className="w-px h-6 bg-white/10 mx-2 hidden md:block" />

          <button 
            onClick={() => onCopy(fullText, id)}
            className={`mirror-button flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isCopied 
                ? 'bg-green-600 text-white border-green-400' 
                : accentColor === 'silver' 
                  ? 'bg-white border-white text-black shadow-lg shadow-white/20' 
                  : 'bg-zinc-800 border-white/10 text-white'
            }`}
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            {isCopied ? "Archived" : "Full Matrix"}
          </button>
        </div>
      </div>
      
      <div className="p-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <OutputField label="Draft Identity" value={draft.title} mono />
            <OutputField label="Neural Style Vector" value={draft.masterStyleVector} color="silver" highlight />
            <OutputField label="Architectural Notes" value={draft.geniusNotes} size="small" />
          </div>
          
          <div className="relative group">
            <label className="text-[11px] font-mono uppercase text-zinc-600 font-black tracking-[0.3em] mb-3 block italic">Prosody script</label>
            <div className="bg-black/60 border border-white/5 rounded-3xl p-8 text-sm font-mono text-zinc-300 leading-relaxed h-[500px] overflow-y-auto custom-scrollbar whitespace-pre-wrap transition-all group-hover:border-white/10 shadow-inner">
              {draft.lyricScript}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutputField({ label, value, color, highlight, mono, size }: any) {
  return (
    <div className="space-y-3 group">
      <label className="text-[11px] font-mono uppercase text-zinc-600 font-black tracking-[0.3em] italic group-hover:text-zinc-500 transition-colors">{label}</label>
      <div className={`bg-black/60 border border-white/5 rounded-2xl px-5 py-4 leading-relaxed transition-all group-hover:border-white/10 ${mono ? 'font-mono' : ''} ${color === 'silver' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]' : 'text-zinc-300'} ${highlight ? 'text-base font-bold' : 'text-xs'} ${size === 'small' ? 'text-[10px] text-zinc-500' : ''}`}>
        {value}
      </div>
    </div>
  );
}
