import { useEffect, useRef } from 'react';
import useCogniStore from '../store/useCogniStore';
import { audioDda } from '../utils/audioSynth';

export default function useApiInterceptor({
  setActiveSessionId,
  setLiveDdaParams,
  setLiveCognitiveProfile,
  setLiveMetrics,
  setDdaAdvisorLogs,
  setDdaAdvisorMessage,
  liveDdaParams,
  sessionRewardsRef,
  smoothingAlphaRef
}) {
  const prevDdaParamsRef = useRef(null);

  useEffect(() => {
    const originalFetch = window.fetch || globalThis.fetch;
    if (!originalFetch) return;

    window.fetch = async (...args) => {
      const url = args[0];
      let options = args[1] || {};
      
      const token = useCogniStore.getState().token;
      if (token) {
          options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${token}`
          };
          args[1] = options;
      }
      
      if (typeof url === 'string' && url.includes('/api/dda')) {
        const options = args[1] || {};
        if (options.method === 'POST') {
          try {
            let body = {};
            if (options.body) {
              body = JSON.parse(options.body);
            }
            body.smoothing_alpha = smoothingAlphaRef.current;
            options.body = JSON.stringify(body);
            args[1] = options;
          } catch (e) {
            console.error('[Fetch Interceptor] Failed to inject smoothing_alpha', e);
          }
        }
      }

      const response = await originalFetch(...args);
      if (typeof url === 'string') {
        if (url.includes('/api/start-session') && response.ok) {
          try {
            const cloned = response.clone();
            cloned.json().then(data => {
              if (data && data.status === 'success') {
                setActiveSessionId(data.session_id);
                setLiveDdaParams(data.dda_parameters);
                setLiveCognitiveProfile(null);
                setLiveMetrics([]);
                setDdaAdvisorLogs([]);
                setDdaAdvisorMessage(null);
                prevDdaParamsRef.current = null;
                
                // Initialize Audio DDA Synthesizer
                audioDda.init();
                if (data.dda_parameters && data.dda_parameters.difficulty_level) {
                  audioDda.setDifficulty(data.dda_parameters.difficulty_level);
                }
              }
            });
          } catch (e) {
            console.error('[Telemetry HUD] Error parsing start-session', e);
          }
        }
        if (url.includes('/api/submit-metrics')) {
          try {
            const options = args[1] || {};
            if (options.body) {
              const body = JSON.parse(options.body);
              let items = [];
              if (Array.isArray(body)) {
                items = body;
              } else if (body && Array.isArray(body.metrics)) {
                items = body.metrics;
              } else {
                items = [body];
              }
              
              items.forEach(item => {
                const accuracy = item.accuracy_rate !== undefined ? item.accuracy_rate : item.accuracy;
                const rt = item.reaction_time !== undefined ? item.reaction_time : item.reaction_time_ms;
                const spamClicks = item.spam_click_count || 0;
                const hesitation = item.hesitation_ms || 0;
                
                if (accuracy !== undefined && rt !== undefined) {
                  setLiveMetrics(prev => [...prev, { accuracy, rt, spamClicks, hesitation }]);
                  
                  // Play success (blip) / failure (buzz) synthesized audio tones
                  audioDda.playFeedback(accuracy === 1.0);
                  
                  // Trigger low-pass calming mode when player shows panic or high hesitation latency
                  if (spamClicks > 2 || hesitation > 1500) {
                    audioDda.setFrustration(true);
                  }
                }
              });
            }
            
            if (response.ok) {
              response.clone().json().then(data => {
                if (data && data.status === 'success' && data.rewards) {
                  sessionRewardsRef.current.xp += data.rewards.xp || 0;
                  sessionRewardsRef.current.coins += data.rewards.coins || 0;
                  if (data.rewards.leveled_up) sessionRewardsRef.current.leveled_up = true;
                }
              }).catch(e => {
                // Ignore parse errors if response isn't JSON
              });
            }
          } catch (e) {
            console.error('[Telemetry HUD] Error parsing submit-metrics', e);
          }
        }
        if (url.includes('/api/dda') && response.ok) {
          try {
            const cloned = response.clone();
            cloned.json().then(data => {
              if (data && data.status === 'success') {
                if (data.dda_parameters) {
                  setLiveDdaParams(data.dda_parameters);
                  if (data.dda_parameters.difficulty_level) {
                    audioDda.setDifficulty(data.dda_parameters.difficulty_level);
                  }
                }
                if (data.cognitive_profile) {
                  setLiveCognitiveProfile(data.cognitive_profile);
                }
                
                // Revert low-pass soothing filter back to standard focus mode when difficulty updates
                audioDda.setFrustration(false);
              }
            });
          } catch (e) {
            console.error('[Telemetry HUD] Error parsing dda', e);
          }
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [
    setActiveSessionId,
    setLiveDdaParams,
    setLiveCognitiveProfile,
    setLiveMetrics,
    setDdaAdvisorLogs,
    setDdaAdvisorMessage,
    sessionRewardsRef,
    smoothingAlphaRef
  ]);

  // Track DDA Parameter changes for Option D Advisor
  useEffect(() => {
    if (liveDdaParams) {
      if (prevDdaParamsRef.current) {
        const prev = prevDdaParamsRef.current;
        const curr = liveDdaParams;
        
        let changes = [];
        let reason = "";
        
        // 1. Difficulty Level change
        if (curr.difficulty_level !== prev.difficulty_level) {
          const dir = curr.difficulty_level > prev.difficulty_level ? 'increased' : 'decreased';
          changes.push(`Difficulty ${dir} to Level ${curr.difficulty_level}`);
          
          if (dir === 'increased') {
            reason = "Your recent metrics indicate strong response accuracy and rapid execution speeds. The DDA engine has adjusted parameters upward to maintain your flow zone.";
          } else {
            reason = "A rise in latency or error rate has been detected. The DDA engine has scaled back active difficulty parameters to allow you to restabilize focus and prevent cognitive fatigue.";
          }
        }
        
        // 2. Specific gameplay parameters
        const trackedKeys = [
          'grid_size', 'speed_multiplier', 'target_count', 'has_distractors', 
          'sequence_length', 'spawn_interval_ms', 'time_limit_ms', 'delay_ms',
          'card_count', 'grid_rows', 'grid_cols', 'max_path_length', 'ideal_steps'
        ];
        
        trackedKeys.forEach(key => {
          if (curr[key] !== undefined && prev[key] !== undefined && curr[key] !== prev[key]) {
            const cleanKey = key.replace(/_/g, ' ');
            changes.push(`${cleanKey} tuned to ${curr[key]}`);
          }
        });
        
        if (changes.length > 0) {
          const newLog = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            changes: changes,
            reason: reason || "Engine adjusted real-time parameters dynamically to balance task difficulty with your current cognitive flow profile."
          };
          
          setDdaAdvisorLogs(prevLogs => [newLog, ...prevLogs].slice(0, 10));
          setDdaAdvisorMessage(newLog);
          
          // Auto clear notification after 6 seconds
          const timerId = setTimeout(() => {
            setDdaAdvisorMessage(current => current && current.id === newLog.id ? null : current);
          }, 6000);
          
          return () => clearTimeout(timerId);
        }
      }
      prevDdaParamsRef.current = liveDdaParams;
    } else {
      prevDdaParamsRef.current = null;
    }
  }, [liveDdaParams, setDdaAdvisorLogs, setDdaAdvisorMessage]);
}
