import os
import re

filepath = r'd:\cognicore-workspace\client\App.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace radarDataEnhanced
content = re.sub(
    r'const baselineValues = ARCHETYPE_BASELINES\[cognitiveProfile\?\.archetype\] \|\| ARCHETYPE_BASELINES\[\'Initializing\.\.\.\'\];\n\s+const radarDataEnhanced = \{[\s\S]*?\}\n\s+\]\n\s+\};\n',
    r'''const radarDataEnhanced = useMemo(() => {
    const baselineValues = ARCHETYPE_BASELINES[cognitiveProfile?.archetype] || ARCHETYPE_BASELINES['Initializing...'];
    return {
      labels: ['Spatial-Visual Memory','Logical-Mathematical','Reflexes & Focus','Executive Strategy'],
      datasets: [
        {
          label: 'Your Profile',
          data: [skills.spatial_visual_memory, skills.logical_mathematical, skills.reflexes_and_focus, skills.executive_strategy],
          backgroundColor: 'rgba(var(--rgb-secondary),0.2)',
          borderColor: 'var(--color-secondary)', borderWidth: 2.5,
          pointBackgroundColor: 'var(--color-primary)', pointBorderColor: '#ffffff',
          pointRadius: 5, pointHoverRadius: 7, order: 1
        },
        {
          label: ${cognitiveProfile?.archetype || 'Archetype'} Baseline,
          data: baselineValues,
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.22)', borderWidth: 1.5,
          borderDash: [5, 4],
          pointBackgroundColor: 'rgba(255,255,255,0.25)', pointBorderColor: 'transparent',
          pointRadius: 3, order: 2
        }
      ]
    };
  }, [cognitiveProfile, skills]);
''',
    content
)

# Fix scatterData
content = re.sub(
    r'const scatterData = \{\n\s+datasets: \[\n\s+\{\n\s+label: \'Speed vs Accuracy\',\n\s+data: latestSessionMetrics\.map\([\s\S]*?\}\n\s+\]\n\s+\};\n',
    r'''const scatterData = useMemo(() => ({
    datasets: [
      {
        label: 'Speed vs Accuracy',
        data: latestSessionMetrics.map(m => ({ x: m.reaction_time, y: m.accuracy_rate, diff: m.difficulty_level })),
        backgroundColor: (context) => {
          const val = context.raw?.diff || 1;
          if(val >= 4) return 'rgba(239, 68, 68, 0.7)';
          if(val >= 2.5) return 'rgba(245, 158, 11, 0.7)';
          return 'rgba(16, 185, 129, 0.7)';
        },
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  }), [latestSessionMetrics]);
''',
    content
)

# Fix lineChartData
content = re.sub(
    r'const lineChartData = \{\n\s+labels: latestSessionMetrics\.map\([\s\S]*?\}\n\s+\]\n\s+\};\n',
    r'''const lineChartData = useMemo(() => ({
    labels: latestSessionMetrics.map((_, index) => R),
    datasets: [
      {
        label: 'Reaction Time (ms)',
        data: latestSessionMetrics.map(m => m.reaction_time),
        borderColor: 'var(--color-primary)',
        backgroundColor: 'rgba(var(--rgb-primary), 0.1)',
        tension: 0.4,
        yAxisID: 'y',
        fill: true,
      },
      {
        label: 'Accuracy (%)',
        data: latestSessionMetrics.map(m => m.accuracy_rate),
        borderColor: 'var(--color-secondary)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  }), [latestSessionMetrics]);
''',
    content
)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
