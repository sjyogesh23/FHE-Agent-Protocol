import React from 'react';
import { AgentRole, FheValue, EncryptionState, ScenarioStep, PatientVitals } from '../types';
import { Lock, Unlock, Server, Laptop, Cpu, ShieldCheck, ChevronRight, FileJson, Bot, Network, Microscope, FileCheck, Stethoscope, TestTube, Receipt, UserCheck, Activity } from 'lucide-react';
import EncryptionVisualizer from './EncryptionVisualizer';

interface AgentCardProps {
  role: AgentRole;
  data: FheValue | null;
  isProcessing: boolean;
  onAction?: (action: string, payload?: any, target?: AgentRole) => void;
  statusMessage?: string;
  availableOperations?: ScenarioStep[];
  scenarioName?: string;
  onViewManifest?: () => void;
  onUpdateData?: (newData: PatientVitals) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ role, data, isProcessing, onAction, statusMessage, availableOperations, scenarioName, onViewManifest, onUpdateData }) => {
  const isPatient = role === AgentRole.PATIENT;

  const getVisualizerLabel = () => {
    if (role === AgentRole.BILLING) return 'ESTIMATED COST ($)';
    if (data?.state === EncryptionState.DECRYPTED || data?.state === EncryptionState.PROCESSED) {
        return 'URGENCY INDEX';
    }
    return 'SYMPTOM DATA';
  };

  const showDecryptButton = isPatient && data && (data.state === EncryptionState.PROCESSED || data.state === EncryptionState.ENCRYPTED);
  const showInputForm = isPatient && data && data.state === EncryptionState.PLAINTEXT;

  // --- Theme Configuration ---
  let theme = {
      border: 'border-neutral-800',
      ring: 'ring-blue-500/50',
      headerBg: 'bg-neutral-900',
      iconBg: 'bg-neutral-800 text-neutral-400',
      text: 'text-neutral-400',
      icon: <Server size={20} />,
      name: 'Agent',
      id: '0x00...00',
      description: 'Generic Node'
  };

  switch (role) {
      case AgentRole.PATIENT:
          theme = {
              border: 'border-blue-900/30',
              ring: 'ring-blue-500/50',
              headerBg: 'bg-blue-950/20',
              iconBg: 'bg-blue-500/10 text-blue-400',
              text: 'text-blue-400',
              icon: <Laptop size={20} />,
              name: 'Patient (Agent A)',
              id: '0x7F...A1',
              description: 'Data Owner'
          };
          break;
      case AgentRole.GENERAL_DOCTOR:
          theme = {
              border: 'border-emerald-900/30',
              ring: 'ring-emerald-500/50',
              headerBg: 'bg-emerald-950/20',
              iconBg: 'bg-emerald-500/10 text-emerald-400',
              text: 'text-emerald-400',
              icon: <Stethoscope size={20} />,
              name: 'General Doctor (Agent B)',
              id: '0x9B...C4',
              description: 'Triage & Referrals'
          };
          break;
      case AgentRole.SPECIALIST:
          theme = {
              border: 'border-purple-900/30',
              ring: 'ring-purple-500/50',
              headerBg: 'bg-purple-950/20',
              iconBg: 'bg-purple-500/10 text-purple-400',
              text: 'text-purple-400',
              icon: <Bot size={20} />,
              name: 'Specialist Physician (Agent C)',
              id: '0x2A...99',
              description: 'AI Diagnostics'
          };
          break;
      case AgentRole.MEDICAL_LAB:
          theme = {
              border: 'border-yellow-900/30',
              ring: 'ring-yellow-500/50',
              headerBg: 'bg-yellow-950/20',
              iconBg: 'bg-yellow-500/10 text-yellow-400',
              text: 'text-yellow-400',
              icon: <TestTube size={20} />,
              name: 'Medical Lab (Agent D)',
              id: '0xD4...11',
              description: 'FHE Analysis'
          };
          break;
      case AgentRole.BILLING:
          theme = {
              border: 'border-teal-900/30',
              ring: 'ring-teal-500/50',
              headerBg: 'bg-teal-950/20',
              iconBg: 'bg-teal-500/10 text-teal-400',
              text: 'text-teal-400',
              icon: <Receipt size={20} />,
              name: 'Billing (Agent E)',
              id: '0xE5...88',
              description: 'Private Calculation'
          };
          break;
      case AgentRole.HUMAN_DOCTOR:
          theme = {
              border: 'border-red-900/30',
              ring: 'ring-red-500/50',
              headerBg: 'bg-red-950/20',
              iconBg: 'bg-red-500/10 text-red-400',
              text: 'text-red-400',
              icon: <UserCheck size={20} />,
              name: 'Human Doctor',
              id: '0xH1...00',
              description: 'Final Approval'
          };
          break;
  }

  // --- Input Change Handler ---
  const handleVitalsChange = (field: keyof PatientVitals, val: number) => {
      if (data && onUpdateData) {
          const currentVitals = data.rawValue as PatientVitals;
          onUpdateData({ ...currentVitals, [field]: val });
      }
  };

  return (
    <div className={`relative flex flex-col h-full bg-neutral-900 border ${theme.border} rounded-xl overflow-hidden transition-all duration-500 ${isProcessing ? `ring-2 ${theme.ring}` : ''} shadow-xl`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b border-neutral-800 flex items-center justify-between ${theme.headerBg} shrink-0`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${theme.iconBg}`}>
            {theme.icon}
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                {theme.name}
                <span className={`text-[9px] px-1.5 py-0.5 rounded border border-white/10 bg-black/20 font-mono font-normal opacity-70`}>{theme.description}</span>
            </h2>
            <p className="text-[10px] text-neutral-500 font-mono">{theme.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {role === AgentRole.GENERAL_DOCTOR && (
                <button onClick={onViewManifest} className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-[10px] text-neutral-400 font-mono border border-neutral-700 transition-colors" title="View Manifest">
                    <FileJson size={10} />
                </button>
            )}
            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 flex flex-col gap-4 relative overflow-y-auto">
        
        {/* Status Display */}
        {statusMessage && (
            <div className="absolute top-2 right-4 text-[10px] font-mono text-neutral-500 animate-fade-in opacity-70 bg-black/50 px-2 py-1 rounded">
                &gt; {statusMessage}
            </div>
        )}

        {/* Data Visualization / Inputs */}
        <div className="flex-1 flex flex-col items-center justify-start min-h-[180px] bg-neutral-950/30 rounded-xl p-3 transition-all shrink-0 border border-neutral-800/50">
          {!data ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-500">
              <p className="mb-2 text-xs">Waiting for data...</p>
              {isPatient && (
                <button 
                    onClick={() => onAction?.('CREATE_DATA')}
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  <Activity size={14}/> Admit Patient
                </button>
              )}
            </div>
          ) : (
            <div className="w-full max-w-sm flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">FHE State</span>
                    {data.state === EncryptionState.ENCRYPTED || data.state === EncryptionState.PROCESSED ? (
                        <div className="flex items-center gap-1 text-orange-400 text-[9px] font-bold px-1.5 py-0.5 bg-orange-950/30 rounded border border-orange-900/50">
                            <Lock size={8} /> ENCRYPTED
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-green-400 text-[9px] font-bold px-1.5 py-0.5 bg-green-950/30 rounded border border-green-900/50">
                            <Unlock size={8} /> PLAINTEXT
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col justify-start mb-2">
                    {/* Render Input Form if Patient & Plaintext */}
                    {showInputForm ? (
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 font-mono animate-in fade-in">
                            <div className="flex flex-col gap-1">
                                <label>Heart Rate (BPM)</label>
                                <input 
                                    type="number" 
                                    value={(data.rawValue as PatientVitals).heartRate} 
                                    onChange={(e) => handleVitalsChange('heartRate', Number(e.target.value))}
                                    className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label>SpO2 (%)</label>
                                <input 
                                    type="number" 
                                    value={(data.rawValue as PatientVitals).oxygenSat} 
                                    onChange={(e) => handleVitalsChange('oxygenSat', Number(e.target.value))}
                                    className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label>Temp (°C)</label>
                                <input 
                                    type="number" 
                                    value={(data.rawValue as PatientVitals).temperature} 
                                    onChange={(e) => handleVitalsChange('temperature', Number(e.target.value))}
                                    className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label>Systolic (mmHg)</label>
                                <input 
                                    type="number" 
                                    value={(data.rawValue as PatientVitals).systolic} 
                                    onChange={(e) => handleVitalsChange('systolic', Number(e.target.value))}
                                    className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2 flex flex-col gap-1 mt-1">
                                <label>Symptom Severity (0-100)</label>
                                <input 
                                    type="range" 
                                    min="0" max="100"
                                    value={(data.rawValue as PatientVitals).symptomSeverity} 
                                    onChange={(e) => handleVitalsChange('symptomSeverity', Number(e.target.value))}
                                    className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="text-right text-xs text-blue-400 font-bold">{(data.rawValue as PatientVitals).symptomSeverity}</div>
                            </div>
                        </div>
                    ) : (
                        // Otherwise use the visualizer
                        <EncryptionVisualizer 
                            value={data.rawValue} 
                            state={data.state}
                            maxValue={100} 
                            label={getVisualizerLabel()}
                        />
                    )}
                </div>

                {/* Agent Actions */}
                {!isPatient && (
                    <div className="mt-auto grid grid-cols-1 gap-2 animate-in slide-in-from-bottom-2">
                        {availableOperations ? (
                            availableOperations.map((op, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => onAction?.(op.operation, op.value, op.target)} 
                                    className={`p-2 rounded text-[10px] font-mono transition-colors flex items-center justify-between group border bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300`}
                                >
                                    <span className="flex items-center gap-2">
                                        {op.operation === 'DELEGATE' ? <Network size={12}/> : (op.operation === 'INFERENCE' ? <Cpu size={12}/> : <ShieldCheck size={12}/>)} 
                                        {op.label}
                                    </span>
                                    <span className={`opacity-50 group-hover:opacity-100 transition-opacity text-[9px]`}>{op.description}</span>
                                </button>
                            ))
                        ) : (
                            <div className="text-[10px] text-neutral-500 text-center mb-2">Process Complete</div>
                        )}
                        
                        {role !== AgentRole.HUMAN_DOCTOR && role !== AgentRole.GENERAL_DOCTOR && role !== AgentRole.BILLING && (
                             <button onClick={() => onAction?.('SEND_BACK')} className="mt-1 p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-[10px] font-mono text-white transition-colors flex items-center justify-center gap-2">
                                Return to Hospital Net
                            </button>
                        )}
                    </div>
                )}

                 {/* Patient Actions */}
                 {isPatient && (
                     <div className="mt-auto space-y-2">
                        {data.state === EncryptionState.PLAINTEXT && (
                             <button onClick={() => onAction?.('ENCRYPT')} className="w-full p-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-lg transition-all flex items-center justify-center gap-2 group">
                                <Lock size={12} className="group-hover:scale-110 transition-transform" />
                                Encrypt & Submit to Hospital
                             </button>
                        )}
                        
                        {/* Delegation Panel */}
                        {data.state === EncryptionState.ENCRYPTED && (
                            <div className="grid grid-cols-1 gap-2">
                                <button onClick={() => onAction?.('DELEGATE', null, AgentRole.GENERAL_DOCTOR)} className="p-3 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 rounded flex items-center justify-center gap-2 text-xs text-emerald-300 transition-all">
                                    <Stethoscope size={16} /> Send to General Doctor (Triage)
                                </button>
                            </div>
                        )}

                        {/* Decrypt Button */}
                        {showDecryptButton && (
                            <button onClick={() => onAction?.('DECRYPT')} className="w-full p-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded shadow-lg transition-all flex items-center justify-center gap-2 group">
                                <Unlock size={12} className="group-hover:scale-110 transition-transform" />
                                {data.state === EncryptionState.PROCESSED ? 'Decrypt Results' : 'Decrypt (Verify)'}
                            </button>
                        )}
                     </div>
                 )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentCard;