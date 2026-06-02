import React, { useState, useEffect, useRef } from 'react';

const COLORS = {
  Green: '#6BDBB2',
  Blue: '#7EA4FF',
  Red: '#FF7E7E',
  Pharma: '#7EA4FF',
  Plum: '#D884FF',
  Amber: '#FFB84D',
  Dark: '#1A1A1A',
  YellowPanel: '#FFD56B',
  BgCream: '#FDF5ED',
  White: '#FFFFFF',
  Gray: '#F4F4F5'
};

const CATEGORIES = [
  { id: 'Infectious', name: 'Infectious', color: COLORS.Red, hazard: 'extreme', desc: 'Biohazard materials' },
  { id: 'Sharps/Needles', name: 'Sharps', color: COLORS.Green, hazard: 'high', desc: 'Puncture hazards' },
  { id: 'Pharmaceutical', name: 'Pharmaceutical', color: COLORS.Pharma, hazard: 'medium', desc: 'Expired meds' },
  { id: 'Pathological', name: 'Pathological', color: COLORS.Plum, hazard: 'extreme', desc: 'Tissue samples' },
  { id: 'Radioactive', name: 'Radioactive', color: COLORS.Amber, hazard: 'extreme', desc: 'Isotopes' },
  { id: 'Chemical/Hazardous', name: 'Chemical', color: '#FFA500', hazard: 'extreme', desc: 'Corrosive reagents' },
  { id: 'General/Non-hazardous', name: 'General', color: '#66C2FF', hazard: 'low', desc: 'Standard waste' },
  { id: 'Mixed/Hybrid', name: 'Mixed/Hybrid', color: '#D97706', hazard: 'high', desc: 'Mixed medical waste' }
];

const BIN_LIMITS = {
  Infectious: { weight: 5.0, volume: 10.0 },
  'Sharps/Needles': { weight: 2.0, volume: 4.0 },
  Pharmaceutical: { weight: 4.0, volume: 8.0 },
  Pathological: { weight: 3.0, volume: 6.0 },
  Radioactive: { weight: 10.0, volume: 5.0 },
  'Chemical/Hazardous': { weight: 6.0, volume: 8.0 },
  'General/Non-hazardous': { weight: 8.0, volume: 12.0 },
  'Mixed/Hybrid': { weight: 4.0, volume: 8.0 }
};

const SAMPLES = [
  { name: 'Used Syringe', cat: 'Sharps/Needles', icon: '💉' },
  { name: 'Blood Gauze', cat: 'Infectious', icon: '🩸' },
  { name: 'Expired Aspirin', cat: 'Pharmaceutical', icon: '💊' },
  { name: 'Hydrochloric Acid', cat: 'Chemical/Hazardous', icon: '🧪' },
  { name: 'Skeletal Remains', cat: 'Pathological', icon: '🦴' },
  { name: 'Cobalt-60', cat: 'Radioactive', icon: '☢️' },
  { name: 'Paper Towel', cat: 'General/Non-hazardous', icon: '📄' },
  { name: 'Contaminated Mixed Sharps', cat: 'Mixed/Hybrid', icon: '🩹' }
];

const CLASSIFY_PROMPT = `You are MediSort, an AI medical waste classification system.
Analyze the uploaded image of a biomedical waste specimen.
Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "specimenName": "<short descriptive name of the object>",
  "category": "<one of: Sharps/Needles | Infectious | Pharmaceutical | Pathological | Radioactive | Chemical/Hazardous | General/Non-hazardous | Mixed/Hybrid>",
  "confidence": <number 0-100>,
  "disposalProtocol": "<one-line disposal instruction>",
  "hazardLevel": "<one of: EXTREME HAZARD | HIGH HAZARD | MODERATE HAZARD | LOW HAZARD>",
  "clinicalRationale": "<1-2 sentence visual reasoning for the classification>"
}

CRITICAL SAFETY ROUTING RULES:
1. Acids, corrosives, chemical reagents, and chemical wash bottles (e.g. Hydrochloric Acid, HCl, Formaldehyde) MUST be classified as 'Chemical/Hazardous'. NEVER put them in 'Pharmaceutical' or 'General/Non-hazardous'.
2. Human or animal skeletal remains, fossil bones, teeth, and tissue biopsy samples MUST be classified as 'Pathological'. NEVER classify bone material as 'General/Non-hazardous'.
3. Puncture threats (needles, lancets, glass, syringes) MUST be categorized as 'Sharps/Needles'.
4. HYBRID / MIXED WASTE RULE: If a specimen exhibits traits of multiple categories (e.g. a syringe needle contaminated with blood or wrapped in blood gauze, or chemical waste stored in pathological tissue tubes), classify it as 'Mixed/Hybrid'. Do NOT force single-label classification on mixed hazard specimens. Explain the combination of waste types in the clinicalRationale.`;

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Poppins:wght@400;500;600;700;800&display=swap');

* { box-sizing: border-box; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #D0D0D0; border-radius: 4px; }

body, html {
  margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden;
  background-color: ${COLORS.BgCream}; font-family: 'Poppins', sans-serif; color: ${COLORS.Dark};
}

.app-layout {
  display: flex; width: 100vw; height: 100vh; padding: 24px; gap: 24px;
}

/* Sidebar */
.sidebar {
  width: 260px;
  min-width: 260px;
  flex-shrink: 0;
  background: ${COLORS.Dark}; 
  border-radius: 32px; 
  display: flex; 
  flex-direction: column; 
  padding: 56px 16px; 
  gap: 6px;
}
.side-item {
  width: 100%; 
  height: 52px; 
  border-radius: 16px; 
  display: flex; 
  align-items: center; 
  padding: 0 24px;
  cursor: pointer; 
  transition: background 0.05s ease, color 0.1s ease, box-shadow 0.1s ease;
  color: #A1A1AA;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  white-space: nowrap;
  background: transparent;
  border: none;
  font-family: inherit;
  outline: none;
  text-align: left;
}
.side-item.active { 
  background: ${COLORS.YellowPanel}; 
  color: ${COLORS.Dark}; 
  box-shadow: 0 4px 12px rgba(255, 213, 107, 0.2);
}
.side-item:hover:not(.active) { background: #222; color: #FFF; }

/* Main Container */
.main-viewport {
  flex-grow: 1; background: ${COLORS.White}; border-radius: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); display: flex; flex-direction: column; overflow: hidden; position: relative;
}

.view-header {
  height: 80px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid ${COLORS.Gray};
}

.view-content {
  flex-grow: 1; display: flex; min-height: 0; overflow-x: auto;
}

/* Views Styles */
.panel-left {
  flex: 0 0 280px;
  width: 280px;
  padding: 20px;
  border-right: 2px solid ${COLORS.Gray};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}
.panel-right {
  flex: 0 0 250px;
  width: 250px;
  background: ${COLORS.YellowPanel};
  padding: 20px;
  border-top-left-radius: 32px;
  border-bottom-left-radius: 32px;
  margin: 16px 16px 16px 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100% - 32px);
}
.panel-center {
  flex: 1 1 320px;
  min-width: 320px;
  position: relative;
  background: #FAFAFA;
  overflow: hidden;
  height: 100%;
}

