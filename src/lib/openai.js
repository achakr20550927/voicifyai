import OpenAI from 'openai';

export const fileStore = { currentFile: null };

function float32ToWav(channelData, sampleRate) {
  const length = channelData.length * 2;
  const bufferWav = new ArrayBuffer(44 + length);
  const view = new DataView(bufferWav);
  
  let offset = 0;
  const setUint16 = (data) => { view.setUint16(offset, data, true); offset += 2; };
  const setUint32 = (data) => { view.setUint32(offset, data, true); offset += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(36 + length); 
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16); 
  setUint16(1); // PCM
  setUint16(1); // Mono
  setUint32(sampleRate);
  setUint32(sampleRate * 2); 
  setUint16(2); 
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data"
  setUint32(length);

  let pos = 0;
  while (pos < channelData.length) {
    let sample = channelData[pos];
    sample = Math.max(-1, Math.min(1, sample)); 
    sample = sample < 0 ? sample * 32768 : sample * 32767; 
    view.setInt16(44 + pos * 2, sample, true);
    pos++;
  }

  return new Blob([view], { type: "audio/wav" });
}

export async function transcribeAudio(audioFile, onProgress) {
  const GROQ_KEY = localStorage.getItem('groq_audio_key') || '';
  if (!GROQ_KEY) {
    throw new Error("Groq API Key is required for audio transcription.");
  }

  const openai = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: GROQ_KEY,
    dangerouslyAllowBrowser: true
  });

  const executeWithRetry = async (fileObj) => {
    let success = false;
    let retries = 0;
    while (!success) {
      try {
        const response = await openai.audio.transcriptions.create({
          file: fileObj,
          model: "whisper-large-v3",
        });
        return response?.text;
      } catch (err) {
        if (String(err).includes('429') && retries < 10) {
          retries++;
          const waitMatch = err.message.match(/try again in (?:([\d.]+)h)?(?:([\d.]+)m)?(?:([\d.]+)s)?/);
          let waitSec = 30; 
          if (waitMatch) {
            const hrs = parseFloat(waitMatch[1] || 0);
            const mins = parseFloat(waitMatch[2] || 0);
            const secs = parseFloat(waitMatch[3] || 0);
            waitSec = (hrs * 3600) + (mins * 60) + secs + 2;
          }
          if (waitSec > 1800) {
             throw new Error(`Rate limit exhausted. Wait ${Math.ceil(waitSec / 60)}m.`);
          }
          if (onProgress) {
            onProgress({ status: `Cooling down (${Math.ceil(waitSec)}s)...`, addSeconds: Math.ceil(waitSec) });
            await new Promise(r => setTimeout(r, waitSec * 1000));
          } else {
            await new Promise(r => setTimeout(r, waitSec * 1000));
          }
        } else {
          throw err;
        }
      }
    }
  };

  try {
    const arrayBuffer = await audioFile.arrayBuffer();
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await actx.decodeAudioData(arrayBuffer);
    const targetSampleRate = 16000;
    const speedFactor = 2.0;
    const newDuration = audioBuffer.duration / speedFactor;
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(newDuration * targetSampleRate), targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speedFactor; 
    source.connect(offlineCtx.destination);
    source.start();
    const resampledBuffer = await offlineCtx.startRendering();
    const channelData = resampledBuffer.getChannelData(0);
    const CHUNK_SEC = 5 * 60; 
    const samplesPerChunk = CHUNK_SEC * targetSampleRate;
    const totalChunks = Math.ceil(channelData.length / samplesPerChunk);
    
    if (onProgress) onProgress({ status: "Slicing blocks...", progress: 10, setTotalSeconds: Math.ceil((totalChunks * 3.5) + 45) });

    let transcriptions = [];
    for (let i = 0; i < channelData.length; i += samplesPerChunk) {
      const chunkData = channelData.subarray(i, i + samplesPerChunk);
      const fileObj = new File([float32ToWav(chunkData, targetSampleRate)], `chunk-${i}.wav`, { type: 'audio/wav' });
      const text = await executeWithRetry(fileObj);
      if (text) transcriptions.push(text.trim());
      if (onProgress) onProgress({ status: `Processing ${Math.floor(i/samplesPerChunk)+1}/${totalChunks}...`, progress: 10 + (i/channelData.length)*80 });
    }
    return transcriptions.join(" ");
  } catch (error) {
    // Fallback binary slicing if WebAudio fails
    const MAX_CHUNK_SIZE = 12 * 1024 * 1024;
    let transcriptions = []; 
    for (let offset = 0; offset < audioFile.size; offset += MAX_CHUNK_SIZE) {
      const chunkBlob = audioFile.slice(offset, offset + MAX_CHUNK_SIZE);
      const fileObj = new File([chunkBlob], `chunk-${offset}.mp3`, { type: 'audio/mp3' });
      const text = await executeWithRetry(fileObj);
      if (text) transcriptions.push(text.trim());
    }
    return transcriptions.join(" ");
  }
}

