import React, { useState } from 'react';
import AgentCard from './components/AgentCard';
import ProtocolLog from './components/ProtocolLog';
import { AgentRole, FheValue, EncryptionState, LogEntry, ScenarioStep, PatientVitals } from './types';
import * as FheSim from './services/fheSimulation';
import * as Cohere from './services/cohereService';
import { Activity, Shield, RotateCcw, FileJson, X, Building2 } from 'lucide-react';

// --- OPERATION CONFIGURATION ---
const OPS = {
    // General Doctor (B)
    GENERAL_DOCTOR: [
        { label: 'Refer to Specialist (C)', operation: 'DELEGATE', target: AgentRole.SPECIALIST, description: 'Forward for Diagnosis' },
        { label: 'Order Lab Tests (D)', operation: 'DELEGATE', target: AgentRole.MEDICAL_LAB, description: 'Bloodwork/Analysis' },
        { label: 'Send to Billing (E)', operation: 'DELEGATE', target: AgentRole.BILLING, description: 'Process Insurance' }
    ] as ScenarioStep[],
    
    // Specialist (C)
    SPECIALIST: [
        { label: 'Run Diagnosis', operation: 'INFERENCE', description: 'AI Evaluation' },
        { label: 'Send to Human Doctor', operation: 'DELEGATE', target: AgentRole.HUMAN_DOCTOR, description: 'Final Approval' }
    ] as ScenarioStep[],
    
    // Medical Lab (D)
    MEDICAL_LAB: [
        { label: 'Analyze Biomarkers', operation: 'INFERENCE', description: 'Detect Abnormalities' },
        { label: 'Send Results to Specialist', operation: 'DELEGATE', target: AgentRole.SPECIALIST, description: 'Forward to Dr.' }
    ] as ScenarioStep[],
    
    // Billing (E)
    BILLING: [
        { label: 'Calculate Bill', operation: 'INFERENCE', description: 'FHE Cost Estimation' }
    ] as ScenarioStep[],

    // Human Doctor
    HUMAN_DOCTOR: [
        { label: 'Review & Approve', operation: 'INFERENCE', description: 'Decryption in TEE' },
    ] as ScenarioStep[]
};

// --- HOSPITAL MANIFEST ---
const HOSPITAL_MANIFEST = {
  "uuid": "st-zama-hospital-001",
  "name": "St. Zama Memorial Hospital",
  "departments": ["General", "Specialty", "Pathology", "Finance", "Administration"],
  "security": "FHE-L3 + TEE Enclaves"
};