/* Robot Control Panel */
.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 24px;
  padding: 40px;
  overflow-y: auto;
  height: 100%;
  width: 100%;
}
.control-card { background: #FAFAFA; border-radius: 24px; padding: 24px; border: 2px solid ${COLORS.Gray}; display: flex; flex-direction: column; gap: 16px; }
.slider-group { display: flex; flex-direction: column; gap: 8px; }
input[type=range] { width: 100%; cursor: pointer; accent-color: ${COLORS.Dark}; }

/* Analytics View */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  padding: 24px 40px;
  flex-shrink: 0;
}
.stat-card {
  background: ${COLORS.Gray};
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.chart-container {
  flex-grow: 1;
  padding: 20px 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.bar-chart {
  flex: 1 1 340px;
  min-width: 320px;
  background: #FAFAFA;
  border-radius: 24px;
  border: 2px solid ${COLORS.Gray};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bar-row { display: flex; align-items: center; gap: 12px; height: 24px; }
.bar-fill { height: 100%; border-radius: 6px; transition: width 1s ease-out; }

/* Real Time Classification Output */
.result-box {
  background: ${COLORS.White}; border-radius: 24px; border: 2px solid ${COLORS.Gray}; padding: 24px; margin-top: auto;
  box-shadow: 0 10px 20px rgba(0,0,0,0.03); animation: slideUp 0.3s ease-out; flex-shrink: 0; cursor: pointer; transition: all 0.2s ease;
}
.result-box:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: #DDD; }
.hazard-badge {
  padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1.5px solid;
}

@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.upload-zone {
  border: 2px dashed #D0D0D0; border-radius: 16px; background: ${COLORS.Gray}; height: 140px; min-height: 140px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; overflow: hidden;
}
.btn-primary {
  width: 100%; padding: 14px; background: ${COLORS.YellowPanel}; color: ${COLORS.Dark}; border-radius: 24px; font-weight: 700; cursor: pointer; border: none; font-size: 14px; box-shadow: 0 4px 12px rgba(255, 213, 107, 0.4); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.btn-primary:hover { transform: translateY(-2px); }
.sample-btn {
  background: ${COLORS.White}; border: 2px solid #EAEAEA; padding: 8px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; min-width: 0;
}

.bin-card {
  min-height: 80px; padding: 16px; background: ${COLORS.White}; border-radius: 16px; position: relative; display: flex; align-items: center; gap: 16px; border: 2px solid transparent; box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.bin-fill { position: absolute; left: 0; bottom: 0; width: 6px; border-top-right-radius: 6px; transition: height 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

/* Custom loading spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-top: 2px solid ${COLORS.Dark};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Toast System Styling */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
  pointer-events: none;
}
.toast {
  background: ${COLORS.Dark};
  color: ${COLORS.White};
  padding: 14px 24px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 10px;
  animation: toastSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: auto;
}
@keyframes toastSlideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scanMove {
  0% { top: 0%; }
  50% { top: 100%; }
  100% { top: 0%; }
}

@media (max-width: 1024px) {
  body, html {
    overflow: auto;
  }

  .app-layout {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    padding: 12px;
    gap: 12px;
  }

  .sidebar {
    width: 100%;
    min-width: 0;
    border-radius: 24px;
    padding: 20px 16px;
  }

  .sidebar nav {
    flex-direction: row !important;
    overflow-x: auto;
    padding-bottom: 4px;
    gap: 8px !important;
    scrollbar-width: none;
  }

  .sidebar nav::-webkit-scrollbar {
    display: none;
  }

  .side-item {
    flex: 0 0 auto;
    height: 44px;
    padding: 0 18px;
    font-size: 12px;
  }

  .main-viewport {
    min-height: 0;
    border-radius: 24px;
  }

  .view-header {
    height: auto;
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .view-header > div {
    width: 100%;
    flex-wrap: wrap;
  }

  .view-content {
    flex-direction: column;
    overflow-x: hidden;
  }

  .panel-left,
  .panel-right,
  .panel-center {
    width: 100%;
    min-width: 0;
    height: auto;
    margin: 0;
    border-radius: 0;
  }

  .panel-left {
    border-right: none;
    border-bottom: 2px solid ${COLORS.Gray};
    padding: 16px;
  }

  .panel-center {
    min-height: 360px;
    border-bottom: 2px solid ${COLORS.Gray};
  }

  .panel-right {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-top: none;
    padding: 16px;
    height: auto;
  }

  .control-grid {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
    height: auto;
    overflow-y: visible;
  }

  .stats-row {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .chart-container {
    padding: 16px;
  }

  .bar-chart {
    min-width: 0;
    flex-basis: 100%;
  }

  .bar-row {
    gap: 8px;
  }

  .bar-row > div:first-child {
    width: 96px;
  }

  .bar-row > div:nth-child(2) {
    min-width: 0;
  }

  .bar-row > div:last-child {
    width: 32px;
  }

  table {
    min-width: 640px;
  }

  .api-key-modal,
  .full-result-modal,
  .confirm-modal {
    padding: 16px !important;
  }

  .api-key-modal > div,
  .full-result-modal > div,
  .confirm-modal > div {
    max-width: 100% !important;
    padding: 20px !important;
    border-radius: 24px !important;
  }

  .full-result-modal > div {
    gap: 20px !important;
  }

  .full-result-modal > div > div:first-child {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .full-result-modal > div > div:nth-child(2) {
    grid-template-columns: 1fr !important;
  }
}

`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const getConfidenceColor = (conf) => {
  const val = conf <= 1 ? conf * 100 : conf;
  if (val >= 85) return '#6BDBB2'; // Green
  if (val >= 50) return '#FFB84D'; // Amber
  return '#FF7E7E'; // Red
};

export default function MediSort() {
  const [view, setView] = useState('dashboard');
  const [phase, setPhase] = useState('idle');
  const [phaseLabel, setPhaseLabel] = useState('IDLE');
  const [elapsed, setElapsed] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [binCounts, setBinCounts] = useState([0,0,0,0,0,0,0,0]);
  const [binWeights, setBinWeights] = useState([0,0,0,0,0,0,0,0]);
  const [binVolumes, setBinVolumes] = useState([0,0,0,0,0,0,0,0]);
  const [simulationMode, setSimulationMode] = useState('conveyor'); // 'conveyor' | 'locomotion'
  
  // Advanced features state
  const [userRole, setUserRole] = useState('operator'); // 'operator' | 'supervisor'
  const [autoSortMinConfidence, setAutoSortMinConfidence] = useState(90); // default 90%
  const [thermalTemp, setThermalTemp] = useState(42.0); // system temperature in degrees Celsius
  const [motorTorque, setMotorTorque] = useState(4.2); // motor torque in Nm
  const [modelCorrections, setModelCorrections] = useState([]); // active retraining loop data
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('all'); // 'all' | 'today' | 'week'
  const [historyTimeRange, setHistoryTimeRange] = useState('all'); // 'all' | 'today' | 'week'
  const [collisionWarning, setCollisionWarning] = useState(false);
  const [safetyBypass, setSafetyBypass] = useState(false); // supervisor safety lockout override
  const [thermalEStop, setThermalEStop] = useState(false);
  const [recentSorts, setRecentSorts] = useState([]); // timestamp list for throughput calculations
  
  const [armAngles, setArmAngles] = useState({ shoulder: -75, elbow: 100 });
  const [fingerGap, setFingerGap] = useState(18);
  const [wristAngle, setWristAngle] = useState(0);
  const [baseRotation, setBaseRotation] = useState(0);
  const [itemScale, setItemScale] = useState(0.3);
  const [itemOpacity, setItemOpacity] = useState(0);
  const [itemDrop, setItemDrop] = useState(false);
  const [targetBin, setTargetBin] = useState(0);
  const [heldItem, setHeldItem] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedPresetName, setSelectedPresetName] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isFullScreenResult, setIsFullScreenResult] = useState(false);
  const [autoCycle, setAutoCycle] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);
  const [overrideCount, setOverrideCount] = useState(0);
  
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY') || '');
  const busyRef = useRef(false);
  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Custom Toast State
  const [toasts, setToasts] = useState([]);
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  // History Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  // Thermal decay and active heating simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setThermalTemp(curr => {
        if (phase === 'idle') {
          return Math.max(42.0, +(curr - 0.2).toFixed(1));
        } else {
          return Math.min(80.0, +(curr + 0.4).toFixed(1)); // moves arms = heats up faster
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Thermal Emergency Stop (E-Stop) Check
  useEffect(() => {
    if (thermalTemp >= 75.0 && !thermalEStop) {
      setThermalEStop(true);
      setPhase('idle');
      setPhaseLabel('E-STOP: THERMAL CRITICAL');
      setAutoCycle(false);
      addToast("CRITICAL: Safety Interlock triggered. CPU/motor temperature exceeded 75°C. System Locked.", "error");
    }
  }, [thermalTemp, thermalEStop]);

  useEffect(() => {
    let active = true;
    const runAuto = async () => {
      if (autoCycle && phase === 'idle' && !busyRef.current) {
        // Wait 1.5 seconds before starting the next auto run
        await sleep(1500);
        if (!active || !autoCycle) return;

        if (thermalEStop) {
          setAutoCycle(false);
          return;
        }

        const sample = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
        const simulatedConfidence = +(0.60 + Math.random() * 0.39).toFixed(2);
        const threshold = autoSortMinConfidence / 100;

        if (simulatedConfidence < threshold) {
          // Interrupt autonomous cycle
          setAutoCycle(false);
          const logId = Date.now() + Math.random();
          const cat = CATEGORIES.find(c => c.id === sample.cat) || CATEGORIES[7];
          const safeBinIndex = CATEGORIES.findIndex(c => c.id === cat.id);
          
          const isLowConf = simulatedConfidence < 0.70;
          const statusLabel = isLowConf ? 'SUPERVISOR HOLD' : 'PENDING';

          const newLog = {
            id: logId,
            timestamp: Date.now(),
            time: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' }),
            name: sample.name,
            category: cat,
            confidence: simulatedConfidence,
            binIndex: safeBinIndex >= 0 ? safeBinIndex : 7,
            status: statusLabel,
            hazardLevel: cat.hazard.toUpperCase() + ' HAZARD',
            operatorId: 'AUTO-ROUTING-TIER'
          };

          setLogs(prev => [newLog, ...prev].slice(0, 50));
          setPendingResult({
            name: sample.name,
            category: cat,
            confidence: simulatedConfidence,
            action: 'Auto-sort classification',
            rationale: `Detected ${sample.name} automatically. Confidence (${(simulatedConfidence*100).toFixed(0)}%) is below auto-sort threshold (${autoSortMinConfidence}%). Flagged as ${statusLabel}.`,
            hazardLevel: cat.hazard.toUpperCase() + ' HAZARD',
            logId: logId,
            status: statusLabel
          });

          setPhase('idle');
          setPhaseLabel(isLowConf ? 'SUPERVISOR HOLD' : 'PENDING VERIFICATION');
          
          if (isLowConf) {
            addToast(`CRITICAL: Low confidence (${(simulatedConfidence*100).toFixed(0)}%) specimen. Placed on Supervisor Hold.`, 'error');
          } else {
            addToast(`Autonomous loop halted: confidence below threshold (${(simulatedConfidence*100).toFixed(0)}%).`, 'info');
          }
          return;
        }

        await runSequence({
          name: sample.name,
          category: sample.cat,
          confidence: simulatedConfidence,
          action: 'Auto-sort classification',
          rationale: `Detected ${sample.name} automatically with high confidence (${(simulatedConfidence*100).toFixed(0)}%).`,
          overrideStatus: 'VERIFIED',
          hazardLevel: CATEGORIES.find(c => c.id === sample.cat)?.hazard.toUpperCase() + ' HAZARD',
          operatorId: 'ROBOTIC-CORE'
        });
      }
    };

    runAuto();
    return () => { active = false; };
  }, [autoCycle, phase, autoSortMinConfidence, thermalEStop]);

  const handleLocomotionSort = (item) => {
    const binIndex = CATEGORIES.findIndex(c => c.id === item.category);
    const safeBinIndex = binIndex >= 0 ? binIndex : 7;
    const cat = CATEGORIES[safeBinIndex];
    
    const limits = BIN_LIMITS[cat.id];
    const currentItems = binCounts[safeBinIndex];
    const currentWeight = binWeights[safeBinIndex];
    const currentVolume = binVolumes[safeBinIndex];

    if (currentItems >= 10 || currentWeight >= limits.weight || currentVolume >= limits.volume) {
      addToast(`SAFETY LOCKOUT: The ${cat.name} bin is FULL (${currentItems}/10 items, ${currentWeight}/${limits.weight}kg, ${currentVolume}/${limits.volume}L). Please empty it first.`, 'error');
      return;
    }

    const itemWeight = +(0.1 + Math.random() * 0.4).toFixed(2);
    const itemVolume = +(0.2 + Math.random() * 0.6).toFixed(2);

    setBinCounts(prev => { const n = [...prev]; n[safeBinIndex]++; return n; });
    setBinWeights(prev => { const n = [...prev]; n[safeBinIndex] = +(n[safeBinIndex] + itemWeight).toFixed(2); return n; });
    setBinVolumes(prev => { const n = [...prev]; n[safeBinIndex] = +(n[safeBinIndex] + itemVolume).toFixed(2); return n; });
    setRecentSorts(prev => [...prev, Date.now()]);
    setThermalTemp(curr => Math.min(80.0, +(curr + 1.2).toFixed(1)));

    const activeOperator = userRole === 'operator' ? 'Tech-804' : 'Admin-12';
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      time: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' }),
      name: item.name,
      category: cat,
      confidence: 0.98,
      binIndex: safeBinIndex,
      status: 'VERIFIED',
      hazardLevel: cat.hazard.toUpperCase() + ' HAZARD',
      operatorId: activeOperator
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 50));
    addToast(`Mobile Robot picked up & sorted ${item.name} into ${cat.name} Bin!`, 'success');
  };

  useEffect(() => {
    const sendState = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'UPDATE_ROBOT_STATE',
          state: {
            phase,
            phaseLabel,
            elapsed,
            resultData,
            armAngles,
            fingerGap,
            wristAngle,
            baseRotation,
            itemScale,
            itemOpacity,
            itemDrop,
            targetBin,
            heldItem,
            binCounts,
            simulationMode,
            pendingResult,
            selectedPresetName
          }
        }, '*');
      }
    };

    sendState();

    const handleIframeMessage = (event) => {
      if (!event.data) return;
      if (event.data.type === 'REQUEST_INITIAL_STATE') {
        sendState();
      } else if (event.data.type === 'LOCOMOTION_SORT_COMPLETE') {
        handleLocomotionSort(event.data.item);
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [phase, phaseLabel, elapsed, resultData, armAngles, fingerGap, wristAngle, baseRotation, itemScale, itemOpacity, itemDrop, targetBin, heldItem, binCounts, binWeights, binVolumes, userRole, simulationMode]);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
    return () => { document.head.removeChild(styleTag); };
  }, []);

  useEffect(() => {
    let interval;
    if (phase !== 'idle' && phase !== 'done') {
      interval = setInterval(() => setElapsed(e => e + 10), 10);
    } else if (phase === 'idle') {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const runSequence = async (result, skipDetecting = false, internal = false) => {
    if (thermalEStop) {
      addToast("CRITICAL SAFETY LOCKOUT: Thermal E-Stop active. Cool the system first.", "error");
      return;
    }
    if (!internal && busyRef.current) return;
    busyRef.current = true;
    
    try {
      const binIndex = CATEGORIES.findIndex(c => c.id === result.category);
      const safeBinIndex = binIndex >= 0 ? binIndex : 7;
      const cat = CATEGORIES[safeBinIndex];
      
      const limits = BIN_LIMITS[cat.id];
      const currentItems = binCounts[safeBinIndex];
      const currentWeight = binWeights[safeBinIndex];
      const currentVolume = binVolumes[safeBinIndex];

      if (currentItems >= 10 || currentWeight >= limits.weight || currentVolume >= limits.volume) {
        addToast(`SAFETY LOCKOUT: The ${cat.name} bin is FULL (${currentItems}/10 items, ${currentWeight}/${limits.weight}kg, ${currentVolume}/${limits.volume}L). Please empty it first.`, 'error');
        busyRef.current = false;
        return;
      }

      setTargetBin(safeBinIndex);
      setHeldItem({ ...cat, emoji: SAMPLES.find(s => s.name === result.name)?.icon || '📦' });

      if (!skipDetecting) {
        setPhase('detecting');
        setPhaseLabel('DETECTING...');
        setBaseRotation(-45);
        setWristAngle(0);
        await sleep(1500);
      }
      
      setResultData({ ...result, category: cat });
      setPhase('picking'); setPhaseLabel('PICKING...');
      setArmAngles({ shoulder: -130, elbow: -100 });
      setBaseRotation(-45);
      setWristAngle(-30);
      await sleep(700);
      
      setFingerGap(4); setItemOpacity(1); setItemScale(1); setItemDrop(false);
      await sleep(500);
      
      setPhase('transporting'); setPhaseLabel('TRANSPORTING...');
      const targetAngles = [
        { shoulder: -60, elbow: 30 }, // Infectious
        { shoulder: -48, elbow: 35 }, // Sharps
        { shoulder: -36, elbow: 40 }, // Pharmaceutical
        { shoulder: -24, elbow: 45 }, // Pathological
        { shoulder: -12, elbow: 50 }, // Radioactive
        { shoulder: 0, elbow: 55 },   // Chemical/Hazardous
        { shoulder: 15, elbow: 60 },  // General
        { shoulder: 28, elbow: 65 }   // Mixed/Hybrid
      ];
      setArmAngles(targetAngles[safeBinIndex]);
      setBaseRotation(45);
      setWristAngle(0);
      await sleep(800);
      
      setPhase('dropping'); setPhaseLabel('DROPPING...');
      setFingerGap(18); setWristAngle(30); setItemDrop(true); setItemOpacity(0);
      await sleep(400);

      const itemWeight = +(0.1 + Math.random() * 0.4).toFixed(2);
      const itemVolume = +(0.2 + Math.random() * 0.6).toFixed(2);

      setBinCounts(prev => { const n = [...prev]; n[safeBinIndex]++; return n; });
      setBinWeights(prev => { const n = [...prev]; n[safeBinIndex] = +(n[safeBinIndex] + itemWeight).toFixed(2); return n; });
      setBinVolumes(prev => { const n = [...prev]; n[safeBinIndex] = +(n[safeBinIndex] + itemVolume).toFixed(2); return n; });
      setRecentSorts(prev => [...prev, Date.now()]);
      setThermalTemp(curr => Math.min(80.0, +(curr + 1.5).toFixed(1)));

      const newItems = currentItems + 1;
      const newWeight = currentWeight + itemWeight;
      const newVolume = currentVolume + itemVolume;
      const weightPercent = newWeight / limits.weight;
      const volumePercent = newVolume / limits.volume;

      if (newItems >= 10 || weightPercent >= 1.0 || volumePercent >= 1.0) {
        addToast(`CRITICAL: The ${cat.name} bin is now FULL (Locked).`, 'error');
      } else if (newItems >= 8 || weightPercent >= 0.8 || volumePercent >= 0.8) {
        addToast(`WARNING: The ${cat.name} bin is nearing capacity (>=80%).`, 'info');
      }
      
      const activeOperator = userRole === 'operator' ? 'Tech-804' : 'Admin-12';

      if (result.logId) {
        setLogs(prev => prev.map(log => {
          if (log.id === result.logId) {
            return {
              ...log,
              category: cat,
              binIndex: safeBinIndex,
              status: result.overrideStatus || 'VERIFIED',
              operatorId: activeOperator
            };
          }
          return log;
        }));
      } else {
        const newLog = {
          id: Date.now() + Math.random(),
          timestamp: Date.now(),
          time: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' }),
          name: result.name,
          category: cat,
          confidence: result.confidence,
          binIndex: safeBinIndex,
          status: result.overrideStatus || 'VERIFIED',
          hazardLevel: result.hazardLevel || (cat.hazard.toUpperCase() + ' HAZARD'),
          operatorId: activeOperator
        };
        setLogs(prev => [newLog, ...prev].slice(0, 50));
      }
      addToast(`Successfully sorted ${result.name} into ${cat.name} Bin!`, 'success');
      
      setPhase('returning'); setPhaseLabel('RETURNING...');
      setArmAngles({ shoulder: -75, elbow: 100 });
      setBaseRotation(0);
      setWristAngle(0);
      await sleep(700);
      
      setPhase('done'); setPhaseLabel('DONE');
      await sleep(500);
      setPhase('idle'); setPhaseLabel('IDLE');
    } catch (e) {
      console.error("Sorting simulation failed:", e);
    } finally {
      busyRef.current = false;
    }
  };

const PRESET_MOCKS = {
  'Used Syringe': {
    specimenName: 'Used Syringe',
    category: 'Sharps/Needles',
    confidence: 98,
    disposalProtocol: 'Dispose of in puncture-resistant sharps container.',
    hazardLevel: 'HIGH HAZARD',
    clinicalRationale: 'Visual identification of steel needle and plastic syringe plunger.'
  },
  'Blood Gauze': {
    specimenName: 'Blood Gauze',
    category: 'Infectious',
    confidence: 96,
    disposalProtocol: 'Place in red biohazard bag for incineration.',
    hazardLevel: 'EXTREME HAZARD',
    clinicalRationale: 'Fibrous gauze heavily saturated with human biological fluids.'
  },
  'Expired Aspirin': {
    specimenName: 'Expired Aspirin',
    category: 'Pharmaceutical',
    confidence: 94,
    disposalProtocol: 'Store in secure pharmaceutical waste bin for chemical disposal.',
    hazardLevel: 'MODERATE HAZARD',
    clinicalRationale: 'Blister pack detailing pharmaceutical identification code.'
  },
  'Hydrochloric Acid': {
    specimenName: 'Hydrochloric Acid',
    category: 'Chemical/Hazardous',
    confidence: 99,
    disposalProtocol: 'Store in safety container inside corrosive cabinet. Do NOT mix with organics.',
    hazardLevel: 'EXTREME HAZARD',
    clinicalRationale: 'Highly corrosive strong acid posing high chemical reaction and skin contact hazard.'
  },
  'Skeletal Remains': {
    specimenName: 'Skeletal Remains',
    category: 'Pathological',
    confidence: 97,
    disposalProtocol: 'Place in pathological bag for regulatory cremation and incineration.',
    hazardLevel: 'EXTREME HAZARD',
    clinicalRationale: 'Fossilized human or animal osteological bone structures.'
  },
  'Cobalt-60': {
    specimenName: 'Cobalt-60',
    category: 'Radioactive',
    confidence: 99,
    disposalProtocol: 'Lead shield and transfer immediately to radioactive isotope locker.',
    hazardLevel: 'EXTREME HAZARD',
    clinicalRationale: 'Steel capsule containing industrial radioactive isotope markers.'
  },
  'Paper Towel': {
    specimenName: 'Paper Towel',
    category: 'General/Non-hazardous',
    confidence: 95,
    disposalProtocol: 'Dispose in general refuse container for standard landfill.',
    hazardLevel: 'LOW HAZARD',
    clinicalRationale: 'Standard paper fiber towel with no visible biological or chemical fluid stains.'
  },
  'Contaminated Mixed Sharps': {
    specimenName: 'Contaminated Mixed Sharps',
    category: 'Mixed/Hybrid',
    confidence: 96,
    disposalProtocol: 'Place in designated Mixed Biohazard/Sharps container for autoclaving.',
    hazardLevel: 'HIGH HAZARD',
    clinicalRationale: 'Contains both used syringe needle (puncture hazard) and biological fluid blood gauze (infectious hazard) in one mixed object.'
  }
};

  const handleClassify = async () => {
    if (busyRef.current) return;
    if (!imagePreview) {
      addToast("Please upload a specimen image first!", "error");
      return;
    }

    const storedKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY');
    
    // Allow preset bypass even if key is missing
    const isPreset = imagePreview.startsWith('data:image/svg+xml');
    if (!storedKey && !isPreset) {
      setShowKeyModal(true);
      return;
    }

    busyRef.current = true;
    setPhase('detecting'); setPhaseLabel('AI ANALYSIS (GEMINI)...');
    setPendingResult(null);

    try {
      let parsed;

      if (isPreset && PRESET_MOCKS[selectedPresetName]) {
        // Preset mock simulation delay
        await sleep(1000);
        parsed = PRESET_MOCKS[selectedPresetName];
      } else {
        const base64Data = imagePreview.includes(',') ? imagePreview.split(',')[1] : imagePreview;
        const mimeType = imagePreview.includes(';') ? imagePreview.split(';')[0].split(':')[1] : 'image/jpeg';
        
        const response = await fetch(`/api/gemini/v1beta/models/gemini-2.5-flash:generateContent?key=${storedKey}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': storedKey
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: CLASSIFY_PROMPT },
                { inline_data: { mime_type: mimeType, data: base64Data } }
              ]
            }],
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ],
            generationConfig: {
              response_mime_type: "application/json"
            }
          })
        });

        if (!response.ok) {
          const err = await response.json();
          if (response.status === 400 || response.status === 401) {
            localStorage.removeItem('GEMINI_API_KEY');
            setShowKeyModal(true);
          }
          throw new Error(err.error?.message || 'Gemini API failed');
        }

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('Blocked by AI limits: ' + JSON.stringify(data.promptFeedback || data));
        }
        if (!data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error('AI Response empty or blocked. Reason: ' + data.candidates[0].finishReason);
        }
        const text = data.candidates[0].content.parts[0].text;
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No JSON found in response");
        const jsonStr = match[0];
        parsed = JSON.parse(jsonStr);
      }
      
      const mapped = {
        name: parsed.specimenName || parsed.name || "Unknown Specimen",
        category: parsed.category,
        confidence: typeof parsed.confidence === 'number' ? (parsed.confidence > 1 ? parsed.confidence / 100 : parsed.confidence) : 0.95,
        action: parsed.disposalProtocol || parsed.action || "No specific protocol provided",
        rationale: parsed.clinicalRationale || parsed.rationale || "",
        hazardLevel: parsed.hazardLevel || "MODERATE HAZARD"
      };

      const cat = CATEGORIES.find(c => c.id === mapped.category) || CATEGORIES[6];

      busyRef.current = false;

      if (autoCycle) {
        // Auto Cycle mode: Run sequence automatically
        await runSequence({ ...mapped, category: cat.id, hazard: cat.hazard, rationale: mapped.rationale, hazardLevel: mapped.hazardLevel }, true, true);
      } else {
        // Manual mode: enter Pending Verification step
        const logId = Date.now() + Math.random();
        const safeBinIndex = CATEGORIES.findIndex(c => c.id === cat.id);
        const newLog = {
          id: logId,
          timestamp: Date.now(),
          time: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' }),
          name: mapped.name,
          category: cat,
          confidence: mapped.confidence,
          binIndex: safeBinIndex >= 0 ? safeBinIndex : 6,
          status: 'PENDING',
          hazardLevel: mapped.hazardLevel || (cat.hazard.toUpperCase() + ' HAZARD')
        };
        setLogs(prev => [newLog, ...prev].slice(0, 50));
        setPendingResult({ ...mapped, category: cat, logId: logId });
        setPhase('idle');
        setPhaseLabel('PENDING VERIFICATION');
        addToast("Specimen classified. Pending manual review.", "info");
      }
    } catch (e) {
      console.error(e);
      addToast("Classification Fail: " + e.message, "error"); 
      busyRef.current = false; 
      setPhase('idle');
      setPhaseLabel('IDLE');
    }
  };

  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('GEMINI_API_KEY', apiKeyInput.trim());
      setShowKeyModal(false);
      handleClassify();
    }
  };

  const handleToggleAuto = () => {
    if (!autoCycle) {
      triggerConfirm(
        "Enable Autonomous Sorting Mode",
        "WARNING: Operating a waste classification arm autonomously is a safety-critical action. Ensure the robot sorting deck is clear of obstacles. Enable Autonomous Sort Mode?",
        () => {
          setPendingResult(null);
          setAutoCycle(true);
          addToast("Autonomous sorting enabled.", "info");
        }
      );
    } else {
      setAutoCycle(false);
      addToast("Autonomous sorting disabled.", "info");
    }
  };

  const handleOverrideLogCategory = (logId, newCategoryId) => {
    const newCategory = CATEGORIES.find(c => c.id === newCategoryId);
    if (!newCategory) return;
    
    const targetLog = logs.find(log => log.id === logId);
    if (!targetLog) return;
    const oldCategory = targetLog.category;
    if (oldCategory.id === newCategoryId) return;
    
    const oldIndex = CATEGORIES.findIndex(c => c.id === oldCategory.id);
    const newIndex = CATEGORIES.findIndex(c => c.id === newCategoryId);
    
    setBinCounts(prevCounts => {
      const next = [...prevCounts];
      if (oldIndex >= 0 && next[oldIndex] > 0) next[oldIndex]--;
      if (newIndex >= 0) next[newIndex]++;
      return next;
    });
    
    setOverrideCount(prev => prev + 1);

    setModelCorrections(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        specimenName: targetLog.name,
        confidence: targetLog.confidence,
        originalCategory: oldCategory.id,
        correctedCategory: newCategory.id,
        operator: userRole === 'operator' ? 'Tech-804' : 'Admin-12'
      }
    ]);
    
    setLogs(prevLogs => {
      return prevLogs.map(log => {
        if (log.id === logId) {
          return {
            ...log,
            category: newCategory,
            status: 'OVERRIDDEN'
          };
        }
        return log;
      });
    });

    addToast(`Reassigned specimen to ${newCategory.name} Waste Bin.`, 'info');
  };

  const renderDashboard = () => (
    <>
      <form onSubmit={e => e.preventDefault()} className="panel-left">
        {simulationMode === 'locomotion' && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1.5px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '20px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            margin: '4px 0',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '16px', marginTop: '-2px' }}>🚚</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#1d4ed8' }}>Mobile Corridor Mode Active</div>
              <div style={{ fontSize: '9px', color: '#1e3a8a', marginTop: '2px', lineHeight: 1.4 }}>
                The robot is autonomously patrolling the hospital corridor. Manual specimen classification and conveyor presets are locked.
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          <input
            ref={fileInputRef}
            id="specimen-file-input"
            name="specimen-file"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            aria-label="Upload specimen image"
            onChange={e => {
              const f = e.target.files[0];
              if (f) {
                setSelectedPresetName(null);
                const r = new FileReader();
                r.onload = (e) => setImagePreview(e.target.result);
                r.readAsDataURL(f);
              }
            }}
          />
          <div
            className={`upload-zone ${dragOver ? 'dragover' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Upload zone. Click or drag and drop a specimen image here."
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onClick={() => {
              if (simulationMode !== 'locomotion') {
                fileInputRef.current?.click();
              }
            }}
            onDragOver={e => { e.preventDefault(); if (simulationMode !== 'locomotion') setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              if (simulationMode !== 'locomotion') {
                const f = e.dataTransfer.files[0];
                if (f) {
                  setSelectedPresetName(null);
                  const r = new FileReader();
                  r.onload = (e) => setImagePreview(e.target.result);
                  r.readAsDataURL(f);
                }
              }
            }}
          >
            {imagePreview ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <img
                  src={imagePreview}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt={selectedPresetName ? `${selectedPresetName} preview` : "Uploaded specimen preview"}
                />
                <button 
                  type="button"
                  disabled={simulationMode === 'locomotion'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImagePreview(null);
                    setSelectedPresetName(null);
                    setPendingResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }} 
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#FFF', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: simulationMode === 'locomotion' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}
                  aria-label="Clear uploaded image"
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px', opacity: simulationMode === 'locomotion' ? 0.4 : 1 }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📤</div>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>Drop or click to upload specimen image</div>
              </div>
            )}
          </div>
          {selectedPresetName && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: COLORS.Gray, borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
              <span>Specimen Loaded: <span style={{ color: COLORS.Dark }}>{selectedPresetName}</span></span>
              <span style={{ color: '#5E5E5E' }}>Preset Test Mode</span>
            </div>
          )}
        </div>

        <button type="button" className="btn-primary" onClick={handleClassify} disabled={phase !== 'idle' || autoCycle || simulationMode === 'locomotion'} style={{ opacity: (phase !== 'idle' || autoCycle || simulationMode === 'locomotion') ? 0.6 : 1, cursor: (phase !== 'idle' || autoCycle || simulationMode === 'locomotion') ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
          {phase === 'detecting' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner" /> ANALYZING SPECIMEN...
            </span>
          ) : 'CLASSIFY SPECIMEN →'}
        </button>
        
        {/* Autonomous Run Mode Switch with Safety Confirmation */}
        <div style={{ 
          background: autoCycle ? 'rgba(255, 213, 107, 0.12)' : COLORS.Gray, 
          border: `2px solid ${autoCycle ? COLORS.YellowPanel : '#EAEAEA'}`,
          borderRadius: '20px', 
          padding: '12px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '12px',
          transition: 'all 0.3s',
          margin: '4px 0',
          flexShrink: 0,
          opacity: simulationMode === 'locomotion' ? 0.5 : 1
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800' }}>Autonomous Sorting</div>
            <div style={{ fontSize: '10px', color: '#5E5E5E', marginTop: '2px' }}>Continuous cycle simulation</div>
          </div>
          <button 
            type="button"
            onClick={handleToggleAuto}
            disabled={phase !== 'idle' || simulationMode === 'locomotion'}
            role="switch"
            aria-checked={autoCycle}
            aria-label="Autonomous sorting mode"
            style={{
              width: '52px',
              height: '28px',
              borderRadius: '14px',
              background: autoCycle ? COLORS.Dark : '#CBD5E1',
              border: 'none',
              cursor: (phase === 'idle' && simulationMode !== 'locomotion') ? 'pointer' : 'not-allowed',
              opacity: (phase === 'idle' && simulationMode !== 'locomotion') ? 1 : 0.5,
              position: 'relative',
              transition: 'all 0.3s',
              padding: '2px'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: autoCycle ? COLORS.YellowPanel : '#FFF',
              position: 'absolute',
              top: '2px',
              left: autoCycle ? '26px' : '2px',
              transition: 'all 0.3s'
            }} />
          </button>
        </div>        <div style={{ 
          background: COLORS.Gray, 
          border: '1.5px solid #EAEAEA',
          borderRadius: '20px', 
          padding: '12px 16px', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '6px',
          margin: '4px 0',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="auto-sort-threshold" style={{ fontSize: '12px', fontWeight: '800' }}>Auto-Sort Threshold</label>
            <span style={{ fontSize: '12px', fontWeight: '800', color: COLORS.Dark }}>{autoSortMinConfidence}%</span>
          </div>
          <input 
            id="auto-sort-threshold"
            type="range" 
            min="50" 
            max="100" 
            step="5" 
            value={autoSortMinConfidence} 
            onChange={(e) => setAutoSortMinConfidence(parseInt(e.target.value))} 
            aria-label="Autonomous sorting confidence threshold percentage"
            style={{ accentColor: COLORS.Dark }}
          />
          <div style={{ fontSize: '9px', color: '#888', fontWeight: '600' }}>
            Hold items below {autoSortMinConfidence}% for review.
          </div>
        </div>

        {/* HUMAN-IN-THE-LOOP PENDING VERIFICATION CARD OR PREVIOUSLY VERIFIED RESULT DISPLAY */}
        <div style={{ flexShrink: 0 }}>
          {pendingResult ? (
            <div className="result-box" style={{ margin: 0, borderLeft: `8px solid ${pendingResult.category.color}`, borderTop: '2px solid #FFE8B3', borderRight: '2px solid #FFE8B3', borderBottom: '2px solid #FFE8B3', background: '#FFF9E6', animation: 'slideUp 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', letterSpacing: '0.8px' }}>⚠️ PENDING HUMAN REVIEW</span>
                <div className="hazard-badge" style={{ color: pendingResult.category.color, borderColor: pendingResult.category.color, background: '#FFF' }}>
                  {pendingResult.hazardLevel}
                </div>
              </div>
              
              <div style={{ marginTop: '12px', fontSize: '18px', fontWeight: '800', color: COLORS.Dark }}>{pendingResult.name}</div>
              
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700' }}>AI CLASSIFICATION</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: pendingResult.category.color }}>
                  {pendingResult.category.name} ({(pendingResult.confidence * 100).toFixed(0)}%)
                </div>
              </div>

              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${pendingResult.confidence * 100}%`, height: '100%', background: getConfidenceColor(pendingResult.confidence) }} />
              </div>

              {/* Verification Dropdown Override */}
              <div style={{ marginTop: '16px', background: '#FFF', padding: '12px', borderRadius: '12px', border: '1.5px solid #EAEAEA' }}>
                <label htmlFor="pending-bin-select" style={{ fontSize: '10px', fontWeight: '800', color: '#5E5E5E', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Verify / Correct Destination Bin</label>
                <select 
                  id="pending-bin-select"
                  aria-label="Verify / Correct Destination Bin"
                  value={pendingResult.category.id} 
                  onChange={(e) => {
                    const targetCat = CATEGORIES.find(c => c.id === e.target.value);
                    if (targetCat.id !== pendingResult.category.id) {
                      setModelCorrections(prev => [
                        ...prev,
                        {
                          timestamp: Date.now(),
                          specimenName: pendingResult.name,
                          confidence: pendingResult.confidence,
                          originalCategory: pendingResult.category.id,
                          correctedCategory: targetCat.id,
                          operator: userRole === 'operator' ? 'Tech-804' : 'Admin-12'
                        }
                      ]);
                    }
                    
                    setPendingResult({
                      ...pendingResult,
                      category: targetCat,
                      overrideStatus: 'OVERRIDDEN'
                    });
                    
                    // Retrospectively update the log's category in the background log list
                    setLogs(prevLogs => prevLogs.map(log => {
                      if (log.id === pendingResult.logId) {
                        return {
                          ...log,
                          category: targetCat,
                          status: 'OVERRIDDEN'
                        };
                      }
                      return log;
                    }));
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', marginTop: '6px', fontSize: '12px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name} Waste Bin</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '12px', padding: '12px', background: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #EAEAEA' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#5E5E5E' }}>DISPOSAL PROTOCOL</div>
                <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '2px' }}>{pendingResult.action}</div>
              </div>

              {pendingResult.rationale && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255, 213, 107, 0.08)', borderRadius: '12px', border: `1.5px dashed ${COLORS.YellowPanel}` }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#B45309' }}>AI CLINICAL RATIONALE</div>
                  <div style={{ fontSize: '10px', fontWeight: '600', fontStyle: 'italic', marginTop: '4px' }}>"{pendingResult.rationale}"</div>
                </div>
              )}

              {/* Approve / Reject Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                <button 
                  type="button"
                  className="btn-primary" 
                  onClick={async () => {
                    const res = pendingResult;
                    if (res.status === 'SUPERVISOR HOLD' && userRole !== 'supervisor') {
                      addToast("Access Denied: Low confidence specimen is on Supervisor Hold. Supervisor role required.", "error");
                      return;
                    }

                    const safeBinIndex = CATEGORIES.findIndex(c => c.id === res.category.id);
                    const limits = BIN_LIMITS[res.category.id] || { weight: 5.0, volume: 10.0 };
                    
                    if (binCounts[safeBinIndex] >= 10 || binWeights[safeBinIndex] >= limits.weight || binVolumes[safeBinIndex] >= limits.volume) {
                      addToast(`SAFETY INTERLOCK: The ${res.category.name} bin is full. Please empty it in the right panel first.`, 'error');
                      return;
                    }

                    setPendingResult(null);
                    await runSequence({
                      name: res.name,
                      category: res.category.id,
                      confidence: res.confidence,
                      action: res.action,
                      rationale: res.rationale,
                      hazardLevel: res.hazardLevel,
                      overrideStatus: res.overrideStatus || 'VERIFIED',
                      logId: res.logId
                    }, true, true);
                  }}
                  style={{ 
                    background: (pendingResult.status === 'SUPERVISOR HOLD' && userRole !== 'supervisor') ? '#E2E8F0' : COLORS.Dark, 
                    color: (pendingResult.status === 'SUPERVISOR HOLD' && userRole !== 'supervisor') ? '#94A3B8' : COLORS.White, 
                    boxShadow: 'none', 
                    padding: '14px', 
                    margin: 0,
                    cursor: (pendingResult.status === 'SUPERVISOR HOLD' && userRole !== 'supervisor') ? 'not-allowed' : 'pointer'
                  }}
                >
                  {pendingResult.status === 'SUPERVISOR HOLD' && userRole !== 'supervisor' ? '🔒 SUPERVISOR HOLD' : 'APPROVE & SORT →'}
                </button>
                <button 
                  type="button"
                  style={{ width: '100%', padding: '14px', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '24px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => {
                    setLogs(prev => prev.map(log => {
                      if (log.id === pendingResult.logId) {
                        return { ...log, status: 'REJECTED' };
                      }
                      return log;
                    }));
                    addToast(`Rejected specimen: ${pendingResult.name}`, 'error');
                    setPendingResult(null);
                    setImagePreview(null);
                    setSelectedPresetName(null);
                    setPhase('idle');
                    setPhaseLabel('IDLE');
                  }}
                >
                  REJECT SPECIMEN
                </button>
              </div>
            </div>
          ) : resultData ? (
            /* PREVIOUSLY VERIFIED RESULT DISPLAY */
            <div className="result-box" style={{ margin: 0, borderLeft: `8px solid ${resultData.category.color}`, borderTop: `2px solid ${COLORS.Gray}`, borderRight: `2px solid ${COLORS.Gray}`, borderBottom: `2px solid ${COLORS.Gray}` }} onClick={() => setIsFullScreenResult(true)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className="hazard-badge" style={{ color: resultData.category.color, borderColor: resultData.category.color, background: COLORS.White, margin: 0 }}>
                  {resultData.hazardLevel || `${resultData.category.hazard.toUpperCase()} HAZARD`}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsFullScreenResult(true); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#5E5E5E',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '12px',
                    backgroundColor: COLORS.Gray,
                    transition: 'background 0.2s'
                  }}
                  aria-label="Expand classification report"
                >
                  ⤢ EXPAND
                </button>
              </div>
              
              <div style={{ fontSize: '18px', fontWeight: '800', color: COLORS.Dark }}>{resultData.category.name}</div>
              <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: '700', color: '#5E5E5E' }}>{resultData.name}</div>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700' }}>CONFIDENCE</div>
                <div style={{ fontSize: '14px', fontWeight: '800' }}>{(resultData.confidence * 100).toFixed(1)}%</div>
              </div>
              <div style={{ height: '6px', background: COLORS.Gray, borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${resultData.confidence * 100}%`, height: '100%', background: getConfidenceColor(resultData.confidence) }} />
              </div>
              <div style={{ marginTop: '16px', padding: '12px', background: COLORS.Gray, borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#5E5E5E' }}>PROTOCOL</div>
                <div style={{ fontSize: '12px', fontWeight: '700' }}>{resultData.action}</div>
              </div>
              {resultData.rationale && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255, 213, 107, 0.08)', borderRadius: '12px', border: `1px dashed ${COLORS.YellowPanel}` }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#B45309' }}>AI RATIONALE</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', fontStyle: 'italic', marginTop: '4px' }}>"{resultData.rationale}"</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '20px', border: '2px dashed #E2E8F0', borderRadius: '24px', background: '#FAFAFA', textAlign: 'center', fontSize: '11px', color: '#5E5E5E', fontWeight: '600' }}>
              No specimen classified yet. Load a preset or image above.
            </div>
          )}
        </div>
        {/* Specimen Quick-Buttons (Wrapping Flex Chips Layout) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: `2px solid ${COLORS.Gray}`, paddingTop: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#5E5E5E', letterSpacing: '0.5px' }}>TEST SPECIMEN PRESETS</span>
            {(phase !== 'idle' || simulationMode === 'locomotion') && (
              <span style={{ fontSize: '9px', fontWeight: '800', color: '#EF4444', background: '#FEE2E2', padding: '2px 6px', borderRadius: '4px', animation: 'pulse 1s infinite' }}>
                LOCKED
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', overflowY: 'auto', maxHeight: '180px', paddingRight: '4px' }}>
            {SAMPLES.map(s => {
              const isDisabled = phase !== 'idle' || autoCycle || simulationMode === 'locomotion';
              return (
                <button 
                  type="button"
                  key={s.name} 
                  className="sample-btn" 
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      setSelectedPresetName(s.name);
                      setPendingResult(null);
                      // Generate inline SVG Mock Image containing emoji
                      const dataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" style="background:%23F4F4F5"><rect width="200" height="200" rx="20" fill="%23FFFFFF" stroke="%23E2E8F0" stroke-width="4"/><text x="100" y="130" font-size="90" text-anchor="middle">${s.icon}</text></svg>`;
                      setImagePreview(dataUrl);
                    }
                  }}
                  style={{ 
                    opacity: isDisabled ? 0.6 : 1, 
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    backgroundColor: COLORS.White,
                    border: '1.5px solid #EAEAEA'
                  }}
                  aria-label={`Select preset ${s.name}`}
                >
                  <span>{s.icon}</span>
                  <span style={{ fontWeight: '700' }}>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </form>
      <div className="panel-center">
        {/* Live Camera Scanner Overlay */}
        {phase === 'detecting' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 150, 105, 0.04)', pointerEvents: 'none', zIndex: 5, border: '2.5px solid #059669', borderRadius: '24px', animation: 'pulse 1.5s infinite' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#059669', filter: 'blur(1px)', boxShadow: '0 0 10px #059669', animation: 'scanMove 2s linear infinite' }} />
            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', color: '#059669', fontSize: '9px', fontFamily: 'DM Mono, monospace', fontWeight: '800' }}>
              <span>🎥 SCANNING CONVEYOR FEED</span>
              <span>RESOLVING OVERLAY PATHS...</span>
            </div>
            {/* Green targeted object overlay */}
            <div style={{ position: 'absolute', top: '35%', left: '35%', width: '30%', height: '30%', border: '2px dashed #059669', borderRadius: '12px' }}>
              <span style={{ position: 'absolute', top: '-14px', left: 0, color: '#059669', fontSize: '9px', fontWeight: '800', fontFamily: 'DM Mono' }}>TARGET_SPECIMEN_ACTIVE</span>
            </div>
          </div>
        )}

        {/* Thermal Lockdown Emergency Stop Overlay */}
        {thermalEStop && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(220, 38, 38, 0.15)', pointerEvents: 'none', zIndex: 9, border: '4px solid #EF4444', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#EF4444', color: '#FFF', padding: '24px 32px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(220,38,38,0.3)', textAlign: 'center', maxWidth: '300px' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '1px' }}>⚠️ E-STOP TRIGGERED ⚠️</div>
              <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '6px', color: '#FEE2E2' }}>Thermal overload threshold exceeded ({thermalTemp}°C). Systems halted.</div>
              {userRole === 'supervisor' && (
                <button 
                  type="button" 
                  onClick={() => {
                    setThermalTemp(45.0);
                    setThermalEStop(false);
                    addToast("Emergency override: manual coolant flush applied. E-Stop released.", "success");
                  }} 
                  style={{ pointerEvents: 'auto', marginTop: '16px', background: '#FFF', color: '#EF4444', border: 'none', padding: '8px 16px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'inline-block', width: '100%' }}
                >
                  ❄️ COOLANT FLUSH OVERRIDE
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collision Warning Overlay */}
        {collisionWarning && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(245, 158, 11, 0.15)', pointerEvents: 'none', zIndex: 8, border: '4px solid #F59E0B', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#F59E0B', color: COLORS.Dark, padding: '16px 24px', borderRadius: '16px', fontWeight: '900', fontSize: '11px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              💥 COLLISION INTENT DETECTED<br/>
              <span style={{ fontSize: '9px', fontWeight: '700', opacity: 0.8 }}>Robot movement locked inside safe zone boundaries.</span>
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', alignItems: 'center', gap: '12px', background: COLORS.White, padding: '12px 20px', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', zIndex: 10 }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: phase === 'idle' ? '#DDD' : COLORS.Green }} />
          <div style={{ fontSize: '14px', fontWeight: '800' }}>{phaseLabel}</div>
          <div style={{ marginLeft: '16px', fontSize: '13px', fontFamily: 'DM Mono', color: '#888' }}>{(elapsed / 1000).toFixed(2)}s</div>
        </div>

        {/* Mode Selector Tab Group */}
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px', zIndex: 10 }}>
          <button
            type="button"
            onClick={() => setSimulationMode('conveyor')}
            style={{
              padding: '10px 16px',
              borderRadius: '20px',
              border: 'none',
              background: simulationMode === 'conveyor' ? COLORS.Dark : COLORS.White,
              color: simulationMode === 'conveyor' ? COLORS.White : COLORS.Dark,
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⚙️ Conveyor Deck
          </button>
          <button
            type="button"
            onClick={() => setSimulationMode('locomotion')}
            style={{
              padding: '10px 16px',
              borderRadius: '20px',
              border: 'none',
              background: simulationMode === 'locomotion' ? COLORS.Dark : COLORS.White,
              color: simulationMode === 'locomotion' ? COLORS.White : COLORS.Dark,
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🚚 Mobile Corridor
          </button>
        </div>

        <iframe
          ref={iframeRef}
          src="/medisort-simulation.html"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Robotic Simulation"
        />
      </div>
      <div className="panel-right">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
          <h2 style={{ fontWeight: '800', fontSize: '16px', margin: 0 }}>Waste Bins</h2>
          <button 
            type="button"
            onClick={() => {
              triggerConfirm(
                "Empty All Bins",
                "Are you sure you want to empty all waste bins? This action cannot be undone.",
                () => {
                  setBinCounts([0,0,0,0,0,0,0,0]);
                  setBinWeights([0,0,0,0,0,0,0,0]);
                  setBinVolumes([0,0,0,0,0,0,0,0]);
                  addToast("All waste bins have been emptied.", "success");
                }
              );
            }}
            style={{ padding: '6px 10px', background: COLORS.Dark, color: '#FFF', border: 'none', borderRadius: '10px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' }}
          >
            EMPTY ALL
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flexGrow: 1, paddingRight: '2px' }}>
          {CATEGORIES.map((cat, i) => {
            const limits = BIN_LIMITS[cat.id] || { weight: 5.0, volume: 10.0 };
            const isFull = binCounts[i] >= 10 || binWeights[i] >= limits.weight || binVolumes[i] >= limits.volume;
            
            const countRatio = binCounts[i] / 10;
            const weightRatio = binWeights[i] / limits.weight;
            const volumeRatio = binVolumes[i] / limits.volume;
            const maxRatio = Math.max(countRatio, weightRatio, volumeRatio);

            const stepsToFull = Math.max(0, Math.ceil((1.0 - maxRatio) * 10));
            const estSecs = stepsToFull * 6.5;
            const timeToFullStr = autoCycle 
              ? (maxRatio >= 1.0 ? 'Full' : `Est. Full: ~${Math.ceil(estSecs)}s`) 
              : 'Stable (no load)';

            return (
              <div key={cat.id} className="bin-card" style={{ border: isFull ? '2px solid #EF4444' : '2px solid transparent', background: isFull ? '#FEF2F2' : COLORS.White, display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', position: 'relative', overflow: 'hidden', minHeight: '74px' }}>
                <div className="bin-fill" style={{ background: cat.color, height: `${Math.min(100, maxRatio * 100)}%` }} />
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #000', fontWeight: '800', fontSize: '11px', flexShrink: 0, zIndex: 2 }}>
                  {binCounts[i]}
                </div>
                <div style={{ minWidth: 0, flexGrow: 1, zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
                    {isFull && <span style={{ fontSize: '7px', fontWeight: '900', color: '#EF4444', background: '#FEE2E2', padding: '1px 3px', borderRadius: '3px' }}>FULL</span>}
                  </div>
                  <div style={{ fontSize: '9px', color: '#5E5E5E', fontWeight: '600', marginTop: '1px' }}>
                    {binWeights[i].toFixed(1)}/{limits.weight}kg | {binVolumes[i].toFixed(1)}/{limits.volume}L
                  </div>
                  <div style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: '700', fontStyle: 'italic' }}>
                    {timeToFullStr}
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    triggerConfirm(
                      `Empty ${cat.name} Bin`,
                      `Are you sure you want to empty the ${cat.name} waste bin? This action cannot be undone.`,
                      () => {
                        setBinCounts(prev => { const n = [...prev]; n[i] = 0; return n; });
                        setBinWeights(prev => { const n = [...prev]; n[i] = 0; return n; });
                        setBinVolumes(prev => { const n = [...prev]; n[i] = 0; return n; });
                        addToast(`${cat.name} waste bin has been emptied.`, "success");
                      }
                    );
                  }}
                  style={{ padding: '4px 6px', border: '1.5px solid #000', borderRadius: '6px', fontSize: '8px', fontWeight: '800', background: COLORS.White, cursor: 'pointer', flexShrink: 0, zIndex: 2 }}
                >
                  EMPTY
                </button>
              </div>
            );
          })}
        </div>

        {/* Real-time Telemetry Dashboard Widget */}
        <div style={{ 
          marginTop: '12px', 
          background: COLORS.Dark, 
          color: '#00FF66', 
          fontFamily: 'DM Mono, monospace', 
          padding: '10px 12px', 
          borderRadius: '16px', 
          fontSize: '9px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '3px', 
          border: '1.5px solid #222', 
          boxShadow: 'inset 0 0 10px rgba(0,255,102,0.1)',
          flexShrink: 0
        }}>
          <div style={{ color: '#888', fontWeight: '800', fontSize: '8px', letterSpacing: '0.8px', marginBottom: '2px' }}>ROBOCORE REAL-TIME TELEMETRY</div>
          <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
            <span>BASE ROTATION:</span>
            <span style={{ fontWeight: 'bold' }}>{baseRotation}°</span>
          </div>
          <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
            <span>SHOULDER JOINT:</span>
            <span style={{ fontWeight: 'bold' }}>{armAngles.shoulder}°</span>
          </div>
          <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
            <span>ELBOW JOINT:</span>
            <span style={{ fontWeight: 'bold' }}>{armAngles.elbow}°</span>
          </div>
          <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
            <span>GRIPPER GAP:</span>
            <span style={{ fontWeight: 'bold' }}>{fingerGap} mm</span>
          </div>
          <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between', color: thermalTemp >= 75 ? '#FF4D4D' : (thermalTemp >= 60 ? '#FFB84D' : '#00FF66') }}>
            <span>THERMAL LOAD:</span>
            <span style={{ fontWeight: 'bold' }}>{thermalTemp.toFixed(1)} / 80 °C</span>
          </div>
          <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between', borderTop: '1px solid #222', paddingTop: '4px', marginTop: '1px', color: phase === 'idle' ? '#00FF66' : '#FFD56B' }}>
            <span>SYSTEM STATE:</span>
            <span style={{ fontWeight: 'bold' }}>{phaseLabel}</span>
          </div>
        </div>
      </div>
    </>
  );

  const handleBaseRotationChange = (val) => {
    if (thermalEStop) return;
    if (val > 75 && armAngles.shoulder < -110 && !safetyBypass) {
      setCollisionWarning(true);
      addToast("COLLISION ALERT: Safety interlock active. Base rotation/shoulder collision zone.", "error");
      return;
    }
    setCollisionWarning(false);
    setBaseRotation(val);
    setThermalTemp(curr => Math.min(80.0, +(curr + 0.15).toFixed(1)));
  };

  const handleShoulderChange = (val) => {
    if (thermalEStop) return;
    if (baseRotation > 75 && val < -110 && !safetyBypass) {
      setCollisionWarning(true);
      addToast("COLLISION ALERT: Safety interlock active. Base rotation/shoulder collision zone.", "error");
      return;
    }
    setCollisionWarning(false);
    setArmAngles(prev => ({ ...prev, shoulder: val }));
    setThermalTemp(curr => Math.min(80.0, +(curr + 0.15).toFixed(1)));
  };

  const handleElbowChange = (val) => {
    if (thermalEStop) return;
    setArmAngles(prev => ({ ...prev, elbow: val }));
    setThermalTemp(curr => Math.min(80.0, +(curr + 0.15).toFixed(1)));
  };

  const handleWristChange = (val) => {
    if (thermalEStop) return;
    setWristAngle(val);
    setThermalTemp(curr => Math.min(80.0, +(curr + 0.15).toFixed(1)));
  };

  const handleGripperChange = (val) => {
    if (thermalEStop) return;
    setFingerGap(val);
    setThermalTemp(curr => Math.min(80.0, +(curr + 0.15).toFixed(1)));
  };

  const renderControl = () => {
    // Joint Limit Checks (within 10% of extremum values)
    const baseNearLimit = baseRotation < -72 || baseRotation > 72;
    const shoulderNearLimit = armAngles.shoulder < -162 || armAngles.shoulder > -18;
    const elbowNearLimit = armAngles.elbow < -162 || armAngles.elbow > 162;
    const wristNearLimit = wristAngle < -81 || wristAngle > 81;
    const gripperNearLimit = fingerGap < 6.8 || fingerGap > 29.2;

    return (
      <div className="control-grid">
        <div className="control-card" style={{ opacity: (thermalEStop || simulationMode === 'locomotion') ? 0.6 : 1, transition: 'opacity 0.3s', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontWeight: '800', fontSize: '20px', margin: 0 }}>Manual Override</h2>
            {thermalEStop && <span style={{ fontSize: '9px', fontWeight: '900', color: '#EF4444', background: '#FEE2E2', padding: '3px 8px', borderRadius: '4px' }}>E-STOP ACTIVE</span>}
            {simulationMode === 'locomotion' && <span style={{ fontSize: '9px', fontWeight: '900', color: '#3b82f6', background: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>MOBILE SCENE ACTIVE</span>}
          </div>

          {simulationMode === 'locomotion' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.85)',
              borderRadius: '24px',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              backdropFilter: 'blur(2px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
              <div style={{ fontWeight: '800', fontSize: '15px', color: COLORS.Dark }}>Manual Controls Locked</div>
              <div style={{ fontSize: '11px', color: '#5E5E5E', marginTop: '6px', maxWidth: '240px', lineHeight: 1.5 }}>
                Manual joint override is disabled while the robot is in Mobile Corridor mode. Switch back to Conveyor Deck mode to manually control joints.
              </div>
              <button
                type="button"
                onClick={() => setSimulationMode('conveyor')}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  background: COLORS.Dark,
                  color: COLORS.White,
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Switch to Conveyor Deck
              </button>
            </div>
          )}

          {/* Collision Safety Interlock controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#F8FAFC', padding: '12px', borderRadius: '16px', border: '1.5px solid #E2E8F0', margin: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800' }}>Safety Interlock Lockout</span>
                <div style={{ fontSize: '9px', color: '#64748B', marginTop: '1px' }}>Prevents Base & Shoulder collisions</div>
              </div>
              <button 
                type="button"
                disabled={userRole !== 'supervisor' || thermalEStop}
                onClick={() => {
                  setSafetyBypass(!safetyBypass);
                  addToast(safetyBypass ? "Collision safety interlock activated." : "WARNING: Collision safety interlock bypassed.", safetyBypass ? 'success' : 'error');
                }}
                style={{
                  padding: '6px 12px',
                  background: safetyBypass ? '#EF4444' : COLORS.Dark,
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '9px',
                  fontWeight: '800',
                  cursor: userRole === 'supervisor' ? 'pointer' : 'not-allowed',
                  opacity: (userRole === 'supervisor' && !thermalEStop) ? 1 : 0.5
                }}
              >
                {safetyBypass ? 'BYPASS ACTIVE' : 'LOCKED'}
              </button>
            </div>
            {userRole !== 'supervisor' && (
              <div style={{ fontSize: '9px', color: '#EF4444', fontWeight: '700' }}>
                🔒 Supervisor role required to override safety zones.
              </div>
            )}
          </div>

          <div className="slider-group">
            <label htmlFor="base-rotation-slider" style={{ fontSize: '12px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
              <span>Base Rotation ({baseRotation}°)</span>
              {baseNearLimit && <span style={{ color: '#F59E0B', fontSize: '10px', fontWeight: '800' }}>⚠️ NEAR JOINT LIMIT</span>}
            </label>
            <input 
              id="base-rotation-slider" 
              type="range" 
              min="-90" 
              max="90" 
              step="1" 
              disabled={thermalEStop} 
              value={baseRotation} 
              onChange={e => handleBaseRotationChange(parseInt(e.target.value))} 
              aria-label="Base Rotation in degrees" 
            />
          </div>

          <div className="slider-group">
            <label htmlFor="shoulder-angle-slider" style={{ fontSize: '12px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
              <span>Shoulder Angle ({armAngles.shoulder}°)</span>
              {shoulderNearLimit && <span style={{ color: '#F59E0B', fontSize: '10px', fontWeight: '800' }}>⚠️ NEAR JOINT LIMIT</span>}
            </label>
            <input 
              id="shoulder-angle-slider" 
              type="range" 
              min="-180" 
              max="0" 
              step="1" 
              disabled={thermalEStop} 
              value={armAngles.shoulder} 
              onChange={e => handleShoulderChange(parseInt(e.target.value))} 
              aria-label="Shoulder Angle in degrees" 
            />
          </div>

          <div className="slider-group">
            <label htmlFor="elbow-angle-slider" style={{ fontSize: '12px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
              <span>Elbow Angle ({armAngles.elbow}°)</span>
              {elbowNearLimit && <span style={{ color: '#F59E0B', fontSize: '10px', fontWeight: '800' }}>⚠️ NEAR JOINT LIMIT</span>}
            </label>
            <input 
              id="elbow-angle-slider" 
              type="range" 
              min="-180" 
              max="180" 
              step="1" 
              disabled={thermalEStop} 
              value={armAngles.elbow} 
              onChange={e => handleElbowChange(parseInt(e.target.value))} 
              aria-label="Elbow Angle in degrees" 
            />
          </div>

          <div className="slider-group">
            <label htmlFor="wrist-tilt-slider" style={{ fontSize: '12px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
              <span>Wrist Tilt ({wristAngle}°)</span>
              {wristNearLimit && <span style={{ color: '#F59E0B', fontSize: '10px', fontWeight: '800' }}>⚠️ NEAR JOINT LIMIT</span>}
            </label>
            <input 
              id="wrist-tilt-slider" 
              type="range" 
              min="-90" 
              max="90" 
              step="1" 
              disabled={thermalEStop} 
              value={wristAngle} 
              onChange={e => handleWristChange(parseInt(e.target.value))} 
              aria-label="Wrist Tilt in degrees" 
            />
          </div>

          <div className="slider-group">
            <label htmlFor="gripper-gap-slider" style={{ fontSize: '12px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
              <span>Gripper Gap ({fingerGap} mm)</span>
              {gripperNearLimit && <span style={{ color: '#F59E0B', fontSize: '10px', fontWeight: '800' }}>⚠️ NEAR JOINT LIMIT</span>}
            </label>
            <input 
              id="gripper-gap-slider" 
              type="range" 
              min="4" 
              max="32" 
              step="1" 
              disabled={thermalEStop} 
              value={fingerGap} 
              onChange={e => handleGripperChange(parseInt(e.target.value))} 
              aria-label="Gripper Gap in millimeters" 
            />
          </div>

          <button 
            type="button" 
            className="btn-primary" 
            disabled={thermalEStop} 
            onClick={() => { 
              setArmAngles({shoulder: -75, elbow: 100}); 
              setBaseRotation(0); 
              setWristAngle(0); 
              setFingerGap(18); 
            }} 
            style={{ marginTop: '8px' }}
          >
            Reset to Home
          </button>

          {/* Real-time Telemetry Dashboard */}
          <div style={{ marginTop: '16px', background: COLORS.Dark, color: '#00FF66', fontFamily: 'DM Mono, monospace', padding: '16px', borderRadius: '16px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px', border: '2px solid #222', boxShadow: 'inset 0 0 10px rgba(0,255,102,0.1)' }}>
            <div style={{ color: '#888', fontWeight: '800', fontSize: '9px', letterSpacing: '1px', marginBottom: '4px' }}>ROBOCORE REAL-TIME TELEMETRY</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>BASE ROTATION:</span>
              <span style={{ fontWeight: 'bold' }}>{baseRotation}°</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SHOULDER JOINT:</span>
              <span style={{ fontWeight: 'bold' }}>{armAngles.shoulder}°</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ELBOW JOINT:</span>
              <span style={{ fontWeight: 'bold' }}>{armAngles.elbow}°</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>WRIST TILT:</span>
              <span style={{ fontWeight: 'bold' }}>{wristAngle}°</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GRIPPER GAP:</span>
              <span style={{ fontWeight: 'bold' }}>{fingerGap} mm</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: thermalTemp >= 75 ? '#EF4444' : (thermalTemp >= 60 ? '#F59E0B' : '#00FF66') }}>
              <span>THERMAL STATUS:</span>
              <span style={{ fontWeight: 'bold' }}>{thermalTemp}°C / 80°C</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #222', paddingTop: '6px', marginTop: '4px', color: phase === 'idle' ? '#00FF66' : '#FFD56B' }}>
              <span>SYSTEM STATE:</span>
              <span style={{ fontWeight: 'bold' }}>{phaseLabel}</span>
            </div>
          </div>
        </div>
        <div className="control-card" style={{ flexGrow: 1, padding: 0, overflow: 'hidden', minHeight: '360px', position: 'relative' }}>
          {/* Visual overlays for center simulation */}
          {thermalEStop && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.2)', pointerEvents: 'none', zIndex: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#EF4444', color: '#FFF', padding: '16px 24px', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900' }}>⚠️ EMERGENCY SHUTDOWN</div>
                <div style={{ fontSize: '10px', marginTop: '4px' }}>TEMPERATURE CRITICAL: {thermalTemp}°C</div>
              </div>
            </div>
          )}
          {collisionWarning && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(245, 158, 11, 0.15)', pointerEvents: 'none', zIndex: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#F59E0B', color: COLORS.Dark, padding: '12px 20px', borderRadius: '12px', fontWeight: '900', fontSize: '11px' }}>
                💥 COLLISION INTENT LOCKED
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src="/medisort-simulation.html"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Robotic Simulation"
          />
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    // Filter logs for analytics calculations
    const filteredAnalyticsLogs = logs.filter(log => {
      if (analyticsTimeRange === 'today') {
        return (Date.now() - log.timestamp) <= 24 * 60 * 60 * 1000;
      } else if (analyticsTimeRange === 'week') {
        return (Date.now() - log.timestamp) <= 7 * 24 * 60 * 60 * 1000;
      }
      return true;
    });

    if (logs.length === 0) {
      return (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center', color: '#5E5E5E' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: COLORS.Dark, margin: '0 0 8px 0' }}>No Analytics Data Available</h2>
          <p style={{ fontSize: '13px', maxWidth: '320px', margin: 0, fontWeight: '500', lineHeight: 1.5 }}>Please run some classifications on the Dashboard to populate the analytics dashboard.</p>
        </div>
      );
    }

    // Calculate category distribution from filtered logs
    const distributionCounts = CATEGORIES.map(cat => {
      return filteredAnalyticsLogs.filter(log => log.category.id === cat.id && log.status !== 'REJECTED').length;
    });

    const activeAnalyticLogs = filteredAnalyticsLogs.filter(l => l.status !== 'REJECTED');
    const avgConfidence = activeAnalyticLogs.length
      ? (activeAnalyticLogs.reduce((a, b) => a + b.confidence, 0) / activeAnalyticLogs.length * 100).toFixed(1)
      : '0.0';

    return (
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Analytics Header Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px 0 40px', flexShrink: 0 }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Operational & Compliance Analytics</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="analytics-time-select" style={{ fontSize: '11px', fontWeight: '800', color: '#5E5E5E' }}>TIME RANGE:</label>
            <select
              id="analytics-time-select"
              value={analyticsTimeRange}
              onChange={e => setAnalyticsTimeRange(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '12px', outline: 'none', fontWeight: '700', cursor: 'pointer' }}
            >
              <option value="all">All Time</option>
              <option value="today">Today (Past 24h)</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#5E5E5E' }}>TOTAL ITEMS</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{filteredAnalyticsLogs.filter(l => l.status !== 'PENDING' && l.status !== 'REJECTED').length}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#5E5E5E' }}>AVG CONFIDENCE</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{avgConfidence}%</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#5E5E5E' }}>HUMAN OVERRIDES</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{overrideCount}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#5E5E5E' }}>SYSTEM UPTIME</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>99.8%</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#5E5E5E' }}>ERROR RATE</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>0.02%</div>
          </div>
        </div>

        <div className="chart-container" style={{ padding: '0 40px 24px 40px' }}>
          <div className="bar-chart" style={{ position: 'relative', flex: '1 1 340px' }}>
            <h2 style={{ fontWeight: '800', fontSize: '16px', margin: 0 }}>Waste Distribution by Category</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', position: 'relative' }}>
              {/* Vertical Grid Lines */}
              <div style={{ position: 'absolute', left: '120px', right: '40px', top: 0, bottom: 0, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                {[0, 25, 50, 75, 100].map(pct => (
                  <div key={pct} style={{ width: '1px', background: '#E2E8F0', height: '100%', opacity: pct === 0 ? 0 : 0.5 }} />
                ))}
              </div>

              {CATEGORIES.map((cat, i) => {
                const count = distributionCounts[i];
                const max = Math.max(...distributionCounts, 1);
                return (
                  <div key={cat.id} className="bar-row" style={{ zIndex: 1 }}>
                    <div style={{ width: '120px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</div>
                    <div style={{ flexGrow: 1, height: '100%', background: '#EEE', borderRadius: '6px' }}>
                      <div className="bar-fill" style={{ width: `${(count/max)*100}%`, background: cat.color }} />
                    </div>
                    <div style={{ width: '40px', fontSize: '12px', fontWeight: '800', textAlign: 'right' }}>{count}</div>
                  </div>
                );
              })}
            </div>
            {/* X-Axis scale tick labels */}
            <div style={{ display: 'flex', marginLeft: '120px', marginRight: '40px', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', fontWeight: '800', color: '#5E5E5E' }}>
              {(() => {
                const maxVal = Math.max(...distributionCounts, 1);
                const labels = maxVal === 1 
                  ? [0, 1] 
                  : [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];
                return labels.map((lbl, idx) => (
                  <span key={idx}>{lbl}</span>
                ));
              })()}
            </div>
          </div>

          <div className="bar-chart" style={{ flex: '1 1 340px' }}>
            <h2 style={{ fontWeight: '800', fontSize: '16px', margin: 0 }}>System Health</h2>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}><span>BATTERY LEVEL</span><span>98%</span></div>
                <div style={{ height: '8px', background: '#EEE', borderRadius: '4px', marginTop: '4px' }}><div style={{ width: '98%', height: '100%', background: COLORS.Green, borderRadius: '4px' }} /></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}><span>MOTOR TORQUE</span><span>{motorTorque} / 10.0 Nm</span></div>
                <div style={{ height: '8px', background: '#EEE', borderRadius: '4px', marginTop: '4px' }}><div style={{ width: `${(motorTorque/10)*100}%`, height: '100%', background: COLORS.Dark, borderRadius: '4px' }} /></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}><span>CAMERA STATUS</span><span style={{ color: '#059669', fontWeight: '800' }}>ONLINE</span></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}><span>LIDAR STATUS</span><span style={{ color: '#059669', fontWeight: '800' }}>ACTIVE</span></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}><span>CPU LOAD</span><span>12%</span></div>
                <div style={{ height: '8px', background: '#EEE', borderRadius: '4px', marginTop: '4px' }}><div style={{ width: '12%', height: '100%', background: COLORS.Dark, borderRadius: '4px' }} /></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}>
                  <span>THERMAL METER</span>
                  <span style={{ color: thermalTemp >= 75 ? '#EF4444' : (thermalTemp >= 60 ? '#F59E0B' : '#059669'), fontWeight: '800' }}>{thermalTemp.toFixed(1)} / 80 °C</span>
                </div>
                <div style={{ height: '8px', background: '#EEE', borderRadius: '4px', marginTop: '4px' }}>
                  <div style={{ 
                    width: `${(thermalTemp/80)*100}%`, 
                    height: '100%', 
                    background: thermalTemp >= 75 ? '#EF4444' : (thermalTemp >= 60 ? '#F59E0B' : '#10B981'), 
                    borderRadius: '4px',
                    transition: 'all 0.5s ease-out'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Model Retraining Loop feedback panel */}
          <div className="bar-chart" style={{ flex: '1 1 100%', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontWeight: '800', fontSize: '16px', margin: 0 }}>AI Retraining Loop (Feedback Loop)</h2>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Active corrections feed for model fine-tuning</div>
              </div>
              <button
                type="button"
                disabled={modelCorrections.length === 0}
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(modelCorrections, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `medisort_corrections_dataset_${Date.now()}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  document.body.removeChild(downloadAnchor);
                  addToast("Active learning corrections exported successfully.", "success");
                }}
                style={{ 
                  padding: '8px 16px', 
                  background: modelCorrections.length > 0 ? COLORS.Dark : '#E2E8F0', 
                  color: modelCorrections.length > 0 ? '#FFF' : '#94A3B8', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontSize: '11px', 
                  fontWeight: '800', 
                  cursor: modelCorrections.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                📥 EXPORT TRAINING DATA ({modelCorrections.length})
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#5E5E5E', marginTop: '12px', lineHeight: 1.5 }}>
              Active Learning aggregates all classification reassignments corrected by supervisors. Use this JSON dataset in the retraining pipeline to mitigate future routing issues.
            </div>
            <div style={{ marginTop: '16px', overflowY: 'auto', maxHeight: '180px' }}>
              {modelCorrections.length === 0 ? (
                <div style={{ padding: '32px', border: '2px dashed #E2E8F0', borderRadius: '16px', textAlign: 'center', fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>
                  No human overrides recorded in the current session.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${COLORS.Gray}`, color: '#64748B', fontWeight: '800' }}>
                      <th style={{ padding: '8px' }}>TIMESTAMP</th>
                      <th style={{ padding: '8px' }}>SPECIMEN</th>
                      <th style={{ padding: '8px' }}>ORIGINAL CLASSIFICATION</th>
                      <th style={{ padding: '8px' }}>SUPERVISOR OVERRIDE</th>
                      <th style={{ padding: '8px' }}>OPERATOR ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelCorrections.map((corr, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.Gray}`, fontWeight: '700' }}>
                        <td style={{ padding: '8px', color: '#64748B' }}>{new Date(corr.timestamp).toLocaleTimeString()}</td>
                        <td style={{ padding: '8px' }}>{corr.specimenName}</td>
                        <td style={{ padding: '8px', color: '#EF4444' }}>{corr.originalCategory}</td>
                        <td style={{ padding: '8px', color: '#10B981' }}>{corr.correctedCategory}</td>
                        <td style={{ padding: '8px' }}>{corr.operator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (logs.length === 0) {
      return (
        <div style={{ padding: '40px', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#5E5E5E' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: COLORS.Dark, margin: '0 0 8px 0' }}>History Log Empty</h2>
          <p style={{ fontSize: '13px', maxWidth: '320px', margin: 0, fontWeight: '500', lineHeight: 1.5 }}>No specimens have been processed yet. Classify specimens on the Dashboard to see them logged here.</p>
        </div>
      );
    }

    // Perform robust filtering and sorting on logs in-place
    const filteredLogs = logs
      .filter(log => {
        const matchesSearch = log.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || log.category.id === filterCategory;
        const matchesStatus = filterStatus === 'All' || log.status === filterStatus;
        
        let matchesTime = true;
        if (historyTimeRange === 'today') {
          matchesTime = (Date.now() - log.timestamp) <= 24 * 60 * 60 * 1000;
        } else if (historyTimeRange === 'week') {
          matchesTime = (Date.now() - log.timestamp) <= 7 * 24 * 60 * 60 * 1000;
        }
        
        return matchesSearch && matchesCategory && matchesStatus && matchesTime;
      })
      .sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });

    return (
      <div style={{ padding: '40px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Sorting History Log</h2>
            <button 
              type="button"
              onClick={() => {
                if (userRole !== 'supervisor') {
                  addToast("Access Denied: Clearing compliance logs requires Supervisor privileges.", "error");
                  return;
                }
                triggerConfirm(
                  "Clear History Log",
                  "Are you sure you want to clear the entire compliance audit log? This action cannot be undone.",
                  () => {
                    setLogs([]);
                    setOverrideCount(0);
                    addToast("History log has been cleared.", "info");
                  }
                );
              }}
              style={{ 
                padding: '8px 16px', 
                background: userRole === 'supervisor' ? '#EF4444' : '#E2E8F0', 
                color: userRole === 'supervisor' ? '#FFF' : '#94A3B8', 
                border: 'none', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: '800', 
                cursor: userRole === 'supervisor' ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              CLEAR LOG
            </button>
        </div>

        {/* Search, Filter, and Sort Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', background: COLORS.Gray, padding: '16px', borderRadius: '16px', flexShrink: 0, alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search by specimen name..." 
            aria-label="Search history by specimen name"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '12px', flexGrow: 1, outline: 'none', minWidth: '180px' }}
          />
          
          <select 
            value={filterCategory} 
            aria-label="Filter by Category"
            onChange={e => setFilterCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '12px', outline: 'none', fontWeight: '700', cursor: 'pointer' }}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select 
            value={filterStatus} 
            aria-label="Filter by Status"
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '12px', outline: 'none', fontWeight: '700', cursor: 'pointer' }}
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="SUPERVISOR HOLD">SUPERVISOR HOLD</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="OVERRIDDEN">OVERRIDDEN</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <select 
            value={historyTimeRange} 
            aria-label="Filter by Time Range"
            onChange={e => setHistoryTimeRange(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '12px', outline: 'none', fontWeight: '700', cursor: 'pointer' }}
          >
            <option value="all">All Time</option>
            <option value="today">Today (Past 24h)</option>
            <option value="week">Last 7 Days</option>
          </select>

          <select 
            value={sortOrder} 
            aria-label="Sort Order"
            onChange={e => setSortOrder(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '12px', outline: 'none', fontWeight: '700', cursor: 'pointer' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          <button
            type="button"
            onClick={() => {
              const headers = ["TIMESTAMP", "OPERATOR ID", "SPECIMEN NAME", "CATEGORY", "CONFIDENCE", "STATUS", "HAZARD LEVEL"];
              const rows = filteredLogs.map(log => [
                log.time,
                log.operatorId || 'N/A',
                `"${log.name.replace(/"/g, '""')}"`,
                log.category.name,
                `${(log.confidence * 100).toFixed(1)}%`,
                log.status,
                log.hazardLevel || 'N/A'
              ]);
              const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `medisort_compliance_report_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              addToast("CSV Compliance Report exported successfully.", "success");
            }}
            style={{ 
              padding: '8px 14px', 
              borderRadius: '8px', 
              border: 'none', 
              background: COLORS.Dark, 
              color: '#FFF', 
              fontSize: '12px', 
              fontWeight: '800', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'transform 0.1s'
            }}
          >
            📥 EXPORT CSV
          </button>
        </div>

        {/* History Table */}
        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: `2px solid ${COLORS.Gray}`, color: '#5E5E5E', fontSize: '12px', position: 'sticky', top: 0, background: '#FFF', zIndex: 10 }}>
                <th style={{ padding: '12px' }}>TIMESTAMP</th>
                <th style={{ padding: '12px' }}>SPECIMEN NAME</th>
                <th style={{ padding: '12px' }}>CATEGORY</th>
                <th style={{ padding: '12px' }}>CONFIDENCE</th>
                <th style={{ padding: '12px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: `1px solid ${COLORS.Gray}`, fontSize: '13px', fontWeight: '700' }}>
                  <td style={{ padding: '16px 12px', color: '#5E5E5E' }}>{log.time}</td>
                  <td style={{ padding: '16px 12px' }}>{log.name}</td>
                  <td style={{ padding: '16px 12px' }}>
                    {log.status === 'REJECTED' ? (
                      <span style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '8px', background: COLORS.Gray, color: '#5E5E5E' }}>
                        {log.category.name}
                      </span>
                    ) : (
                      <select
                        value={log.category.id}
                        aria-label="Override Category Destination"
                        onChange={(e) => handleOverrideLogCategory(log.id, e.target.value)}
                        disabled={log.status === 'PENDING'}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid #000',
                          background: log.category.color,
                          color: COLORS.Dark,
                          fontWeight: '700',
                          fontSize: '11px',
                          cursor: log.status === 'PENDING' ? 'not-allowed' : 'pointer',
                          outline: 'none'
                        }}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id} style={{ background: '#FFF', color: COLORS.Dark }}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td style={{ padding: '16px 12px' }}>{(log.confidence * 100).toFixed(1)}%</td>
                  <td style={{ padding: '16px 12px', color: log.status === 'OVERRIDDEN' ? COLORS.Amber : log.status === 'REJECTED' ? '#EF4444' : log.status === 'PENDING' ? '#D97706' : COLORS.Green }}>
                    {log.status}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#5E5E5E' }}>
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="app-layout">
      <aside className="sidebar" aria-label="Sidebar Section">
        <div style={{ padding: '0 24px', marginBottom: '40px' }}>
          <div style={{ color: COLORS.White, fontSize: '22px', fontWeight: '800', letterSpacing: '-1px' }}>MediSort<span style={{ color: '#FFD56B' }}>.</span></div>
          <div style={{ color: '#A1A1AA', fontSize: '10px', fontWeight: '700', marginTop: '4px' }}>ROBOTIC CORE v4.2</div>
        </div>
        <nav aria-label="Main Navigation" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'control', label: 'Manual Control' },
            { id: 'history', label: 'History Log' },
            { id: 'analytics', label: 'Analytics' }
          ].map(item => (
            <button 
              type="button"
              key={item.id} 
              className={`side-item ${view === item.id ? 'active' : ''}`} 
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <footer style={{ marginTop: 'auto', padding: '0 24px' }}>
          <div style={{ color: '#8E9CAE', fontSize: '10px', fontWeight: '700' }}>© 2026 MEDISORT LABS</div>
        </footer>
      </aside>

      <main className="main-viewport">
        <header className="view-header">
          <h1 className="heading" style={{ fontSize: '24px', margin: 0 }}>MediSort <span style={{ color: '#5E5E5E', fontWeight: '400', fontSize: '18px' }}>/ {view.toUpperCase()}</span></h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Active User Role Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: COLORS.Gray, padding: '6px 12px', borderRadius: '12px', border: '1.5px solid #EAEAEA' }}>
              <label htmlFor="role-select" style={{ fontSize: '10px', fontWeight: '800', color: '#5E5E5E', letterSpacing: '0.5px' }}>ROLE:</label>
              <select
                id="role-select"
                value={userRole}
                onChange={(e) => {
                  setUserRole(e.target.value);
                  addToast(`Switched session role to ${e.target.value === 'operator' ? 'Operator' : 'Supervisor'}.`, 'info');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '800',
                  outline: 'none',
                  cursor: 'pointer',
                  color: COLORS.Dark,
                  fontFamily: 'inherit'
                }}
              >
                <option value="operator">Operator (Tech-804)</option>
                <option value="supervisor">Supervisor (Admin-12)</option>
              </select>
            </div>
            
            {/* Dynamic Status Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: thermalEStop ? '#FEE2E2' : (collisionWarning ? '#FEF3C7' : COLORS.Gray), padding: '8px 16px', borderRadius: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: thermalEStop ? '#EF4444' : (collisionWarning ? '#F59E0B' : '#059669'), animation: thermalEStop ? 'spin 1s linear infinite' : 'none' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: thermalEStop ? '#991B1B' : (collisionWarning ? '#92400E' : '#047857') }}>
                {thermalEStop ? 'SYS: OVERHEAT LOCK' : (collisionWarning ? 'SYS: COLLISION ZONE' : 'SYS: OPTIMAL')}
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', opacity: 0.5 }}>v4.2.1-stable</div>
          </div>
        </header>
        <div className="view-content">
          {view === 'dashboard' && renderDashboard()}
          {view === 'control' && renderControl()}
          {view === 'analytics' && renderAnalytics()}
          {view === 'history' && renderHistory()}
        </div>
      </main>

      {showKeyModal && (
        <div className="api-key-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ background: COLORS.White, padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '500px', margin: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>Setup AI Engine</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#5E5E5E' }}>To enable real-time classification, please enter your Google Gemini API Key. This is stored only in your local browser session.</div>
            <input 
              type="password" 
              placeholder="Enter Gemini API Key..." 
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              style={{ padding: '16px 24px', borderRadius: '16px', border: `2px solid ${COLORS.Gray}`, fontSize: '14px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-primary" onClick={saveApiKey}>ACTIVATE ENGINE</button>
              <button type="button" style={{ padding: '14px 24px', background: COLORS.Gray, borderRadius: '24px', fontWeight: '700', border: 'none', cursor: 'pointer' }} onClick={() => setShowKeyModal(false)}>CANCEL</button>
            </div>
            <div style={{ fontSize: '11px', color: '#888', textAlign: 'center' }}>Get a free key at aistudio.google.com</div>
          </div>
        </div>
      )}

      {isFullScreenResult && resultData && (
        <div className="full-result-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backdropFilter: 'blur(8px)' }} onClick={() => setIsFullScreenResult(false)}>
          <div style={{ background: COLORS.White, padding: '56px', borderRadius: '40px', width: '100%', maxWidth: '800px', margin: 'auto', display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', borderTop: `16px solid ${resultData.category.color}`, boxShadow: '0 40px 80px rgba(0,0,0,0.4)', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <button type="button" style={{ position: 'absolute', top: '24px', right: '32px', background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', color: '#AAA' }} onClick={() => setIsFullScreenResult(false)} aria-label="Close classification report">×</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#5E5E5E', letterSpacing: '2px', textTransform: 'uppercase' }}>ANALYSIS REPORT</div>
                <div style={{ fontSize: '48px', fontWeight: '800', lineHeight: 1.1, marginTop: '8px' }}>{resultData.category.name}</div>
              </div>
              <div style={{ padding: '8px 24px', borderRadius: '32px', fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', border: '3px solid', color: resultData.category.color, borderColor: resultData.category.color }}>
                {resultData.category.hazard} HAZARD
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
               <div style={{ background: COLORS.Gray, padding: '24px', borderRadius: '24px' }}>
                 <div style={{ fontSize: '14px', fontWeight: '700', color: '#5E5E5E' }}>IDENTIFIED SPECIMEN</div>
                 <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px' }}>{resultData.name}</div>
               </div>
               <div style={{ background: COLORS.Gray, padding: '24px', borderRadius: '24px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ fontSize: '14px', fontWeight: '700', color: '#5E5E5E' }}>CONFIDENCE SCORE</div>
                   <div style={{ fontSize: '24px', fontWeight: '800', color: resultData.category.color }}>{(resultData.confidence * 100).toFixed(1)}%</div>
                 </div>
                 <div style={{ height: '12px', background: '#DDD', borderRadius: '6px', marginTop: '16px', overflow: 'hidden' }}>
                    <div style={{ width: `${resultData.confidence * 100}%`, height: '100%', background: getConfidenceColor(resultData.confidence) }} />
                 </div>
               </div>
            </div>

            <div style={{ background: COLORS.Dark, color: COLORS.White, padding: '32px', borderRadius: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#A1A1AA', letterSpacing: '1px' }}>DISPOSAL PROTOCOL</div>
              <div style={{ fontSize: '20px', fontWeight: '600', marginTop: '12px', lineHeight: 1.5 }}>{resultData.action}</div>
            </div>

            {resultData.rationale && (
              <div style={{ background: 'rgba(126, 164, 255, 0.1)', border: `2px dashed ${COLORS.Blue}`, padding: '32px', borderRadius: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563EB', letterSpacing: '1px' }}>AI CLINICAL RATIONALE</div>
                <div style={{ fontSize: '18px', fontWeight: '500', fontStyle: 'italic', marginTop: '12px', color: '#1A1A1A', lineHeight: 1.6 }}>"{resultData.rationale}"</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="confirm-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: COLORS.White, padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', borderTop: `8px solid ${COLORS.YellowPanel}` }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: COLORS.Dark }}>{confirmModal.title}</div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#5E5E5E', lineHeight: 1.5 }}>{confirmModal.message}</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={confirmModal.onConfirm}
                className="btn-primary" 
                style={{ background: COLORS.Dark, color: COLORS.White, margin: 0, padding: '12px', flex: 1, boxShadow: 'none' }}
              >
                CONFIRM
              </button>
              <button 
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                style={{ padding: '12px', background: COLORS.Gray, borderRadius: '24px', fontWeight: '700', border: 'none', cursor: 'pointer', flex: 1, fontSize: '14px' }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );

}