export async function generateExecutionPlan(inputText, existingPlan = null) {
  const API_KEY = localStorage.getItem('openrouter_key') || '';
  const model = localStorage.getItem('openrouter_model') || 'openai/gpt-4o-mini';

  const prompt = `GOAL: Generate a high-density, multi-layered strategic blueprint from the provided input.
ANALYSIS PASSES (must follow):
1. Extract entities (people, organizations, projects, locations) as they appear in INPUT DATA. Keep exact spellings.
2. Entity grounding: For any field that looks like a proper name (e.g., stakeholder "name", task/decision owner names), DO NOT invent. Use it only if it appears in INPUT DATA. Otherwise set to null (or use a role/title like "Ops Lead").
3. Blueprint synthesis: Build SOP + tasks from the extracted entities and the described objectives.
QUALITY GATES (must meet all):
- detailedSummary must be 12-15 paragraphs and include at least 6 markdown headers (### ...).
- sop must include 7-10 phases; each description must be 6-8 sentences and read like a real SOP.
- tasks must include 14-20 actions; each must include description, owner, priority, due, and dependencies.
- stakeholders must include 4-6 roles; responsibility must be 3-4 sentences; deliverable must be concrete.
  - stakeholder "name" must be either an exact grounded name from INPUT DATA OR null (no hallucinated names).
- keyDecisions must include 5-8 decisions with tradeoffs and time horizon.
- riskAssessment must include 5-8 risks with mitigation, trigger, and detection signals.
REQUIRED: VALID JSON ONLY. NO PREAMBLE.

SCHEMA:
{
  "title": "Clear executive title",
  "summary": "2-sentence executive overview",
  "detailedSummary": "12-15 paragraphs of deep-dive analytical summary (750-1200+ words). Use markdown headers (### ...) and professional executive terminology. Include bullet points for technical nuances, risks, and metrics.",
  "mermaidChart": "Minified Mermaid graph TD string (escape all inner quotes). Include at least 10 nodes connected across 3+ layers that map to SOP phases, key decisions, and risks. Use a minimalist neutral theme: node fill '#111827', node stroke '#374151', text '#f8fafc', edges '#64748b'. Avoid any bright/saturated colors. Prefer using Mermaid classDef / style for consistency.",
  "strategicVisualNodes": [{"id": "n1", "label": "Pillar", "value": 70, "connections": [], "x": 50, "y": 50, "type": "pillar"}],
  "stakeholders": [{"role": "Role", "name": "Extract exact grounded name from INPUT DATA verbatim; if no explicit name is present, set null (never invent proper nouns).", "responsibility": "3-4 sentences describing accountability and decision authority.", "deliverable": "1-2 sentences describing the concrete output you expect."}],
  "sop": [{"title": "Phase 1", "description": "6-8 sentences. Include: Inputs -> Actions -> Expected Outputs -> Owner -> Quality Checks."}],
  "tasks": [{"id": 1, "title": "Action", "category": "Strategy|Ops|Tech|People|Finance|Legal", "description": "2-4 sentences describing execution detail, artifacts produced, and success criteria.", "owner": "If a real person name is explicitly present in INPUT DATA, use it verbatim; otherwise use a role title (e.g., 'Ops Lead').", "priority": "HIGH|MEDIUM|LOW", "due": "YYYY-MM-DD (or 'Week X')", "dependencies": [1,2], "completed": false}],
  "keyDecisions": [{"decision": "Decision", "rationale": "3-5 sentences including tradeoffs and assumptions.", "impact": "Specific measurable impact and time horizon.", "alternatives": "2-3 alternatives considered and why rejected.", "decisionOwner": "Use only grounded names from INPUT DATA; otherwise use a role title."}],
  "riskAssessment": [{"risk": "Risk", "impact": "HIGH|MEDIUM|LOW", "mitigation": "2-4 sentences including prevention and contingency.", "trigger": "Specific trigger condition that indicates the risk is becoming real.", "detectionSignals": "What to monitor (signals/metrics) and threshold."}],
  "efficiencyScore": 95,
  "hoursSaved": "5.0"
}

INPUT DATA:
"""
${typeof inputText === 'string' ? inputText.substring(0, 10000) : JSON.stringify(inputText).substring(0, 10000)}
"""

${existingPlan ? `REFINE EXISTING: ${JSON.stringify(existingPlan).substring(0, 5000)}\nINSTRUCTION: ${inputText}` : 'CREATE NEW BLUEPRINT FROM SCRATCH.'}`;

  const textLen = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().length : 0);
  const validateExecutionPlanQuality = (plan) => {
    const issues = [];
    if (!plan || typeof plan !== 'object') return ['Plan is not a JSON object.'];

    if (textLen(plan.detailedSummary) < 900) issues.push(`detailedSummary too short (${textLen(plan.detailedSummary)} chars)`);
    if (!Array.isArray(plan.sop) || plan.sop.length < 7) issues.push(`sop too short (count=${Array.isArray(plan.sop) ? plan.sop.length : 0})`);
    if (Array.isArray(plan.sop)) {
      const shortStep = plan.sop.find(s => textLen(s?.description) < 120);
      if (shortStep) issues.push('Some sop.description entries are too short');
    }

    if (!Array.isArray(plan.tasks) || plan.tasks.length < 14) issues.push(`tasks too short (count=${Array.isArray(plan.tasks) ? plan.tasks.length : 0})`);
    if (Array.isArray(plan.tasks)) {
      const shortTask = plan.tasks.find(t => textLen(t?.description) < 60);
      if (shortTask) issues.push('Some tasks.description entries are too short');
    }

    if (!Array.isArray(plan.keyDecisions) || plan.keyDecisions.length < 5) issues.push(`keyDecisions too short (count=${Array.isArray(plan.keyDecisions) ? plan.keyDecisions.length : 0})`);
    if (!Array.isArray(plan.riskAssessment) || plan.riskAssessment.length < 5) issues.push(`riskAssessment too short (count=${Array.isArray(plan.riskAssessment) ? plan.riskAssessment.length : 0})`);

    return issues;
  };

  const repairExecutionPlanQuality = async (previousPlan, qualityIssues) => {
    const repairPrompt = `YOU MUST RETURN VALID JSON ONLY.
QUALITY FAILURES:
${qualityIssues.map(i => `- ${i}`).join('\n')}

INSTRUCTIONS:
- Expand ONLY the failing sections to meet the quality bar.
- Keep the same overall JSON schema.
- Do not remove existing fields unless invalid; prefer expanding content.
- Return JSON only (no markdown, no preamble).

PREVIOUS_JSON:
${JSON.stringify(previousPlan).substring(0, 12000)}

INPUT_DATA (for context):
${typeof inputText === 'string' ? inputText.substring(0, 8000) : JSON.stringify(inputText).substring(0, 8000)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Founder OS"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "You are a Strategic Data Architect. You ONLY output valid JSON. No conversational text." },
          { role: "user", content: repairPrompt }
        ],
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API Error (repair): ${response.status} - ${err}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    if (content.includes('```')) {
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      const repaired = content
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

      return JSON.parse(repaired);
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Founder OS"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "You are a Strategic Data Architect. You ONLY output valid JSON. No conversational text." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
       const err = await response.text();
       throw new Error(`OpenRouter API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Explicit cleanup for robustness
    if (content.includes('```')) {
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let parsedPlan;
    try {
      parsedPlan = JSON.parse(content);
    } catch (parseError) {
      console.warn("Standard JSON parse failed, attempting repair...", parseError);
      const repaired = content
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

      try {
        parsedPlan = JSON.parse(repaired);
      } catch (secondError) {
        console.error("JSON Repair failed:", secondError);
        throw new Error(`Strategic extraction failed. Output was: ${content.substring(0, 100)}...`);
      }
    }

    const qualityIssues = validateExecutionPlanQuality(parsedPlan);
    if (qualityIssues.length) {
      console.warn('Quality gate failed:', qualityIssues);
      parsedPlan = await repairExecutionPlanQuality(parsedPlan, qualityIssues);
    }

    return parsedPlan;
  } catch (error) {
    console.error("OpenRouter Error:", error);
    throw error;
  }
}