export default function App() {
  const [showManifest, setShowManifest] = useState(false);
  
  // State for Agents
  const [dataPatient, setDataPatient] = useState<FheValue | null>(null);
  const [dataGenDoc, setDataGenDoc] = useState<FheValue | null>(null);
  const [dataSpecialist, setDataSpecialist] = useState<FheValue | null>(null);
  const [dataLab, setDataLab] = useState<FheValue | null>(null);
  const [dataBilling, setDataBilling] = useState<FheValue | null>(null);
  const [dataHumanDoc, setDataHumanDoc] = useState<FheValue | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agentStatus, setAgentStatus] = useState<Record<string, string>>({
      [AgentRole.PATIENT]: "IDLE",
      [AgentRole.GENERAL_DOCTOR]: "IDLE",
      [AgentRole.SPECIALIST]: "IDLE",
      [AgentRole.MEDICAL_LAB]: "IDLE",
      [AgentRole.BILLING]: "IDLE",
      [AgentRole.HUMAN_DOCTOR]: "IDLE"
  });

  const resetState = () => {
    setDataPatient(null); setDataGenDoc(null); setDataSpecialist(null); setDataLab(null); setDataBilling(null); setDataHumanDoc(null);
    setLogs([]);
    setAgentStatus({
      [AgentRole.PATIENT]: "IDLE",
      [AgentRole.GENERAL_DOCTOR]: "IDLE",
      [AgentRole.SPECIALIST]: "IDLE",
      [AgentRole.MEDICAL_LAB]: "IDLE",
      [AgentRole.BILLING]: "IDLE",
      [AgentRole.HUMAN_DOCTOR]: "IDLE"
    });
    setShowManifest(false);
  };

  const addLog = (
      source: AgentRole, 
      action: string, 
      details: string, 
      metrics?: Record<string, string | number>, 
      mathFormula?: string,
      stepByStepCalculation?: string[]
    ) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source,
      action,
      details,
      hash: Math.random().toString(36).substring(2, 15),
      metrics,
      mathFormula,
      stepByStepCalculation
    };
    setLogs(prev => [...prev, entry]);
  };

  const handleAction = async (source: AgentRole, action: string, payload?: any, target?: AgentRole) => {
    
    const setStatus = (role: AgentRole, msg: string) => {
        setAgentStatus(prev => ({ ...prev, [role]: msg }));
    };

    // --- PATIENT FLOW ---
    if (source === AgentRole.PATIENT) {
        if (action === 'CREATE_DATA') {
            const initialVitals: PatientVitals = {
                heartRate: 72,
                systolic: 120,
                diastolic: 80,
                temperature: 36.6,
                oxygenSat: 98,
                symptomSeverity: 20
            };
            setDataPatient({
                id: crypto.randomUUID(),
                rawValue: initialVitals,
                encryptedBlob: '',
                state: EncryptionState.PLAINTEXT,
                history: ['Created']
            });
            addLog(source, 'ADMIT', `Patient admitted. Vitals recorded.`);
            setStatus(source, "Admitted");
        } 
        else if (action === 'ENCRYPT') {
            if (!dataPatient) return;
            setStatus(source, "Encrypting...");
            setTimeout(() => {
                const op = FheSim.encryptValue(dataPatient.rawValue);
                setDataPatient(op.value);
                addLog(source, 'ENCRYPT', op.logDetails, op.metrics, op.mathFormula, op.stepByStepCalculation);
                setStatus(source, "Encrypted");
            }, 600);
        }
        else if (action === 'DELEGATE') {
            // Patient -> General Doctor
            if (!dataPatient || target !== AgentRole.GENERAL_DOCTOR) return;
            setStatus(source, `Submitting to Hospital...`);
            setTimeout(() => {
                setDataGenDoc(dataPatient); 
                setStatus(AgentRole.GENERAL_DOCTOR, "Received");
                addLog(source, 'SUBMIT', `Forwarding encrypted records to General Doctor (Triage).`);
                setStatus(source, "Submitted");
            }, 800);
        }
        else if (action === 'DECRYPT') {
            if (!dataPatient) return;
            setStatus(source, "Decrypting...");
            setTimeout(() => {
                const decrypted = { ...dataPatient, state: EncryptionState.DECRYPTED };
                setDataPatient(decrypted);
                addLog(source, 'DECRYPT_RESULT', `Private Key applied. Results: ${JSON.stringify(decrypted.rawValue)}.`);
                setStatus(source, "Complete");
            }, 800);
        }
    }

    // --- GENERAL DOCTOR FLOW ---
    else if (source === AgentRole.GENERAL_DOCTOR) {
        if (!dataGenDoc) return;
        if (action === 'DELEGATE' && target) {
            setStatus(source, `Generating Bill & Referral to ${target}...`);
            
            // Generate bill from Cohere
            const vitals = dataGenDoc.rawValue as PatientVitals;
            Cohere.generateGeneralDoctorBill(vitals).then((cohereResult) => {
                setTimeout(() => {
                    const updatedData = {
                        ...dataGenDoc,
                        bills: { ...(dataGenDoc.bills || {}), 'General Doctor': cohereResult.bill }
                    };
                    
                    if (target === AgentRole.SPECIALIST) { setDataSpecialist(updatedData); setStatus(AgentRole.SPECIALIST, "Referral Received"); }
                    if (target === AgentRole.MEDICAL_LAB) { setDataLab(updatedData); setStatus(AgentRole.MEDICAL_LAB, "Sample Received"); }
                    if (target === AgentRole.BILLING) { setDataBilling(updatedData); setStatus(AgentRole.BILLING, "Order Received"); }
                    
                    setDataGenDoc(null);
                    addLog(source, 'REFERRAL', `Referring patient case to ${target}. Data remains encrypted.`);
                    setStatus(source, "Referred");
                }, 800);
            });
        }
    }

    // --- MEDICAL LAB FLOW ---
    else if (source === AgentRole.MEDICAL_LAB) {
        if (!dataLab) return;
        if (action === 'INFERENCE') {
             setStatus(source, "Analyzing Biomarkers & Generating Bill...");
             const vitals = dataLab.rawValue as PatientVitals;
             
             Cohere.generateLabAnalysisBiomarkers(vitals).then((cohereResult) => {
                 setTimeout(() => {
                     const op = FheSim.homomorphicLabAnalysis(dataLab);
                     const updatedValue = {
                         ...op.value,
                         bills: { ...(op.value.bills || {}), 'Medical Lab': cohereResult.bill }
                     };
                     setDataLab({ ...updatedValue });
                     addLog(source, 'LAB_WORK', op.logDetails, { ...op.metrics, biomarkers: JSON.stringify(cohereResult.biomarkers) }, op.mathFormula);
                     setStatus(source, "Analysis Done");
                 }, 1500);
             });
        } else if (action === 'DELEGATE' && target === AgentRole.SPECIALIST) {
             setStatus(source, "Sending Results to Specialist...");
             setTimeout(() => {
                 setDataSpecialist(dataLab);
                 setDataLab(null);
                 addLog(source, 'FORWARD', 'Forwarding lab results to Specialist.');
                 setStatus(AgentRole.SPECIALIST, "Lab Results Received");
                 setStatus(source, "Sent");
             }, 800);
        }
    }

    // --- SPECIALIST FLOW ---
    else if (source === AgentRole.SPECIALIST) {
        if (!dataSpecialist) return;
        if (action === 'INFERENCE') {
            setStatus(source, "Diagnosing & Generating Bill...");
            const vitals = dataSpecialist.rawValue as PatientVitals;
            
            Cohere.generateSpecialistDiagnosis(vitals).then((cohereResult) => {
                setTimeout(() => {
                    const op = FheSim.homomorphicDiagnosis(dataSpecialist);
                    const updatedValue = {
                        ...op.value,
                        bills: { ...(op.value.bills || {}), 'Specialist': cohereResult.bill },
                        severity: cohereResult.severity
                    };
                    setDataSpecialist({ ...updatedValue });
                    addLog(source, 'DIAGNOSIS', op.logDetails, { ...op.metrics, severity: cohereResult.severity }, op.mathFormula);
                    setStatus(source, "Diagnosis Ready");
                }, 2000);
            });
        } else if (action === 'DELEGATE' && target === AgentRole.HUMAN_DOCTOR) {
            setStatus(source, "Requesting Approval...");
            setTimeout(() => {
                setDataHumanDoc(dataSpecialist);
                setDataSpecialist(null);
                addLog(source, 'CONSULT', 'Forwarding AI Diagnosis to Human Doctor for final sign-off.');
                setStatus(AgentRole.HUMAN_DOCTOR, "Review Pending");
                setStatus(source, "Awaiting Approval");
            }, 800);
        }
    }

    // --- HUMAN DOCTOR FLOW ---
    else if (source === AgentRole.HUMAN_DOCTOR) {
        if (!dataHumanDoc) return;
        if (action === 'INFERENCE') { // Review & Approve
            setStatus(source, "Reviewing & Generating Final Bill...");
            const vitals = dataHumanDoc.rawValue as PatientVitals;
            const currentSeverity = dataHumanDoc.severity || 65;
            
            Cohere.generateHumanDoctorReview(vitals, currentSeverity).then((cohereResult) => {
                setTimeout(() => {
                    const op = FheSim.humanDoctorReview(dataHumanDoc);
                    const updatedValue = {
                        ...op.value,
                        bills: { ...(op.value.bills || {}), 'Human Doctor': cohereResult.bill },
                        severity: cohereResult.finalSeverity
                    };
                    setDataHumanDoc({ ...updatedValue });
                    addLog(source, 'APPROVAL', op.logDetails, { ...op.metrics, severity: cohereResult.finalSeverity }, op.mathFormula);
                    setStatus(source, "Approved");
                    
                    // Send to Billing after approval
                    setTimeout(() => {
                        setDataBilling(updatedValue);
                        setDataHumanDoc(null);
                        addLog(source, 'FORWARD_BILLING', 'Forwarding approved case to Billing for cost calculation.');
                        setStatus(AgentRole.BILLING, "Processing Payment...");
                    }, 1000);

                }, 1500);
            });
        }
    }

    // --- BILLING FLOW ---
    else if (source === AgentRole.BILLING) {
        if (!dataBilling) return;
        if (action === 'INFERENCE') {
             setStatus(source, "Generating Final Invoice...");
             setTimeout(() => {
                 const op = FheSim.homomorphicBilling(dataBilling);
                 
                 // Calculate total bill
                 const allBills = dataBilling.bills || {};
                 const totalBill = Object.values(allBills).reduce((sum: number, bill: any) => sum + (typeof bill === 'number' ? bill : 0), 0);
                 
                 const updatedValue = {
                     ...op.value,
                     bills: allBills,
                     totalBill: totalBill
                 };
                 
                 console.log('[BILLING-INVOICE]', { allBills, totalBill });
                 
                 setDataBilling({ ...updatedValue });
                 addLog(source, 'BILLING', op.logDetails, op.metrics, op.mathFormula);
                 setStatus(source, "Invoiced");
                 
                 // Return to Patient after billing
                 setTimeout(() => {
                     setDataPatient({ ...updatedValue });
                     setDataBilling(null);
                     addLog(source, 'COMPLETE', `Complete patient case with final billing. Returning to Patient.`);
                     setStatus(AgentRole.PATIENT, "Results Available");
                     setStatus(source, "Done");
                 }, 800);
             }, 1200);
        }
    }
  };

  const handleDataUpdate = (newData: PatientVitals) => {
      if (dataPatient && dataPatient.state === EncryptionState.PLAINTEXT) {
          setDataPatient({ ...dataPatient, rawValue: newData });
      }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* Manifest Modal */}
      {showManifest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Building2 size={18} className="text-emerald-400"/> Hospital Details
                    </h3>
                    <button onClick={() => setShowManifest(false)} className="text-neutral-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-6 bg-[#0c0c0c]">
                    <pre className="text-xs font-mono text-green-400 overflow-x-auto">
                        {JSON.stringify(HOSPITAL_MANIFEST, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
      )}

      {/* Navbar */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg shadow-lg shadow-emerald-900/20">
                <Shield size={20} className="text-white" />
            </div>
            <div>
                <h1 className="font-bold text-white tracking-tight">HELL YEAH <span className="text-emerald-500">HOSPITAL</span></h1>
                <p className="text-[10px] text-neutral-400 font-mono tracking-widest">ENCRYPTED HEALTHCARE PROTOCOL</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
              <button   
                onClick={resetState}
                className="flex items-center gap-2 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-400 transition-colors border border-neutral-700"
              >
                  <RotateCcw size={12}/> Reset System
              </button>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 border-l border-neutral-800 pl-6">
                <Activity size={14} className="text-emerald-500" />
                <span className="hidden sm:inline">SECURE ENCLAVE ACTIVE</span>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient */}
        <div className="lg:col-span-3 flex flex-col gap-6">
             <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Admission
             </div>
             <div className="h-[400px]">
                <AgentCard 
                    role={AgentRole.PATIENT} 
                    data={dataPatient} 
                    isProcessing={agentStatus[AgentRole.PATIENT].includes("...")}
                    statusMessage={agentStatus[AgentRole.PATIENT]}
                    onAction={(a, p, t) => handleAction(AgentRole.PATIENT, a, p, t)}
                    scenarioName="Hospital"
                    onUpdateData={handleDataUpdate}
                />
            </div>
        </div>

        {/* Middle Column: Hospital Network */}
        <div className="lg:col-span-6 flex flex-col gap-4">
             <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Hospital Secure Network
             </div>
             
             {/* Hospital Container */}
             <div className="border border-neutral-800 bg-neutral-900/30 rounded-2xl p-4 grid grid-cols-2 gap-4 relative">
                 {/* Decorative Background Lines */}
                 <div className="absolute inset-0 pointer-events-none opacity-10" style={{backgroundImage: 'radial-gradient(circle at center, #10b981 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

                 {/* General Doctor (Full Width) */}
                 <div className="col-span-2 h-[240px]">
                    <AgentCard 
                        role={AgentRole.GENERAL_DOCTOR} 
                        data={dataGenDoc} 
                        isProcessing={agentStatus[AgentRole.GENERAL_DOCTOR].includes("...")}
                        statusMessage={agentStatus[AgentRole.GENERAL_DOCTOR]}
                        onAction={(a, p, t) => handleAction(AgentRole.GENERAL_DOCTOR, a, p, t)}
                        availableOperations={OPS.GENERAL_DOCTOR}
                        onViewManifest={() => setShowManifest(true)}
                    />
                 </div>

                 {/* Middle Row: Lab & Billing */}
                 <div className="h-[240px]">
                    <AgentCard 
                        role={AgentRole.MEDICAL_LAB} 
                        data={dataLab} 
                        isProcessing={agentStatus[AgentRole.MEDICAL_LAB].includes("...")}
                        statusMessage={agentStatus[AgentRole.MEDICAL_LAB]}
                        onAction={(a, p, t) => handleAction(AgentRole.MEDICAL_LAB, a, p, t)}
                        availableOperations={OPS.MEDICAL_LAB}
                    />
                 </div>
                 <div className="h-[240px]">
                    <AgentCard 
                        role={AgentRole.BILLING} 
                        data={dataBilling} 
                        isProcessing={agentStatus[AgentRole.BILLING].includes("...")}
                        statusMessage={agentStatus[AgentRole.BILLING]}
                        onAction={(a, p, t) => handleAction(AgentRole.BILLING, a, p, t)}
                        availableOperations={OPS.BILLING}
                    />
                 </div>

                 {/* Bottom Row: Specialist & Human Doctor */}
                 <div className="h-[240px]">
                    <AgentCard 
                        role={AgentRole.SPECIALIST} 
                        data={dataSpecialist} 
                        isProcessing={agentStatus[AgentRole.SPECIALIST].includes("...")}
                        statusMessage={agentStatus[AgentRole.SPECIALIST]}
                        onAction={(a, p, t) => handleAction(AgentRole.SPECIALIST, a, p, t)}
                        availableOperations={OPS.SPECIALIST}
                    />
                 </div>
                 <div className="h-[240px]">
                    <AgentCard 
                        role={AgentRole.HUMAN_DOCTOR} 
                        data={dataHumanDoc} 
                        isProcessing={agentStatus[AgentRole.HUMAN_DOCTOR].includes("...")}
                        statusMessage={agentStatus[AgentRole.HUMAN_DOCTOR]}
                        onAction={(a, p, t) => handleAction(AgentRole.HUMAN_DOCTOR, a, p, t)}
                        availableOperations={OPS.HUMAN_DOCTOR}
                    />
                 </div>

             </div>
        </div>

        {/* Right Column: Logs */}
        <div className="lg:col-span-3 flex flex-col h-[85vh]">
             <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neutral-500"></span> Audit Trail
             </div>
             <ProtocolLog logs={logs} />
        </div>

      </main>
    </div>
  );
}