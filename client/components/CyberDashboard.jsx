import React, { useState, useEffect } from 'react';
import { DOMAIN_INFO, DOMAINS_LIST, DOMAIN_THEMES } from '../utils/constants';
import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient';

// Cyber Corner Brackets
const CyberCorner = ({ color = '#00f0ff', size = 8 }) => (
  <>
    <div style={{ position: 'absolute', top: -1, left: -1, width: size, height: size, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: -1, right: -1, width: size, height: size, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, left: -1, width: size, height: size, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, right: -1, width: size, height: size, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`, pointerEvents: 'none' }} />
  </>
);

export const GAME_VALIDITY_CITATIONS = {
  SpeedTap: "Based on research by Hadjiaros et al. (2021), game-based cognitive assessments that incorporate reaction-time tasks can effectively measure visuospatial attention and response speed. Their study validated gamified cognitive tasks and found that participants exhibited performance patterns comparable to traditional clinical cognitive assessments.",
  FocusFinder: "Knobel et al. (2021) developed a visual search task within an immersive game environment to assess attention. Their research, alongside Park and Zhang (2021), revealed that adaptive visual search activities effectively evaluate selective attention, cognitive control, and distractor resistance while maintaining high user engagement.",
  StroopShift: "According to Müller et al. (2024), Stroop-based activities remain highly effective tools for measuring selective attention, cognitive flexibility, and inhibitory control. The study highlighted the ability of Stroop tasks to evaluate how individuals manage conflicting information and suppress automatic responses.",
  MemoryMatch: "Bhargava et al. (2024) validated game-based cognitive assessments against traditional tests like ACE-III. They found that interactive environments effectively evaluate working memory, attention, and executive functions while maintaining high user engagement and immersion.",
  MatrixRecall: "A systematic review by Vasconcelos et al. (2024) concluded that interactive cognitive games provide reliable measures of spatial memory, attention, and navigation skills. Game-based systems significantly improve user engagement compared to traditional spatial assessment methods.",
  SynapseSpin: "Jonson et al. (2021) found that digital and virtual environments can effectively assess spatial memory and visuospatial skills. Cognitive assessment mechanisms involving mental rotation accurately measure environmental awareness.",
  NexusMapper: "Jonson et al. (2021) determined that complex interactive environments effectively measure spatial memory retention, recall networks, and visuospatial navigation abilities.",
  LogicLink: "Pedersen et al. (2020) validated game-based assessments on over 10,000 participants. Their study demonstrated that in-game behavioral data from pattern recognition tasks can reliably predict reasoning and decision-making abilities with accuracy comparable to traditional clinical assessments.",
  EquationBalance: "According to Wang et al. (2022), game-based arithmetic challenges can effectively measure cognitive processing speed, analytical thinking, and deductive reasoning performance in an engaging format.",
  SequenceDecoder: "Schubert et al. (2023) established that sequence-based cognitive tasks effectively evaluate abstract reasoning and rule discovery abilities. Identifying hidden patterns improves assessment accuracy for high-level analytical thinking skills.",
  RouteOptimizer: "Nogueira et al. (2021) found that pathfinding and route optimization games can effectively measure executive planning, resource allocation, and combinatorial problem-solving skills, supporting strategic reasoning assessment.",
  PriorityQueue: "Chiotaki et al. (2023) emphasized that adaptive game-based systems requiring rapid prioritization enhance problem-solving skills, strategic planning, and working memory capacity under increasing pressure.",
  NeuroMaze: "According to Chiotaki et al. (2023), adaptive maze learning systems effectively enhance problem-solving skills, strategic thinking, and cognitive flexibility by dynamically adjusting challenges based on real-time user performance.",
  MentalFlex: "Chiotaki et al. (2023) conducted a systematic review showing that game-based learning improves cognitive flexibility. Tasks requiring rapid adaptation to changing rules actively evaluate executive strategy and task-switching adaptability."
};

const CyberDashboard = ({
  currentUser,
  preTestScores,
  weakestDomain = 'executive_strategy',
  prescribedGame = 'PriorityQueue',
  personalizedReport,
  hasPlayedPrescribed,
  onStartPostTest,
  onLaunchGame,
  isMobile,
  audioEngine
}) => {
  const { token, fetchInventory } = useCogniStore();

  // Active Category Filter Tab
  const [activeTab, setActiveTab] = useState(weakestDomain || 'executive_strategy');

  // Quests State
  const [quests, setQuests] = useState([]);
  const [questsLoading, setQuestsLoading] = useState(true);

  // Sync tab with weakest domain initially
  useEffect(() => {
    if (weakestDomain) {
      setActiveTab(weakestDomain);
    }
  }, [weakestDomain]);

  // Fetch Daily Quests
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/quests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.quests?.length > 0) {
            setQuests(data.quests);
          } else {
            // Fallback quests matching Image 2
            setQuests([
              { id: 'q1', task_description: 'Play 3 Training Games', current_amount: 0, target_amount: 3, reward_coins: 50, is_completed: 0 },
              { id: 'q2', task_description: 'Achieve 80% Accuracy', current_amount: 0, target_amount: 1, reward_coins: 75, is_completed: 0 },
              { id: 'q3', task_description: 'Reaction time < 800ms', current_amount: 0, target_amount: 1, reward_coins: 60, is_completed: 0 }
            ]);
          }
        } else {
          setQuests([
            { id: 'q1', task_description: 'Play 3 Training Games', current_amount: 0, target_amount: 3, reward_coins: 50, is_completed: 0 },
            { id: 'q2', task_description: 'Achieve 80% Accuracy', current_amount: 0, target_amount: 1, reward_coins: 75, is_completed: 0 },
            { id: 'q3', task_description: 'Reaction time < 800ms', current_amount: 0, target_amount: 1, reward_coins: 60, is_completed: 0 }
          ]);
        }
      } catch (err) {
        setQuests([
          { id: 'q1', task_description: 'Play 3 Training Games', current_amount: 0, target_amount: 3, reward_coins: 50, is_completed: 0 },
          { id: 'q2', task_description: 'Achieve 80% Accuracy', current_amount: 0, target_amount: 1, reward_coins: 75, is_completed: 0 },
          { id: 'q3', task_description: 'Reaction time < 800ms', current_amount: 0, target_amount: 1, reward_coins: 60, is_completed: 0 }
        ]);
      } finally {
        setQuestsLoading(false);
      }
    };

    fetchQuests();
  }, [token]);

  const handleClaimQuest = async (questId) => {
    try {
      audioEngine?.playClick();
      setQuests(prev => prev.map(q => q.id === questId ? { ...q, is_completed: 1 } : q));
      const res = await fetch(`${API_BASE}/api/quests/claim/${questId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchInventory?.();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Find prescribed game details
  const findGameById = (targetId) => {
    for (const d of DOMAINS_LIST) {
      const g = d.games.find(x => x.id.toLowerCase() === (targetId || '').toLowerCase());
      if (g) return { game: g, domain: d };
    }
    // Default fallback to Priority Queue in Executive Strategy
    const strat = DOMAINS_LIST.find(d => d.id === 'executive_strategy') || DOMAINS_LIST[0];
    return { game: strat.games[0], domain: strat };
  };

  const { game: prescribedGameObj, domain: prescribedDomainObj } = findGameById(prescribedGame);

  // Archetype
  const rawArchetype = personalizedReport?.archetype || 'The Learner';
  const archetypeTitle = rawArchetype.replace(/💡|🚀|📈|🔋|♟️/g, '').trim();

  // Radar chart geometry for Left Column Card (matching Image 2)
  // Axes: Top = Spatial-Visual Memory, Right = Logical Reasoning, Bottom = Executive Strategy, Left = Reflexes & Focus
  const scores = {
    spatial_visual_memory: preTestScores?.spatial_visual_memory ?? 80,
    logical_mathematical: preTestScores?.logical_mathematical ?? 70,
    executive_strategy: preTestScores?.executive_strategy ?? 60,
    reflexes_and_focus: preTestScores?.reflexes_and_focus ?? 65
  };

  const rcx = 145;
  const rcy = 110;
  const rR = 68;

  const r_top = { x: rcx, y: rcy - Math.max(12, (scores.spatial_visual_memory / 100) * rR) };
  const r_right = { x: rcx + Math.max(12, (scores.logical_mathematical / 100) * rR), y: rcy };
  const r_bottom = { x: rcx, y: rcy + Math.max(12, (scores.executive_strategy / 100) * rR) };
  const r_left = { x: rcx - Math.max(12, (scores.reflexes_and_focus / 100) * rR), y: rcy };

  const radarPoints = `${r_top.x},${r_top.y} ${r_right.x},${r_right.y} ${r_bottom.x},${r_bottom.y} ${r_left.x},${r_left.y}`;

  // Current active domain object and games
  const currentDomainObj = DOMAINS_LIST.find(d => d.id === activeTab) || DOMAINS_LIST[0];
  const activeGames = currentDomainObj.games || [];
  const currentDomainInfo = DOMAIN_INFO[currentDomainObj.id] || { title: currentDomainObj.title, color: '#00f0ff' };

  return (
    <div style={{
      maxWidth: '1380px',
      width: '100%',
      margin: '0 auto',
      boxSizing: 'border-box',
      color: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>

      {/* Post-Test Notice Banner (When Training is Completed) */}
      {hasPlayedPrescribed && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.6)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🏆</span>
            <div>
              <div style={{ fontWeight: '800', color: '#4ade80', fontSize: '0.95rem' }}>
                Prescribed Training Completed!
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                Your cognitive post-test evaluation is now unlocked. Take the assessment to measure skill deltas.
              </div>
            </div>
          </div>
          <button
            onClick={onStartPostTest}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              color: '#021814',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: '900',
              fontSize: '0.85rem',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
            }}
          >
            Take Post-Test Questionnaire &rarr;
          </button>
        </div>
      )}

      {/* Main 2-Column Command Deck matching Image 2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(310px, 340px) 1fr',
        gap: '1.25rem',
        alignItems: 'start'
      }}>

        {/* ================= LEFT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Card 1: Your Archetype & Cognitive Radar HUD */}
          <div style={{
            background: 'radial-gradient(circle at 50% 10%, rgba(15, 23, 42, 0.95) 0%, rgba(6, 12, 26, 0.98) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.28)',
            borderRadius: '16px',
            padding: '1.15rem',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 240, 255, 0.05)'
          }}>
            <CyberCorner color="#00f0ff" size={8} />

            {/* Top Row: Brain Icon + Archetype Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.25)',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '18px' }}>🧠</span>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
                  YOUR ARCHETYPE:
                </div>
                <div style={{ fontSize: '1.28rem', fontWeight: '900', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {archetypeTitle} <span style={{ fontSize: '1rem', color: '#38bdf8' }}>💡</span>
                </div>
              </div>
            </div>

            {/* Background Cyber Blueprint Grid + Radar SVG */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '225px',
              background: 'rgba(3, 7, 18, 0.7)',
              borderRadius: '10px',
              border: '1px solid rgba(0, 240, 255, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {/* Subtle Grid Texture */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                pointerEvents: 'none'
              }} />

              <svg width="100%" height="100%" viewBox="0 0 310 220" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
                <defs>
                  <radialGradient id="dashRadarGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(0, 240, 255, 0.5)" />
                    <stop offset="60%" stopColor="rgba(56, 189, 248, 0.25)" />
                    <stop offset="100%" stopColor="rgba(34, 197, 94, 0.12)" />
                  </radialGradient>
                  <filter id="dashNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Concentric Coordinate Rings */}
                {[0.25, 0.5, 0.75, 1.0].map((frac, i) => (
                  <circle
                    key={i}
                    cx={rcx}
                    cy={rcy}
                    r={rR * frac}
                    fill="none"
                    stroke={frac === 1.0 ? "rgba(0, 240, 255, 0.35)" : "rgba(0, 240, 255, 0.16)"}
                    strokeWidth={frac === 1.0 ? "1.2" : "0.9"}
                    strokeDasharray={frac < 1.0 ? "2 3" : "none"}
                  />
                ))}

                {/* Crosshair Axes */}
                <line x1={rcx - rR - 12} y1={rcy} x2={rcx + rR + 12} y2={rcy} stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1" />
                <line x1={rcx} y1={rcy - rR - 12} x2={rcx} y2={rcy + rR + 12} stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1" />

                {/* Axis Labels (Stacked for perfect fit) */}
                <text x={rcx} y={rcy - rR - 10} textAnchor="middle" fill="#00f0ff" fontSize="9.5" fontWeight="800" letterSpacing="0.03em">
                  Spatial-Visual Memory
                </text>

                <text x={rcx + rR + 8} y={rcy - 4} textAnchor="start" fill="#38bdf8" fontSize="9" fontWeight="800" letterSpacing="0.02em">
                  Logical
                </text>
                <text x={rcx + rR + 8} y={rcy + 8} textAnchor="start" fill="#38bdf8" fontSize="9" fontWeight="800" letterSpacing="0.02em">
                  Reasoning
                </text>

                <text x={rcx} y={rcy + rR + 16} textAnchor="middle" fill="#22c55e" fontSize="9.5" fontWeight="800" letterSpacing="0.03em">
                  Executive Strategy
                </text>

                <text x={rcx - rR - 8} y={rcy - 4} textAnchor="end" fill="#f43f5e" fontSize="9" fontWeight="800" letterSpacing="0.02em">
                  Reflexes
                </text>
                <text x={rcx - rR - 8} y={rcy + 8} textAnchor="end" fill="#f43f5e" fontSize="9" fontWeight="800" letterSpacing="0.02em">
                  & Focus
                </text>

                {/* Radar Polygon */}
                <polygon
                  points={radarPoints}
                  fill="url(#dashRadarGrad)"
                  stroke="rgba(0, 240, 255, 0.95)"
                  strokeWidth="2.4"
                  filter="url(#dashNeonGlow)"
                />

                {/* Vertex Dots */}
                <circle cx={r_top.x} cy={r_top.y} r="4" fill="#00f0ff" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={r_right.x} cy={r_right.y} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={r_bottom.x} cy={r_bottom.y} r="4" fill="#22c55e" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={r_left.x} cy={r_left.y} r="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Bottom Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '0.75rem',
              fontSize: '0.72rem',
              letterSpacing: '0.06em'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '6px', height: '3px', background: '#00f0ff', borderRadius: '1px' }} />
                <div style={{ width: '6px', height: '3px', background: '#00f0ff', borderRadius: '1px' }} />
                <div style={{ width: '6px', height: '3px', background: '#00f0ff', borderRadius: '1px' }} />
              </div>
              <span style={{ color: '#94a3b8' }}>COGNITIVE STATUS:</span>
              <span style={{ color: '#22c55e', fontWeight: '800' }}>ACTIVE</span>
            </div>
          </div>

          {/* Card 2: Daily Quests */}
          <div style={{
            background: 'rgba(10, 18, 36, 0.75)',
            border: '1px solid rgba(0, 240, 255, 0.22)',
            borderRadius: '16px',
            padding: '1.15rem',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
          }}>
            <CyberCorner color="#00f0ff" size={8} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.9rem' }}>
              <span style={{ fontSize: '15px' }}>📋</span>
              <span style={{ fontSize: '0.86rem', fontWeight: '800', letterSpacing: '0.06em', color: '#ffffff', textTransform: 'uppercase' }}>
                Daily Quests
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {questsLoading ? (
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
                  Loading telemetry quests...
                </div>
              ) : (
                quests.map(quest => {
                  const progress = Math.min(quest.current_amount || 0, quest.target_amount || 1);
                  const target = quest.target_amount || 1;
                  const percent = Math.min(100, Math.floor((progress / target) * 100));
                  const isCompleted = quest.is_completed === 1 || quest.is_completed === true;
                  const canClaim = progress >= target && !isCompleted;

                  return (
                    <div key={quest.id} style={{
                      background: 'rgba(3, 7, 18, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '10px',
                      padding: '0.75rem 0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: '600' }}>
                          {quest.task_description} <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>({progress}/{target})</span>
                        </span>
                        {canClaim ? (
                          <button
                            onClick={() => handleClaimQuest(quest.id)}
                            style={{
                              background: '#22c55e',
                              color: '#021814',
                              border: 'none',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)'
                            }}
                          >
                            Claim
                          </button>
                        ) : isCompleted ? (
                          <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: '700' }}>✓ Claimed</span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700' }}>Claim</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: percent >= 100 ? '#22c55e' : 'linear-gradient(90deg, #0284c7, #00f0ff)',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* ================= RIGHT / MAIN COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 1. DAILY PRESCRIBED WORKOUT (Top Banner matching Image 2) */}
          <div style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(24, 12, 38, 0.95) 0%, rgba(8, 10, 24, 0.98) 100%)',
            border: '1.5px solid rgba(216, 70, 239, 0.55)',
            borderRadius: '16px',
            padding: '1.25rem 1.45rem',
            position: 'relative',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(216, 70, 239, 0.12)'
          }}>
            <CyberCorner color="#d946ef" size={10} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.85rem' }}>
              <span style={{ color: '#d946ef', fontSize: '13px' }}>♀</span>
              <span style={{ fontSize: '0.78rem', fontWeight: '900', letterSpacing: '0.08em', color: '#e879f9', textTransform: 'uppercase' }}>
                DAILY PRESCRIBED WORKOUT
              </span>
            </div>

            {/* Content Row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1.5px solid rgba(34, 197, 94, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(34, 197, 94, 0.25)',
                fontSize: '22px',
                flexShrink: 0
              }}>
                {prescribedGameObj.icon || '📥'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', fontWeight: '900', color: '#ffffff' }}>
                  {prescribedGameObj.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {prescribedGameObj.objective}
                </p>
              </div>
            </div>

            {/* Big Wide Gradient CTA */}
            <button
              onClick={() => {
                audioEngine?.playClick();
                onLaunchGame(prescribedGameObj, prescribedDomainObj);
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #00f0ff 0%, #a855f7 50%, #ec4899 100%)',
                color: '#021017',
                border: 'none',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                fontSize: '1.02rem',
                fontWeight: '900',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 25px rgba(0, 240, 255, 0.35)',
                transition: 'all 0.2s ease',
                textTransform: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 35px rgba(0, 240, 255, 0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.35)';
              }}
            >
              Launch Prescribed Module &rarr;
            </button>
          </div>

          {/* 2. DOMAIN FILTER PILL TABS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.65rem'
          }}>
            {[
              { id: 'reflexes_and_focus', label: 'Reflexes', icon: '⚡' },
              { id: 'spatial_visual_memory', label: 'Memory', icon: '🧠' },
              { id: 'logical_mathematical', label: 'Logic', icon: '🔲' },
              { id: 'executive_strategy', label: 'Strategy', icon: '🎯' }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    audioEngine?.playClick();
                    setActiveTab(tab.id);
                  }}
                  style={{
                    background: isActive ? 'rgba(0, 240, 255, 0.14)' : 'rgba(15, 23, 42, 0.7)',
                    border: isActive ? '2px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '0.7rem 0.5rem',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontWeight: isActive ? '900' : '700',
                    fontSize: '0.88rem',
                    letterSpacing: '0.03em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: isActive ? '0 0 16px rgba(0, 240, 255, 0.35)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.4)';
                      e.currentTarget.style.color = '#e2e8f0';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3. GAME CARDS GRID (Filtered to Active Domain Tab) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '1rem'
          }}>
            {activeGames.map(game => {
              const isPrescribed = prescribedGame.toLowerCase() === game.id.toLowerCase();
              const theme = DOMAIN_THEMES[currentDomainObj.themeClass] || DOMAIN_THEMES.executive;
              const validityCitation = GAME_VALIDITY_CITATIONS[game.id] || "Scientifically validated psychometric serious game assessment module.";

              return (
                <div
                  key={game.id}
                  style={{
                    background: 'radial-gradient(circle at 80% 20%, rgba(15, 23, 42, 0.9) 0%, rgba(8, 12, 26, 0.95) 100%)',
                    border: `1.5px solid ${isPrescribed ? '#22c55e' : theme.color + '55'}`,
                    borderRadius: '14px',
                    padding: '1.1rem',
                    position: 'relative',
                    boxShadow: isPrescribed ? '0 0 20px rgba(34, 197, 94, 0.2)' : '0 6px 20px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem'
                  }}
                >
                  <CyberCorner color={isPrescribed ? '#22c55e' : theme.color} size={8} />

                  {/* Header Row: Icon + Title + Badge */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: `${theme.color}18`,
                          border: `1px solid ${theme.color}45`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '17px',
                          flexShrink: 0
                        }}>
                          {game.icon}
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#ffffff' }}>
                          {game.title}
                        </h4>
                      </div>

                      {isPrescribed ? (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: '800',
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#4ade80',
                          border: '1px solid rgba(34, 197, 94, 0.5)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase'
                        }}>
                          Prescribed
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: '800',
                          background: `${theme.color}18`,
                          color: theme.color,
                          border: `1px solid ${theme.color}45`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase'
                        }}>
                          {currentDomainInfo.title.split(' ')[0]}
                        </span>
                      )}
                    </div>

                    {/* Objective Description */}
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.45' }}>
                      {game.objective}
                    </p>
                  </div>

                  {/* Scientific Validity Accordion */}
                  <details style={{
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(0, 240, 255, 0.15)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}>
                    <summary style={{
                      padding: '0.45rem 0.65rem',
                      fontSize: '0.7rem',
                      color: '#38bdf8',
                      fontWeight: '800',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      outline: 'none',
                      userSelect: 'none'
                    }}>
                      🔬 View Scientific Validity
                    </summary>
                    <div style={{
                      padding: '0.5rem 0.65rem 0.65rem 0.65rem',
                      fontSize: '0.72rem',
                      color: '#cbd5e1',
                      lineHeight: '1.45',
                      fontStyle: 'italic',
                      borderTop: '1px solid rgba(0, 240, 255, 0.1)'
                    }}>
                      {validityCitation}
                    </div>
                  </details>

                  {/* Launch Game Button */}
                  <button
                    onClick={() => {
                      audioEngine?.playClick();
                      onLaunchGame(game, currentDomainObj);
                    }}
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(0, 240, 255, 0.4)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.85rem',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      letterSpacing: '0.03em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      marginTop: '0.2rem'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#00f0ff';
                      e.currentTarget.style.background = 'rgba(0, 240, 255, 0.12)';
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 240, 255, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.4)';
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Launch Game &rarr;
                  </button>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};

export default CyberDashboard;
