import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Zap,
  CheckCircle2,
  Copy,
  RotateCcw,
  Flame,
  Dumbbell,
  Apple,
  AlertTriangle,
} from 'lucide-react';
import { DailySummary, MacroGoals, UserProfile } from '../types/nutrition';
import { playSuccessChime, triggerHaptic } from '../services/audioFeedback';
import { generateDynamicNutritionAdvice, ChatMessage } from '../services/aiAdvisorService';

interface AiNutritionAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailySummary: DailySummary;
  userProfile: UserProfile;
}

export const AiNutritionAdvisorModal: React.FC<AiNutritionAdvisorModalProps> = ({
  isOpen,
  onClose,
  dailySummary,
  userProfile,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const initialGreeting = `Hello ${userProfile.name || 'Athlete'}! I am your MacroPulse AI nutrition coach. 

**Your Daily Status**:
- **Consumed**: **${dailySummary.calories} kcal** (${dailySummary.protein}g protein, ${dailySummary.carbs}g carbs, ${dailySummary.fat}g fat)
- **Remaining Target**: **${Math.max(0, userProfile.targetCalories - dailySummary.calories)} kcal** towards your **${userProfile.goalType.toUpperCase()}** objective.

How can I help you optimize your meals, hit your macros, or formulate recipes today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: initialGreeting,
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: '🎯 Remaining Macros', query: 'What should I eat right now to hit my remaining macros?' },
    { label: '🥩 High-Protein Snack', query: 'Suggest a high-protein snack with ~30g–40g protein' },
    { label: '🥑 Low-Carb Dinner', query: 'Give me a low-carb, high-protein dinner recipe under 500 kcal' },
    { label: '🥦 Boost Fiber', query: 'How do I increase my fiber intake today?' },
    { label: '💪 Lean Muscle Surplus', query: 'What are the best foods for a clean caloric surplus to build muscle?' },
    { label: '🧪 Creatine & Hydration', query: 'What is the optimal creatine dosage and daily water intake?' },
  ];

  const handleSendQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isLoading) return;

    setInputQuery('');
    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', text }];
    setMessages(updatedMessages);
    setIsLoading(true);
    triggerHaptic('light');

    try {
      const response = await fetch('/api/ai/nutrition-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          history: updatedMessages,
          dailySummary,
          macroGoals: {
            calories: userProfile.targetCalories,
            protein: userProfile.targetProteinG,
            carbs: userProfile.targetCarbsG,
            fat: userProfile.targetFatG,
            fiber: userProfile.targetFiberG,
          },
          userProfile: {
            name: userProfile.name,
            goalType: userProfile.goalType,
            weightKg: userProfile.weightKg,
            heightCm: userProfile.heightCm,
            activityLevel: userProfile.activityLevel,
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.answer) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.answer, isFallback: Boolean(data.isFallback) }]);
        playSuccessChime();
        triggerHaptic('success');
      } else {
        throw new Error(data.error || 'Failed to get live model response');
      }
    } catch (e: any) {
      console.warn('Handling query via dynamic client-side advisor reasoning:', e);
      const fallbackReply = generateDynamicNutritionAdvice({
        query: text,
        history: updatedMessages,
        dailySummary,
        macroGoals: {
          calories: userProfile.targetCalories,
          protein: userProfile.targetProteinG,
          carbs: userProfile.targetCarbsG,
          fat: userProfile.targetFatG,
          fiber: userProfile.targetFiberG,
        },
        userProfile: {
          name: userProfile.name,
          goalType: userProfile.goalType,
          weightKg: userProfile.weightKg,
          heightCm: userProfile.heightCm,
          activityLevel: userProfile.activityLevel,
        },
      });

      setMessages((prev) => [...prev, { role: 'assistant', text: fallbackReply, isFallback: true }]);
      playSuccessChime();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (idx: number, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    triggerHaptic('light');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: initialGreeting,
      },
    ]);
    triggerHaptic('medium');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500/20 to-indigo-500/20 border border-teal-500/30 text-teal-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                MacroPulse AI Coach
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
                  Gemini 3.7
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Dietary math, food suggestions & meal optimization</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetChat}
              title="Reset conversation"
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="p-4 overflow-y-auto space-y-4 text-white flex-1 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`relative group p-3.5 rounded-2xl max-w-[88%] whitespace-pre-line leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-medium rounded-tr-xs shadow-md'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-xs shadow-sm'
                }`}
              >
                {m.role === 'assistant' && m.isFallback && (
                  <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>⚠️ Offline response — couldn't reach live AI, here's a general answer</span>
                  </div>
                )}

                {m.text}

                {m.role === 'assistant' && (
                  <button
                    onClick={() => handleCopyMessage(idx, m.text)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Copy response"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-teal-400 animate-pulse">
              <div className="w-7 h-7 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span>Analyzing macro requirements and formulating scientific nutrition plan...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/60 flex gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSendQuery(item.query)}
              disabled={isLoading}
              className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-750 active:bg-slate-700 text-slate-300 hover:text-teal-200 rounded-xl text-[11px] whitespace-nowrap border border-slate-700/70 hover:border-teal-500/40 transition cursor-pointer flex-shrink-0 font-medium"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery(inputQuery);
          }}
          className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about meal swaps, remaining macros, specific foods..."
            className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 transition"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};

