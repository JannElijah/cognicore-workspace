import React from 'react';
import { Line, Scatter } from 'react-chartjs-2';

export default function AdminPanel(props) {
  const { 
    portalView, activeResearcherTab, setActiveResearcherTab, modelStatus, evalLoading, 
    evalResult, evalError, pretestInput, setPretestInput, posttestInput, setPosttestInput, 
    runCohortEvaluation, retrainLoading, retrainMetrics, triggerModelRetrain, sandboxLoading, 
    sandboxError, sandboxCohort, setSandboxCohort, loadDatabaseCohort, loadSimulatedCohort, 
    learningCurves, curveMetric, setCurveMetric, sandboxVar1, setSandboxVar1, sandboxVar2, 
    setSandboxVar2, correlationResult, getLearningCurvesChartData, 
    learningCurvesChartOptions, clusterLoading, clusterError, clusterDataPoints, clusterXVar, 
    setClusterXVar, clusterYVar, setClusterYVar, getClusteringScatterData, clusteringScatterOptions,
    activeDashboardUser, getScatterChartData, scatterChartOptions, getCalculatedCentroids
  } = props;

  return (
          // ==========================================
          // CLINICAL RESEARCHER VIEW
          // ==========================================
          <div className="dashboard-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="intro-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <h1 style={{ fontSize: '2.25rem' }}>🔬 Clinical Research Portal</h1>
              <p style={{ maxWidth: '800px', margin: '0 auto' }}>Execute Scipy-backed paired t-test cohort verifications and review statistical significance reports for experimental serious game evaluations.</p>
              <a 
                href="http://127.0.0.1:5000/api/export-csv" 
                download
                className="dashboard-toggle-btn"
                style={{
                  background: 'linear-gradient(to right, #10b981, #059669)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}
                onMouseOver={(e) => e.target.style.filter = "brightness(1.1)"}
                onMouseOut={(e) => e.target.style.filter = "brightness(1.0)"}
              >
                📥 Download Cohort Telemetry Report (.CSV)
              </a>
            </div>

            {/* Tab navigation buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '0.75rem',
              width: '100%'
            }}>
              <button
                onClick={() => setActiveResearcherTab('cohort-stats')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeResearcherTab === 'cohort-stats' ? '#38bdf8' : '#94a3b8',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '0.5rem 1.25rem',
                  borderBottom: activeResearcherTab === 'cohort-stats' ? '3px solid #38bdf8' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📊 Cohort Statistics & ISO 25010
              </button>
              <button
                onClick={() => setActiveResearcherTab('ai-sandbox')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeResearcherTab === 'ai-sandbox' ? '#38bdf8' : '#94a3b8',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '0.5rem 1.25rem',
                  borderBottom: activeResearcherTab === 'ai-sandbox' ? '3px solid #38bdf8' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🤖 AI Sandbox & Clustering
              </button>
            </div>

            {activeResearcherTab === 'cohort-stats' ? (
              <>
                <h2 className="section-title">Thesis Verification Engine (Pillar 1 Research Design)</h2>
            <div className="game-card" style={{ width: '100%', alignItems: 'stretch', padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <span style={{ fontWeight: 'bold', color: '#c084fc', fontSize: '0.9rem' }}>Pillar 1: Empirical Cognitive Improvement (Pretest-Posttest Design)</span>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Input pre-intervention and post-intervention scores for your research cohort. The backend will calculate the overall group Improvement Rate (%) and run a **Paired t-test** to calculate the t-statistic and p-value.
                </p>
              </div>

              {evalError && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{evalError}</div>}

              <div className="eval-inputs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '600' }}>Pretest Scores (comma separated)</label>
                  <input 
                    type="text" 
                    value={pretestInput} 
                    onChange={(e) => setPretestInput(e.target.value)} 
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#09090b',
                      border: '1.5px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '600' }}>Posttest Scores (comma separated)</label>
                  <input 
                    type="text" 
                    value={posttestInput} 
                    onChange={(e) => setPosttestInput(e.target.value)} 
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#09090b',
                      border: '1.5px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                  onClick={runCohortEvaluation} 
                  disabled={evalLoading}
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flex: '1'
                  }}
                >
                  {evalLoading ? 'Running Statistical Engine...' : 'Calculate Paired t-test Statistics'}
                </button>
                <button 
                  onClick={loadSimulatedCohort}
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Load Simulated Cohort (n=15)
                </button>
                <button 
                  onClick={loadDatabaseCohort}
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Load Seeded Cohort (n=30)
                </button>
              </div>

              {/* Statistical Output Results Table */}
              {evalResult && (
                <div style={{ background: '#09090b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
                  <h4 style={{ color: '#38bdf8', marginBottom: '1rem', fontWeight: 'bold' }}>🔬 Paired t-test Evaluation Report</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cohort Sample Size (n)</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{evalResult.sample_size}</div>
                    </div>
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Mean Score (Pre / Post)</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem', color: '#e2e8f0' }}>
                        {evalResult.mean_pretest} <span style={{ color: '#64748b', fontSize: '1rem' }}>→</span> <span style={{ color: '#4ade80' }}>{evalResult.mean_posttest}</span>
                      </div>
                    </div>
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Improvement Rate (%)</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem', color: '#4ade80' }}>
                        +{evalResult.overall_improvement_rate_pct}%
                      </div>
                    </div>
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Paired t-test Statistics</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                        t = {evalResult.t_statistic}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                        p = {evalResult.p_value}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Effect Size (Cohen's d)</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.25rem', color: '#ffffff' }}>
                        d = {evalResult.cohens_d !== undefined ? evalResult.cohens_d : '0.0000'}
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}>
                        Magnitude: <span style={{
                          fontWeight: 'bold',
                          textTransform: 'capitalize',
                          color: evalResult.effect_size_magnitude === 'large' ? '#4ade80' :
                                 evalResult.effect_size_magnitude === 'medium' ? '#f59e0b' :
                                 evalResult.effect_size_magnitude === 'small' ? '#06b6d4' : '#64748b'
                        }}>
                          {evalResult.effect_size_magnitude || 'negligible'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid ' + (evalResult.statistically_significant ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                    background: evalResult.statistically_significant ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    color: evalResult.statistically_significant ? '#4ade80' : '#ef4444',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                  }}>
                    {evalResult.statistically_significant ? '✅ ' : '❌ '} {evalResult.hypothesis_result} (p &lt; 0.05)
                  </div>
                </div>
              )}
            </div>

            <h2 className="section-title" style={{ marginTop: '2.5rem' }}>🔬 Interactive Statistical Sandbox & Correlation Tool</h2>
            <div className="game-card" style={{ width: '100%', alignItems: 'stretch', padding: '2rem', marginBottom: '2rem', boxSizing: 'border-box' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <span style={{ fontWeight: 'bold', color: '#38bdf8', fontSize: '0.9rem' }}>Pillar 1 Dynamic Correlation Analysis & Cohort Comparison</span>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Analyze relationships between cognitive micro-behaviors and performance telemetry on-the-fly. Select any two parameters to compute the Pearson Correlation Coefficient (r), R-squared (R²), and statistical significance (p-value).
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 'bold' }}>X-Axis Variable (Var 1):</label>
                  <select
                    value={sandboxVar1}
                    onChange={(e) => setSandboxVar1(e.target.value)}
                    style={{ background: '#09090b', color: '#fff', border: '1.5px solid #334155', borderRadius: '6px', padding: '0.5rem', width: '100%', outline: 'none' }}
                  >
                    <option value="reaction_time">Reaction Time (ms)</option>
                    <option value="accuracy_rate">Accuracy Rate</option>
                    <option value="difficulty_level">Challenge Level</option>
                    <option value="error_count">Error Count</option>
                    <option value="hesitation_ms">Hesitation Latency (ms)</option>
                    <option value="spam_click_count">Spam Click Count</option>
                    <option value="rule_shift_latency_ms">Rule-Shift Latency (ms)</option>
                    <option value="path_efficiency">Path Efficiency</option>
                  </select>
                </div>

                <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 'bold' }}>Y-Axis Variable (Var 2):</label>
                  <select
                    value={sandboxVar2}
                    onChange={(e) => setSandboxVar2(e.target.value)}
                    style={{ background: '#09090b', color: '#fff', border: '1.5px solid #334155', borderRadius: '6px', padding: '0.5rem', width: '100%', outline: 'none' }}
                  >
                    <option value="spam_click_count">Spam Click Count</option>
                    <option value="rule_shift_shift_ms">Rule-Shift Latency (ms)</option>
                    <option value="rule_shift_latency_ms">Rule-Shift Latency (ms)</option>
                    <option value="reaction_time">Reaction Time (ms)</option>
                    <option value="accuracy_rate">Accuracy Rate</option>
                    <option value="difficulty_level">Challenge Level</option>
                    <option value="error_count">Error Count</option>
                    <option value="hesitation_ms">Hesitation Latency (ms)</option>
                    <option value="path_efficiency">Path Efficiency</option>
                  </select>
                </div>

                <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 'bold' }}>Select Analysis Cohort:</label>
                  <select
                    value={sandboxCohort}
                    onChange={(e) => setSandboxCohort(e.target.value)}
                    style={{ background: '#09090b', color: '#fff', border: '1.5px solid #334155', borderRadius: '6px', padding: '0.5rem', width: '100%', outline: 'none' }}
                  >
                    <option value="all">All Subjects Cohort (General)</option>
                    <option value="clinical">Clinical Research Cohort (clinical_subject_*)</option>
                    <option value="active">Active Participant ({activeDashboardUser})</option>
                  </select>
                </div>
              </div>

              {sandboxLoading && <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Recalculating Pearson Correlation Matrices...</div>}
              {sandboxError && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{sandboxError}</div>}

              {!sandboxLoading && correlationResult && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                    <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
                      <h4 style={{ color: '#38bdf8', fontSize: '1.05rem', margin: '0 0 1rem 0', fontWeight: 'bold' }}>📉 Pearson Correlation Coefficient</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Pearson r Coefficient</span>
                          <span style={{ fontSize: '2rem', fontWeight: '900', color: correlationResult.r >= 0 ? '#38bdf8' : '#fb923c' }}>{correlationResult.r}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>R-squared (R²)</span>
                          <span style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff' }}>{correlationResult.r_squared}</span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>p-value Significance</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: correlationResult.p_value < 0.05 ? '#4ade80' : '#f87171' }}>p = {correlationResult.p_value}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Correlation Magnitude</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'capitalize', color: correlationResult.magnitude === 'strong' ? '#4ade80' : correlationResult.magnitude === 'moderate' ? '#f59e0b' : '#94a3b8' }}>
                            {correlationResult.magnitude} ({correlationResult.direction})
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: '1.5rem', padding: '0.85rem', borderRadius: '8px', fontSize: '0.85rem', lineHeight: '1.45', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                        <strong>💡 Interpretation:</strong> {correlationResult.interpretation}
                      </div>
                    </div>

                    {learningCurves && (
                      <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
                        <h4 style={{ color: '#4ade80', fontSize: '1.05rem', margin: '0 0 0.75rem 0', fontWeight: 'bold' }}>📈 Learning Curves Analysis</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1.25rem 0' }}>
                          Compare training progression rates side-by-side. View longitudinal improvement over sessions.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setCurveMetric('accuracy')}
                            style={{
                              flex: 1,
                              padding: '0.45rem',
                              borderRadius: '6px',
                              border: '1px solid ' + (curveMetric === 'accuracy' ? 'transparent' : 'rgba(255,255,255,0.1)'),
                              background: curveMetric === 'accuracy' ? 'linear-gradient(to right, #4ade80, #38bdf8)' : 'rgba(255,255,255,0.03)',
                              color: '#fff',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Accuracy Rate (%)
                          </button>
                          <button
                            onClick={() => setCurveMetric('reaction_time')}
                            style={{
                              flex: 1,
                              padding: '0.45rem',
                              borderRadius: '6px',
                              border: '1px solid ' + (curveMetric === 'reaction_time' ? 'transparent' : 'rgba(255,255,255,0.1)'),
                              background: curveMetric === 'reaction_time' ? 'linear-gradient(to right, #4ade80, #38bdf8)' : 'rgba(255,255,255,0.03)',
                              color: '#fff',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Reaction Time (ms)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '320px', boxSizing: 'border-box' }}>
                      <h4 style={{ color: '#e2e8f0', fontSize: '1rem', margin: '0 0 1rem 0', fontWeight: 'bold', textAlign: 'left' }}>Scatter Plot & Regression Line</h4>
                      <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 30px)' }}>
                        <Scatter data={getScatterChartData()} options={scatterChartOptions} />
                      </div>
                    </div>

                    {learningCurves && (
                      <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '320px', boxSizing: 'border-box' }}>
                        <h4 style={{ color: '#e2e8f0', fontSize: '1rem', margin: '0 0 1rem 0', fontWeight: 'bold', textAlign: 'left' }}>Longitudinal Cohort Comparison Curves</h4>
                        <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 30px)' }}>
                          <Line data={getLearningCurvesChartData()} options={learningCurvesChartOptions} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </>
        ) : (
          <div style={{ animation: 'fadeIn 0.4s ease-out', width: '100%' }}>
            <h2 className="section-title">AI Sandbox & Dynamic Archetype Clustering</h2>
            
            {/* STATUS & RETRAIN SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              
              {/* Active Model Status Card */}
              <div className="game-card" style={{ flex: '1', alignItems: 'stretch', padding: '2rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
                <h3 style={{ color: '#38bdf8', marginBottom: '1.25rem', fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🤖 Active Model Status
                </h3>
                
                {modelStatus ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Python Scikit-Learn:</span>
                      <span style={{ fontWeight: 'bold', color: modelStatus.is_sklearn_available ? '#4ade80' : '#ef4444' }}>
                        {modelStatus.is_sklearn_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loaded From Pickles:</span>
                      <span style={{ fontWeight: 'bold', color: modelStatus.is_loaded_from_disk ? '#4ade80' : '#f59e0b' }}>
                        {modelStatus.is_loaded_from_disk ? 'Yes (Disk)' : 'No (Synthetic Fallback)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Training Session Size:</span>
                      <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>
                        {modelStatus.dataset_size} sessions
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>DDA Classifiers Loaded:</span>
                      <span style={{ fontWeight: 'bold', color: modelStatus.has_rf_model ? '#4ade80' : '#ef4444' }}>
                        {modelStatus.has_rf_model ? 'Ready' : 'Not Loaded'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Clustering Model (KMeans):</span>
                      <span style={{ fontWeight: 'bold', color: modelStatus.has_clustering_model ? '#4ade80' : '#ef4444' }}>
                        {modelStatus.has_clustering_model ? 'Ready' : 'Not Loaded'}
                      </span>
                    </div>
                    
                    {modelStatus.hyperparameters && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Active Classifier Hyperparams:</span>
                        <pre style={{ margin: 0, padding: '0.75rem', background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto', color: '#38bdf8' }}>
                          {JSON.stringify({
                            n_estimators: modelStatus.hyperparameters.n_estimators || 50,
                            max_depth: modelStatus.hyperparameters.max_depth || 6,
                            min_samples_split: modelStatus.hyperparameters.min_samples_split || 2,
                            criterion: modelStatus.hyperparameters.criterion || 'gini'
                          }, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>Loading model status...</div>
                )}
              </div>

              {/* Retrain Control Panel */}
              <div className="game-card" style={{ flex: '1', alignItems: 'stretch', padding: '2rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
                <h3 style={{ color: '#38bdf8', marginBottom: '1.25rem', fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚙️ Retrain & Optimize Engine
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.5rem 0', lineHeight: '1.4' }}>
                  Trigger online retraining of the supervised DDA classifier. The engine runs unsupervised K-Means clustering ($k=3$) over 7 telemetry dimensions to form fresh player archetypes, then retrains a Random Forest Classifier via Grid Search to predict these labels.
                </p>
                
                <button
                  onClick={triggerModelRetrain}
                  disabled={retrainLoading}
                  className="dashboard-toggle-btn"
                  style={{
                    background: 'linear-gradient(to right, #38bdf8, #a855f7)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                    cursor: retrainLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    transition: 'all 0.2s',
                    marginBottom: '1rem'
                  }}
                >
                  {retrainLoading ? (
                    <>
                      <span className="spinner" style={{ display: 'inline-block', width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                      Executing Grid Search Retraining...
                    </>
                  ) : (
                    '⚡ Retrain & Tune Classifier'
                  )}
                </button>

                {retrainMetrics ? (
                  <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
                    <h4 style={{ color: '#4ade80', margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 'bold' }}>✓ Retraining Successful</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Validation Accuracy:</span>
                        <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '1.1rem' }}>{(retrainMetrics.test_accuracy * 100).toFixed(2)}%</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Optimized Hyperparams:</span>
                        <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>
                          d={retrainMetrics.best_params.max_depth || 'none'}, est={retrainMetrics.best_params.n_estimators}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                    No retraining has been executed in the current session.
                  </div>
                )}
              </div>
            </div>

            {/* CENTROIDS & METRICS MATRIX */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              
              {/* Centroids Table */}
              <div className="game-card" style={{ flex: '1', alignItems: 'stretch', padding: '2rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px' }}>
                <h3 style={{ color: '#38bdf8', marginBottom: '1.25rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  📊 Dynamic Archetype Centroids
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                  The average performance values for each discovered archetype, computed dynamically across the database cohort:
                </p>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                        <th style={{ padding: '0.5rem' }}>Behavioral Metric</th>
                        <th style={{ padding: '0.5rem', color: '#ef4444' }}>High Fatigue</th>
                        <th style={{ padding: '0.5rem', color: '#f59e0b' }}>Plateauing</th>
                        <th style={{ padding: '0.5rem', color: '#10b981' }}>Fast Learner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'accuracy', name: 'Accuracy Rate', format: (v) => `${(v * 100).toFixed(1)}%` },
                        { key: 'reaction_time', name: 'Reaction Time', format: (v) => `${v.toFixed(0)} ms` },
                        { key: 'hesitation', name: 'Hesitation Latency', format: (v) => `${v.toFixed(0)} ms` },
                        { key: 'spam_clicks', name: 'Spam Click Count', format: (v) => v.toFixed(1) },
                        { key: 'path_efficiency', name: 'Path Efficiency', format: (v) => v.toFixed(2) }
                      ].map((metric) => {
                        const centroids = getCalculatedCentroids();
                        return (
                          <tr key={metric.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 'bold', color: '#e2e8f0' }}>{metric.name}</td>
                            <td style={{ padding: '0.5rem', color: '#f87171' }}>
                              {centroids["High Fatigue"] && centroids["High Fatigue"][metric.key] !== undefined ? metric.format(centroids["High Fatigue"][metric.key]) : 'N/A'}
                            </td>
                            <td style={{ padding: '0.5rem', color: '#fbbf24' }}>
                              {centroids["Plateauing"] && centroids["Plateauing"][metric.key] !== undefined ? metric.format(centroids["Plateauing"][metric.key]) : 'N/A'}
                            </td>
                            <td style={{ padding: '0.5rem', color: '#34d399' }}>
                              {centroids["Fast Learner"] && centroids["Fast Learner"][metric.key] !== undefined ? metric.format(centroids["Fast Learner"][metric.key]) : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Classification Report Card */}
              <div className="game-card" style={{ flex: '1', alignItems: 'stretch', padding: '2rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px' }}>
                <h3 style={{ color: '#38bdf8', marginBottom: '1.25rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  📈 Classification Performance Report
                </h3>
                {retrainMetrics && retrainMetrics.classification_report ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                          <th style={{ padding: '0.5rem' }}>Archetype Class</th>
                          <th style={{ padding: '0.5rem' }}>Precision</th>
                          <th style={{ padding: '0.5rem' }}>Recall</th>
                          <th style={{ padding: '0.5rem' }}>F1-Score</th>
                          <th style={{ padding: '0.5rem' }}>Support</th>
                        </tr>
                      </thead>
                      <tbody>
                        {["Fast Learner", "Plateauing", "High Fatigue"].map((clsName) => {
                          const stats = retrainMetrics.classification_report[clsName];
                          if (!stats) return null;
                          return (
                            <tr key={clsName} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '0.5rem', fontWeight: 'bold', color: clsName === 'Fast Learner' ? '#34d399' : clsName === 'Plateauing' ? '#fbbf24' : '#f87171' }}>{clsName}</td>
                              <td style={{ padding: '0.5rem' }}>{stats.precision.toFixed(3)}</td>
                              <td style={{ padding: '0.5rem' }}>{stats.recall.toFixed(3)}</td>
                              <td style={{ padding: '0.5rem' }}>{stats['f1-score'].toFixed(3)}</td>
                              <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{stats.support}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', color: '#e2e8f0' }}>
                          <td style={{ padding: '0.5rem' }}>Accuracy</td>
                          <td style={{ padding: '0.5rem' }}></td>
                          <td style={{ padding: '0.5rem' }}></td>
                          <td style={{ padding: '0.5rem' }}>{retrainMetrics.classification_report.accuracy.toFixed(3)}</td>
                          <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{retrainMetrics.classification_report.macro_avg ? retrainMetrics.classification_report.macro_avg.support : ''}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', padding: '3rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                    💡 Run model retraining to retrieve classification metrics (precision, recall, f1-score).
                  </div>
                )}
              </div>
            </div>

            {/* 2D SCATTER PLOT VIEW */}
            <div className="game-card" style={{ width: '100%', alignItems: 'stretch', padding: '2rem', boxSizing: 'border-box', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                🎯 Interactive 2D Archetype Space
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.5rem 0' }}>
                Plot sessions in a 2-dimensional scatter space colored by cluster archetype. Select metrics for X and Y axes to observe feature boundaries.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 'bold' }}>Horizontal X-Axis Metric:</label>
                  <select
                    value={clusterXVar}
                    onChange={(e) => setClusterXVar(e.target.value)}
                    style={{ background: '#09090b', color: '#fff', border: '1.5px solid #334155', borderRadius: '6px', padding: '0.5rem', width: '100%', outline: 'none' }}
                  >
                    <option value="accuracy">Accuracy Rate</option>
                    <option value="reaction_time">Reaction Time (ms)</option>
                    <option value="acc_slope">Accuracy Learning Slope</option>
                    <option value="rt_slope">Reaction Time Learning Slope</option>
                    <option value="hesitation">Hesitation Latency (ms)</option>
                    <option value="spam_clicks">Spam Clicks</option>
                    <option value="path_efficiency">Path Efficiency</option>
                  </select>
                </div>

                <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 'bold' }}>Vertical Y-Axis Metric:</label>
                  <select
                    value={clusterYVar}
                    onChange={(e) => setClusterYVar(e.target.value)}
                    style={{ background: '#09090b', color: '#fff', border: '1.5px solid #334155', borderRadius: '6px', padding: '0.5rem', width: '100%', outline: 'none' }}
                  >
                    <option value="accuracy">Accuracy Rate</option>
                    <option value="reaction_time">Reaction Time (ms)</option>
                    <option value="acc_slope">Accuracy Learning Slope</option>
                    <option value="rt_slope">Reaction Time Learning Slope</option>
                    <option value="hesitation">Hesitation Latency (ms)</option>
                    <option value="spam_clicks">Spam Clicks</option>
                    <option value="path_efficiency">Path Efficiency</option>
                  </select>
                </div>
              </div>

              {clusterLoading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading cluster points...</div>}
              {clusterError && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{clusterError}</div>}

              {!clusterLoading && clusterDataPoints.length > 0 && (
                <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '420px', boxSizing: 'border-box' }}>
                  <h4 style={{ color: '#e2e8f0', fontSize: '1rem', margin: '0 0 1rem 0', fontWeight: 'bold', textAlign: 'left' }}>Cohort Sessions Spatial Grouping</h4>
                  <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 30px)' }}>
                    <Scatter data={getClusteringScatterData()} options={clusteringScatterOptions} />
                  </div>
                </div>
              )}
              
              {!clusterLoading && clusterDataPoints.length === 0 && (
                <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  No sessions data available for clustering. Play some games first!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

  );
}
