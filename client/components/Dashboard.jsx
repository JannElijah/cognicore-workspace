import React from 'react';
import { Radar, Line, Bar, Scatter } from 'react-chartjs-2';
import HoverTooltip from './HoverTooltip';

const ProgressRing = ({ radius, stroke, progress, color }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(1, Math.max(0, progress)) * circumference);

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      style={{ transform: 'rotate(-90deg)', display: 'block' }}
    >
      <circle
        stroke="rgba(255, 255, 255, 0.05)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};

export default function Dashboard({
  activeDashboardUser, setActiveDashboardUser, fetchDashboardData, chartsLoading, chartsError,
  cohortComparison, latestSessionMetrics, getRadarChartData, radarOptions, getPerformanceTrendData,
  performanceTrendOptions, getConsistencyTrendData, sessionHistory, archetypeHistory, setActiveGame, prescribedGame,
  radarDataEnhanced,
  lineChartData, lineChartOptions,
  barChartData, barChartOptions,
  sessionTrendData, sessionTrendOptions,
  domainAccData, domainAccOptions,
  perGameScoreData, perGameScoreOptions,
  scatterData, scatterOptions,
  skills, domainDeltas, rec
}) {
  return (
          // ==========================================
          // PARTICIPANT ANALYTICS DASHBOARD
          // ==========================================
          <div className="dashboard-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="intro-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'stretch' }}>
              <div>
                <h1 style={{ fontSize: '2.25rem', margin: 0 }}>Cognitive Performance Analytics</h1>
                <p style={{ margin: '0.5rem 0 0 0' }}>Real-time analytics collected across validated cognitive tracks. Evaluate skill scores, track multi-session trends, and view personalized reports.</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.75rem 1.25rem', borderRadius: '10px', width: 'fit-content', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'bold' }}>👤 Participant Selector:</span>
                <input 
                  type="text" 
                  value={activeDashboardUser} 
                  onChange={(e) => setActiveDashboardUser(e.target.value)} 
                  placeholder="e.g. player_one" 
                  style={{
                    background: '#09090b',
                    border: '1.5px solid #4c1d95',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    width: '180px',
                    transition: 'border-color 0.2s'
                  }}
                />
                <button
                  onClick={() => fetchDashboardData(activeDashboardUser)}
                  disabled={chartsLoading}
                  style={{
                    background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    opacity: chartsLoading ? 0.6 : 1,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 10px rgba(var(--rgb-secondary), 0.2)'
                  }}
                  onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                  onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
                >
                  {chartsLoading ? 'Loading...' : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 3px rgba(255,255,255,0.8))', marginRight:'6px', verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Load Metrics</>}
                </button>
              </div>
            </div>

            {/* Cognitive Skills Score Row */}
            <h2 className="section-title">Cognitive Domain Profiling <span title="Scoring system based on standard clinical normative baselines for reaction time and accuracy." style={{fontSize: '1rem', cursor: 'help'}}>ⓘ</span></h2>
            <div className="game-grid" style={{ marginBottom: '3rem' }}>
              
              {/* Spatial-Visual Memory Card */}
              <HoverTooltip text="Scored based on your highest performance in memory-based games" content="Scored based on your highest performance in memory-based games" delay={200}>
              <div className="game-card" style={{ 
                padding: '1.25rem 1.5rem', 
                borderLeft: '4px solid var(--color-primary)', 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem',
                minWidth: '260px',
                boxSizing: 'border-box'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Spatial-Visual Memory</span>
                    {domainDeltas.spatial_visual_memory !== 0 && (
                      <span style={{
                        background: domainDeltas.spatial_visual_memory > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: domainDeltas.spatial_visual_memory > 0 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: domainDeltas.spatial_visual_memory > 0 ? '#4ade80' : '#f87171',
                        fontSize: '0.65rem',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '9999px',
                        fontWeight: 'bold',
                        boxShadow: domainDeltas.spatial_visual_memory > 0 ? '0 0 6px rgba(34, 197, 94, 0.15)' : '0 0 6px rgba(239, 68, 68, 0.15)'
                      }}>
                        {domainDeltas.spatial_visual_memory > 0 ? `+${domainDeltas.spatial_visual_memory}` : domainDeltas.spatial_visual_memory}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.85rem', margin: '0.25rem 0', color: 'var(--color-primary)', fontWeight: '800' }}>
                    {skills.spatial_visual_memory}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
                  </h3>
                  <p style={{ margin: '0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.35' }}>
                    Short-Term grid sequence recall and spatial working capacity.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  <ProgressRing radius={30} stroke={3.5} progress={skills.spatial_visual_memory / 100} color="var(--color-primary)" />
                   <span style={{ position: 'absolute', fontSize: '1.1rem' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.7))'}} xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="7" rx="7" ry="5" stroke="var(--color-primary)" strokeWidth="1.8"/><path d="M5 10c0 3 3 6 7 6s7-3 7-6" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round"/><line x1="9" y1="13" x2="9" y2="19" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="15" y1="13" x2="15" y2="19" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="19" x2="17" y2="19" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                </div>
              </div>
              </HoverTooltip>

              {/* Logical Reasoning Card */}
              <HoverTooltip text="Scored based on your highest performance in logic-based games" content="Scored based on your highest performance in logic-based games" delay={200}>
              <div className="game-card" style={{ 
                padding: '1.25rem 1.5rem', 
                borderLeft: '4px solid #f59e0b', 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem',
                minWidth: '260px',
                boxSizing: 'border-box'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Logical Reasoning</span>
                    {domainDeltas.logical_mathematical !== 0 && (
                      <span style={{
                        background: domainDeltas.logical_mathematical > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: domainDeltas.logical_mathematical > 0 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: domainDeltas.logical_mathematical > 0 ? '#4ade80' : '#f87171',
                        fontSize: '0.65rem',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '9999px',
                        fontWeight: 'bold',
                        boxShadow: domainDeltas.logical_mathematical > 0 ? '0 0 6px rgba(34, 197, 94, 0.15)' : '0 0 6px rgba(239, 68, 68, 0.15)'
                      }}>
                        {domainDeltas.logical_mathematical > 0 ? `+${domainDeltas.logical_mathematical}` : domainDeltas.logical_mathematical}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.85rem', margin: '0.25rem 0', color: '#f59e0b', fontWeight: '800' }}>
                    {skills.logical_mathematical}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
                  </h3>
                  <p style={{ margin: '0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.35' }}>
                    Logical sequencing, path optimization, and relational connections.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  <ProgressRing radius={30} stroke={3.5} progress={skills.logical_mathematical / 100} color="#f59e0b" />
                   <span style={{ position: 'absolute', fontSize: '1.1rem' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(245,158,11,0.7))'}} xmlns="http://www.w3.org/2000/svg"><text x="3" y="17" fontSize="14" fontWeight="bold" fill="#f59e0b" fontFamily="monospace">12</text></svg></span>
                </div>
              </div>
              </HoverTooltip>

              {/* Reflexes & Focus Card */}
              <HoverTooltip text="Scored based on your highest performance in reflex-based games" content="Scored based on your highest performance in reflex-based games" delay={200}>
              <div className="game-card" style={{ 
                padding: '1.25rem 1.5rem', 
                borderLeft: '4px solid var(--color-secondary)', 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem',
                minWidth: '260px',
                boxSizing: 'border-box'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Reflexes & Focus</span>
                    {domainDeltas.reflexes_and_focus !== 0 && (
                      <span style={{
                        background: domainDeltas.reflexes_and_focus > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: domainDeltas.reflexes_and_focus > 0 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: domainDeltas.reflexes_and_focus > 0 ? '#4ade80' : '#f87171',
                        fontSize: '0.65rem',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '9999px',
                        fontWeight: 'bold',
                        boxShadow: domainDeltas.reflexes_and_focus > 0 ? '0 0 6px rgba(34, 197, 94, 0.15)' : '0 0 6px rgba(239, 68, 68, 0.15)'
                      }}>
                        {domainDeltas.reflexes_and_focus > 0 ? `+${domainDeltas.reflexes_and_focus}` : domainDeltas.reflexes_and_focus}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.85rem', margin: '0.25rem 0', color: 'var(--color-secondary)', fontWeight: '800' }}>
                    {skills.reflexes_and_focus}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
                  </h3>
                  <p style={{ margin: '0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.35' }}>
                    Continuous visual search, rapid target identification, and motor response.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  <ProgressRing radius={30} stroke={3.5} progress={skills.reflexes_and_focus / 100} color="var(--color-secondary)" />
                   <span style={{ position: 'absolute', fontSize: '1.1rem' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(250,204,21,0.9))'}} xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#facc15"/></svg></span>
                </div>
              </div>
              </HoverTooltip>

              {/* Executive Strategy Card */}
              <HoverTooltip text="Scored based on your highest performance in strategy-based games" content="Scored based on your highest performance in strategy-based games" delay={200}>
              <div className="game-card" style={{ 
                padding: '1.25rem 1.5rem', 
                borderLeft: '4px solid #10b981', 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem',
                minWidth: '260px',
                boxSizing: 'border-box'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Executive Strategy</span>
                    {domainDeltas.executive_strategy !== 0 && (
                      <span style={{
                        background: domainDeltas.executive_strategy > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: domainDeltas.executive_strategy > 0 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: domainDeltas.executive_strategy > 0 ? '#4ade80' : '#f87171',
                        fontSize: '0.65rem',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '9999px',
                        fontWeight: 'bold',
                        boxShadow: domainDeltas.executive_strategy > 0 ? '0 0 6px rgba(34, 197, 94, 0.15)' : '0 0 6px rgba(239, 68, 68, 0.15)'
                      }}>
                        {domainDeltas.executive_strategy > 0 ? `+${domainDeltas.executive_strategy}` : domainDeltas.executive_strategy}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.85rem', margin: '0.25rem 0', color: '#10b981', fontWeight: '800' }}>
                    {skills.executive_strategy}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
                  </h3>
                  <p style={{ margin: '0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.35' }}>
                    Planning, cognitive flexibility, rule shifting, and multi-step execution.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  <ProgressRing radius={30} stroke={3.5} progress={skills.executive_strategy / 100} color="#10b981" />
                   <span style={{ position: 'absolute', fontSize: '1.1rem' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(16,185,129,0.7))'}} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" stroke="#10b981" strokeWidth="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/></svg></span>
                </div>
              </div>
              </HoverTooltip>

            </div>

            {/* Middle Row: Trend Vector SVG + Radar Chart */}
            <div className="dashboard-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              
              {/* Difficulty Adaptation Plot */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(74,222,128,0.7))',flexShrink:0}} xmlns="http://www.w3.org/2000/svg"><polyline points="2,17 8,11 13,16 22,7" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17,7 22,7 22,12" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Difficulty Adaptation History</h3>
                <div style={{ position: 'relative', height: '240px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', height: '100%' }}>
                      <div className="skeleton-box" style={{ height: '15px', width: '30%' }}></div>
                      <div className="skeleton-box" style={{ flex: 1, width: '100%' }}></div>
                    </div>
                  ) : latestSessionMetrics.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                      <span>No play metrics found in current session.</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#4b5563' }}>Launch and play a game to stream DDA data.</span>
                    </div>
                  ) : (
                    <Line data={lineChartData} options={lineChartOptions} />
                  )}
                </div>
              </div>

              {/* Cohort Comparison Plot */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.7))',flexShrink:0}} xmlns="http://www.w3.org/2000/svg"><rect x="3" y="12" width="4" height="9" rx="1" fill="var(--color-primary)"/><rect x="10" y="6" width="4" height="15" rx="1" fill="var(--color-primary)"/><rect x="17" y="3" width="4" height="18" rx="1" fill="var(--color-primary)" fillOpacity="0.7"/></svg> Cohort Comparison (vs Clinical)</h3>
                <div style={{ position: 'relative', height: '240px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', height: '100%' }}>
                      <div className="skeleton-box" style={{ height: '15px', width: '40%' }}></div>
                      <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'flex-end' }}>
                        <div className="skeleton-box" style={{ height: '60%', flex: 1 }}></div>
                        <div className="skeleton-box" style={{ height: '90%', flex: 1 }}></div>
                      </div>
                    </div>
                  ) : !cohortComparison || (cohortComparison.user_averages.reaction_time_ms === 0 && cohortComparison.user_averages.accuracy_rate === 0) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                      <span>No user averages computed yet.</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#4b5563' }}>Complete sessions to compare vs clinical database.</span>
                    </div>
                  ) : (
                    <Bar data={barChartData} options={barChartOptions} />
                  )}
                </div>
              </div>

              {/* Cognitive Radar Chart */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(var(--rgb-secondary),0.7))',flexShrink:0}} xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 20,8 17,19 7,19 4,8" stroke="var(--color-secondary)" strokeWidth="1.5" fill="rgba(var(--rgb-secondary),0.1)"/><polygon points="12,6 17,10 15,16 9,16 7,10" stroke="var(--color-secondary)" strokeWidth="1" fill="rgba(var(--rgb-secondary),0.15)"/></svg> Cognitive Domain Radar Chart</h3>
                <div style={{ position: 'relative', height: '240px' }}>
                  <Radar data={radarDataEnhanced} options={radarOptions} />
                </div>
              </div>
            </div>

            {/* Premium Analytics row */}
            <h2 className="section-title">Premium Cognitive Analytics</h2>
            <div className="dashboard-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              
              {/* Multi-Session Reaction Time Trend */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(74,222,128,0.7))',verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg"><polyline points="2,17 8,11 13,16 22,7" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17,7 22,7 22,12" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span> Multi-Session RT Trend
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1.25rem 0', lineHeight: '1.3' }}>
                  Progression of speed and EMA trend over previous active game sessions.
                </p>
                <div style={{ position: 'relative', height: '220px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', height: '100%' }}>
                      <div className="skeleton-box" style={{ height: '15px', width: '30%' }}></div>
                      <div className="skeleton-box" style={{ flex: 1, width: '100%' }}></div>
                    </div>
                  ) : reversedSessions.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                      <span>No session history found.</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#4b5563' }}>Complete sessions to plot learning trends.</span>
                    </div>
                  ) : (
                    <Line data={sessionTrendData} options={sessionTrendOptions} />
                  )}
                </div>
              </div>

              {/* Per-Domain Accuracy Breakdown */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.7))',verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="var(--color-primary)" strokeWidth="1.5"/><circle cx="12" cy="12" r="5" stroke="var(--color-primary)" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="var(--color-primary)"/></svg></span> Per-Domain Accuracy
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1.25rem 0', lineHeight: '1.3' }}>
                  Average task precision and success rate percentages across cognitive domains.
                </p>
                <div style={{ position: 'relative', height: '220px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', height: '100%', justifyContent: 'space-around' }}>
                      <div className="skeleton-box" style={{ height: '20px', width: '70%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '90%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '50%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '80%' }}></div>
                    </div>
                  ) : sessionHistory.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                      <span>No domain accuracy data.</span>
                    </div>
                  ) : (
                    <Bar data={domainAccData} options={domainAccOptions} />
                  )}
                </div>
              </div>

              {/* Per-Game Score Breakdown */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(251,191,36,0.8))',verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg"><path d="M6 2h12v10a6 6 0 01-12 0V2z" fill="#fbbf24"/><path d="M5 7H2a4 4 0 004 4M19 7h3a4 4 0 01-4 4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="18" x2="12" y2="21" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="21" x2="16" y2="21" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/></svg></span> Per-Game Best Scores
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1.25rem 0', lineHeight: '1.3' }}>
                  Highest performance index achieved across specific game modules.
                </p>
                <div style={{ position: 'relative', height: '220px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', height: '100%', justifyContent: 'space-around' }}>
                      <div className="skeleton-box" style={{ height: '20px', width: '85%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '65%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '95%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '45%' }}></div>
                    </div>
                  ) : sortedGames.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                      <span>No high scores recorded.</span>
                    </div>
                  ) : (
                    <Bar data={perGameScoreData} options={perGameScoreOptions} />
                  )}
                </div>
              </div>

              {/* Accuracy vs RT Scatter Plot */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(251,191,36,0.8))',verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" fill="#fbbf24"/></svg></span> Reaction Time vs Accuracy
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1.25rem 0', lineHeight: '1.3' }}>
                  Execution speed mapped against success rate for the current session.
                </p>
                <div style={{ position: 'relative', height: '220px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                      Loading scatter distribution...
                    </div>
                  ) : latestSessionMetrics.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                      <span>No metrics in current session.</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#4b5563' }}>Complete a training round to populate.</span>
                    </div>
                  ) : (
                    <Scatter data={scatterData} options={scatterOptions} />
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Row: Behavioral Insights and Recommendations */}
            <div className="dashboard-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              
              {/* Cognitive Profile Card & Behavioral Insights */}
              <div className="game-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.6))',flexShrink:0}} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" fill="var(--color-primary)"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/></svg> Classifier Profile &amp; Behavioral Insights</h3>
                  <div style={{ textAlign: 'center', padding: '1rem 0 1.5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Your Cognitive Playstyle</div>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.5rem 1.5rem',
                      borderRadius: '9999px',
                      background: 'rgba(var(--rgb-primary), 0.15)',
                      border: '1px solid rgba(var(--rgb-primary), 0.3)',
                      color: 'var(--color-primary)',
                      fontWeight: 'bold',
                      marginTop: '0.5rem',
                      fontSize: '1.3rem'
                    }}>
                      {cognitiveProfile.archetype}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem', fontWeight: '500' }}>
                      AI Prediction Confidence: {Math.round(cognitiveProfile.confidence_score * 100)}%
                    </div>
                  </div>

                  {/* Behavioral Analytics Insight Alerts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
                    {lastGameStats && lastGameStats.hesitation_ms >= 800 && lastGameStats.accuracy >= 0.85 && (
                      <div style={{ 
                        background: 'rgba(6, 182, 212, 0.08)', 
                        border: '1px solid rgba(6, 182, 212, 0.25)', 
                        padding: '0.85rem', 
                        borderRadius: '8px', 
                        color: '#22d3ee', 
                        fontSize: '0.825rem',
                        textAlign: 'left',
                        boxShadow: '0 0 10px rgba(6, 182, 212, 0.15)',
                        lineHeight: '1.4'
                      }}>
                        <strong>⚡ Methodical Assessment:</strong> Exhibits careful & accurate planning, prioritizing low-error execution over speed.
                      </div>
                    )}
                    {lastGameStats && lastGameStats.spam_click_count >= 3 && (
                      <div style={{ 
                        background: 'rgba(249, 115, 22, 0.08)', 
                        border: '1px solid rgba(249, 115, 22, 0.25)', 
                        padding: '0.85rem', 
                        borderRadius: '8px', 
                        color: '#fb923c', 
                        fontSize: '0.825rem',
                        textAlign: 'left',
                        boxShadow: '0 0 10px rgba(249, 115, 22, 0.15)',
                        lineHeight: '1.4'
                      }}>
                        <strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 5px rgba(249,115,22,0.8))', verticalAlign:'text-bottom', marginRight:'4px'}} xmlns="http://www.w3.org/2000/svg"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Frustration Alert:</strong> Impulsive Task Friction Identified: Real-time kinetic feedback indicates panic-driven or non-target execution behaviors during accelerated DDA challenge thresholds.
                      </div>
                    )}
                    {(!lastGameStats || (lastGameStats.hesitation_ms < 800 && lastGameStats.spam_click_count < 3)) && (
                      <div style={{ fontSize: '0.825rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>
                        No acute behavioral anomalies registered in current session. Play modules to stream live telemetry.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Skill Diagnostics & Recommendations */}
              <div className="game-card" style={{ justifyContent: 'space-between', boxSizing: 'border-box' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>🔍 Diagnostic Report</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '0.85rem' }}>💪 SKILL STRENGTH:</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                        {skills.reflexes_and_focus >= 70 ? 'Rapid Visuomotor Attentional Focus. High reflexive reaction times and rapid target selection.' : 'Standard motor control latency. Stabilizing baseline performance.'}
                      </p>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '0.85rem' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 5px rgba(239,68,68,0.8))', verticalAlign:'text-bottom', marginRight:'4px'}} xmlns="http://www.w3.org/2000/svg"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> SKILL WEAKNESS:</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                        {skills.spatial_visual_memory < 70 ? 'Short-Term Spatial sequence recall vigilance can be optimized under distractor noise.' : 'Working Memory retention logic is currently your secondary optimization track.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>💡 Personalized Adviser Recommendation</div>
                  <div style={{ fontWeight: '700', color: '#c084fc', marginTop: '0.25rem', fontSize: '0.95rem' }}>
                    <button onClick={() => setActiveGame && setActiveGame(prescribedGame)} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'linear-gradient(90deg, var(--color-secondary), #ec4899)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      ▶ Start Recommended Training: {rec.game}
                    </button>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    {rec.reason}. Launch module to {rec.action}.
                  </p>
                </div>
              </div>

              {/* Archetype Progression Timeline Card (Option 3) */}
              <div className="game-card" style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minHeight: '320px', justifyContent: 'flex-start' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>⏱️ Archetype Progression Timeline</h3>
                
                {chartsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                    Loading progression timeline...
                  </div>
                ) : archetypeHistory.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1rem', flex: 1 }}>
                    <span>No historical progression logs recorded.</span>
                    <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#4b5563' }}>Complete adaptive training sessions to trace profile progression.</span>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.25rem', 
                    maxHeight: '260px', 
                    overflowY: 'auto', 
                    paddingRight: '0.5rem',
                    textAlign: 'left',
                    flex: 1
                  }}>
                    {archetypeHistory.map((item, idx) => {
                      // Color mapping for archetypes
                      let badgeColor = 'rgba(var(--rgb-secondary), 0.15)'; // purple
                      let textColor = '#c084fc';
                      let borderColor = 'rgba(var(--rgb-secondary), 0.3)';

                      if (item.archetype_name === 'Advanced') {
                        badgeColor = 'rgba(34, 197, 94, 0.15)'; // green
                        textColor = '#4ade80';
                        borderColor = 'rgba(34, 197, 94, 0.3)';
                      } else if (item.archetype_name === 'Beginner') {
                        badgeColor = 'rgba(239, 68, 68, 0.15)'; // red
                        textColor = '#f87171';
                        borderColor = 'rgba(239, 68, 68, 0.3)';
                      } else if (item.archetype_name === 'Standard') {
                        badgeColor = 'rgba(var(--rgb-primary), 0.15)'; // blue
                        textColor = 'var(--color-primary)';
                        borderColor = 'rgba(var(--rgb-primary), 0.3)';
                      }

                      return (
                        <div key={item.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                          {/* Timeline vertical connector line */}
                          {idx < archetypeHistory.length - 1 && (
                            <div style={{
                              position: 'absolute',
                              left: '9px',
                              top: '20px',
                              bottom: '-25px',
                              width: '2px',
                              background: 'rgba(255, 255, 255, 0.08)'
                            }} />
                          )}

                          {/* Dot indicator */}
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: textColor,
                            marginTop: '6px',
                            boxShadow: `0 0 8px ${textColor}`,
                            flexShrink: 0,
                            marginLeft: '5px'
                          }} />

                          {/* Content block */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ 
                                display: 'inline-block',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background: badgeColor,
                                border: `1.5px solid ${borderColor}`,
                                color: textColor,
                                fontSize: '0.725rem',
                                fontWeight: 'bold'
                              }}>
                                {item.archetype_name}
                              </span>
                              <span style={{ fontSize: '0.675rem', color: '#64748b' }}>
                                {item.timestamp ? item.timestamp.split(' ')[0] : ''}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '0.25rem' }}>
                              Played <strong style={{ color: '#ffffff' }}>{item.game_type}</strong> (Session {item.session_id})
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              Model Confidence: {Math.round(item.confidence_score * 100)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

  );
}
