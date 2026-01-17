import { PatientVitals } from '../types';

const COHERE_API_KEY = (import.meta as any).env?.VITE_COHERE_API_KEY || '';

interface CohereResponse {
  text: string;
  generations: Array<{ text: string }>;
}

// Agent B: General Doctor - Generate bill based on patient vitals
export const generateGeneralDoctorBill = async (vitals: PatientVitals): Promise<{ bill: number; analysis: string }> => {
  try {
    console.log('[COHERE-B] Input Vitals:', vitals);
    
    const prompt = `As a medical billing expert, analyze these patient vitals and generate a consultation bill in USD for a General Doctor (Triage) visit.

Patient Vitals:
- Heart Rate: ${vitals.heartRate} BPM
- Blood Pressure: ${vitals.systolic}/${vitals.diastolic} mmHg
- Temperature: ${vitals.temperature}°C
- Oxygen Saturation: ${vitals.oxygenSat}%
- Symptom Severity: ${vitals.symptomSeverity}/100

Generate a reasonable bill amount (between $50-$300) and provide brief analysis in format:
BILL: $[amount]
ANALYSIS: [brief 1-2 line analysis]`;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error('Cohere API error');
    
    const data: CohereResponse = await response.json();
    const text = data.text || (data.generations?.[0]?.text || '');
    
    const billMatch = text.match(/BILL:\s*\$(\d+)/);
    const bill = billMatch ? parseInt(billMatch[1]) : 150;
    
    console.log('[COHERE-B] Output:', { bill, analysis: text });
    
    return { bill, analysis: text };
  } catch (error) {
    console.error('[COHERE-B] Error:', error);
    return { bill: 150, analysis: 'General Doctor Consultation (Triage)' };
  }
};

// Agent D: Medical Lab - Analyze biomarkers and generate bill
export const generateLabAnalysisBiomarkers = async (vitals: PatientVitals): Promise<{ biomarkers: Record<string, number>; bill: number; analysis: string }> => {
  try {
    console.log('[COHERE-D] Input Vitals:', vitals);
    
    const prompt = `As a clinical pathologist, analyze these patient vitals and generate biomarker test results and lab bill in USD.

Patient Vitals:
- Heart Rate: ${vitals.heartRate} BPM
- Blood Pressure: ${vitals.systolic}/${vitals.diastolic} mmHg
- Temperature: ${vitals.temperature}°C
- Oxygen Saturation: ${vitals.oxygenSat}%
- Symptom Severity: ${vitals.symptomSeverity}/100

Generate realistic biomarker values (0-100 scale) and lab bill in format:
BIOMARKERS: Hemoglobin=[value], WBC=[value], Glucose=[value], Creatinine=[value]
BILL: $[amount]
ANALYSIS: [brief analysis]`;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error('Cohere API error');
    
    const data: CohereResponse = await response.json();
    const text = data.text || (data.generations?.[0]?.text || '');
    
    const billMatch = text.match(/BILL:\s*\$(\d+)/);
    const bill = billMatch ? parseInt(billMatch[1]) : 200;
    
    const biomarkers = {
      hemoglobin: 75 + Math.random() * 20,
      wbc: 60 + Math.random() * 25,
      glucose: 70 + Math.random() * 25,
      creatinine: 65 + Math.random() * 30
    };
    
    console.log('[COHERE-D] Output:', { biomarkers, bill, analysis: text });
    
    return { biomarkers, bill, analysis: text };
  } catch (error) {
    console.error('[COHERE-D] Error:', error);
    return { 
      biomarkers: { hemoglobin: 85, wbc: 70, glucose: 85, creatinine: 75 }, 
      bill: 200, 
      analysis: 'Medical Lab Analysis' 
    };
  }
};

// Agent C: Specialist - Provide diagnosis and generate bill
export const generateSpecialistDiagnosis = async (vitals: PatientVitals, labResults?: Record<string, number>): Promise<{ diagnosis: string; bill: number; severity: number }> => {
  try {
    console.log('[COHERE-C] Input:', { vitals, labResults });
    
    const labContext = labResults ? `Lab Results: ${JSON.stringify(labResults)}` : 'No lab results available';
    
    const prompt = `As a specialist physician, analyze these patient parameters and provide diagnosis and consultation bill.

Patient Vitals:
- Heart Rate: ${vitals.heartRate} BPM
- Blood Pressure: ${vitals.systolic}/${vitals.diastolic} mmHg
- Temperature: ${vitals.temperature}°C
- Oxygen Saturation: ${vitals.oxygenSat}%
- Symptom Severity: ${vitals.symptomSeverity}/100

${labContext}

Provide diagnosis and bill in format:
DIAGNOSIS: [brief diagnosis]
BILL: $[amount]
SEVERITY: [0-100]`;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error('Cohere API error');
    
    const data: CohereResponse = await response.json();
    const text = data.text || (data.generations?.[0]?.text || '');
    
    const billMatch = text.match(/BILL:\s*\$(\d+)/);
    const bill = billMatch ? parseInt(billMatch[1]) : 250;
    
    const severityMatch = text.match(/SEVERITY:\s*(\d+)/);
    const severity = severityMatch ? parseInt(severityMatch[1]) : 65;
    
    console.log('[COHERE-C] Output:', { diagnosis: text, bill, severity });
    
    return { diagnosis: text, bill, severity };
  } catch (error) {
    console.error('[COHERE-C] Error:', error);
    return { diagnosis: 'Specialist Consultation', bill: 250, severity: 65 };
  }
};

// Human Doctor: Provide final severity score and add $10 fee
export const generateHumanDoctorReview = async (vitals: PatientVitals, previousSeverity: number): Promise<{ finalSeverity: number; bill: number; approval: string }> => {
  try {
    console.log('[COHERE-HUMAN] Input:', { vitals, previousSeverity });
    
    const prompt = `As a human physician, review these parameters and provide final severity assessment (0-100) considering all previous evaluations.

Patient Vitals:
- Heart Rate: ${vitals.heartRate} BPM
- Blood Pressure: ${vitals.systolic}/${vitals.diastolic} mmHg
- Temperature: ${vitals.temperature}°C
- Oxygen Saturation: ${vitals.oxygenSat}%
- Symptom Severity: ${vitals.symptomSeverity}/100
- Previous Specialist Severity: ${previousSeverity}

Provide final assessment in format:
FINAL_SEVERITY: [0-100]
APPROVAL: [Approved/Conditional/Needs More Info]`;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error('Cohere API error');
    
    const data: CohereResponse = await response.json();
    const text = data.text || (data.generations?.[0]?.text || '');
    
    const severityMatch = text.match(/FINAL_SEVERITY:\s*(\d+)/);
    const finalSeverity = severityMatch ? parseInt(severityMatch[1]) : previousSeverity;
    const bill = 10; // Fixed human doctor fee
    
    console.log('[COHERE-HUMAN] Output:', { finalSeverity, bill, approval: text });
    
    return { finalSeverity, bill, approval: text };
  } catch (error) {
    console.error('[COHERE-HUMAN] Error:', error);
    return { finalSeverity: previousSeverity, bill: 10, approval: 'Human Doctor Review' };
  }
};
