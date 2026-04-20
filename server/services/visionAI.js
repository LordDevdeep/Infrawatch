/**
 * INFRAWATCH Vision AI Engine
 *
 * Primary: Google Gemini 2.0 Flash (via @google/generative-ai SDK + AI Studio API key)
 * Fallback: Groq Llama 4 Scout Vision (only used if Gemini rate-limits)
 */

const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GEMINI_VISION_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getProviderConfig() {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  // Default: Gemini first (Google AI Studio — free, no credit card needed)
  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    return { provider: 'gemini', apiKey: process.env.GEMINI_API_KEY, model: GEMINI_VISION_MODEL };
  }
  if (provider === 'groq' && process.env.GROQ_API_KEY) {
    return { provider: 'groq', apiKey: process.env.GROQ_API_KEY, model: GROQ_VISION_MODEL };
  }
  // Auto-fallback chain if the requested provider isn't configured
  if (process.env.GEMINI_API_KEY) {
    return { provider: 'gemini', apiKey: process.env.GEMINI_API_KEY, model: GEMINI_VISION_MODEL };
  }
  if (process.env.GROQ_API_KEY) {
    return { provider: 'groq', apiKey: process.env.GROQ_API_KEY, model: GROQ_VISION_MODEL };
  }
  throw new Error('No AI provider configured. Set GEMINI_API_KEY (preferred) or GROQ_API_KEY.');
}

/**
 * Returns true if an error looks like a quota/rate-limit/unavailable error
 * that would benefit from failover to another provider.
 */
function isRetryableProviderError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('rate-limit') ||
    msg.includes('resource has been exhausted') ||
    msg.includes('too many requests') ||
    msg.includes('503') ||
    msg.includes('service unavailable') ||
    msg.includes('unavailable')
  );
}

/**
 * Direct Gemini call (used both as primary and after Groq fallback attempts).
 */
async function rawGeminiCall(prompt, imageDataUrls = []) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  const parts = [prompt];
  for (const dataUrl of imageDataUrls) {
    if (dataUrl) {
      const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    }
  }

  const result = await model.generateContent(parts);
  const text = result.response.text()?.trim();
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

/**
 * Direct Groq call (OpenAI-compatible API).
 * Handles both vision (with images) and text-only.
 */
async function rawGroqCall(prompt, imageDataUrls = []) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
  const hasImages = imageDataUrls.filter(Boolean).length > 0;
  const model = hasImages
    ? GROQ_VISION_MODEL
    : (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile');

  const content = hasImages
    ? [
        { type: 'text', text: prompt },
        ...imageDataUrls.filter(Boolean).map(url => ({ type: 'image_url', image_url: { url } })),
      ]
    : prompt;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API ${response.status}: ${errBody.substring(0, 300)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from Groq');
  return text;
}

/**
 * Shared dispatcher used by ALL AI calls (vision + text).
 *
 * Flow:
 *   1. Try configured primary provider (default: Gemini)
 *   2. If it fails with a retryable error (rate-limit / quota / 5xx), and the
 *      OTHER provider is configured, silently fall back and retry
 *   3. Log which provider answered so we can see it in server logs
 */
async function callAI(prompt, imageDataUrls = []) {
  const config = getProviderConfig();
  const primary = config.provider;
  const secondary = primary === 'gemini' ? 'groq' : 'gemini';
  const secondaryConfigured =
    (secondary === 'groq' && !!process.env.GROQ_API_KEY) ||
    (secondary === 'gemini' && !!process.env.GEMINI_API_KEY);

  try {
    const text = primary === 'gemini'
      ? await rawGeminiCall(prompt, imageDataUrls)
      : await rawGroqCall(prompt, imageDataUrls);
    console.log(`[AI] ✓ ${primary} answered`);
    return text;
  } catch (err) {
    if (!secondaryConfigured || !isRetryableProviderError(err)) {
      throw err;
    }
    console.warn(`[AI] ⚠ ${primary} failed (${String(err.message).slice(0, 80)}...) → failing over to ${secondary}`);
    const text = secondary === 'gemini'
      ? await rawGeminiCall(prompt, imageDataUrls)
      : await rawGroqCall(prompt, imageDataUrls);
    console.log(`[AI] ✓ ${secondary} answered (fallback)`);
    return text;
  }
}

/**
 * Legacy wrappers — kept for backward compatibility with the existing exports.
 * Both now route through the same `callAI` dispatcher with auto-fallback.
 */
async function callGroqVision(prompt, imageDataUrls = []) {
  return callAI(prompt, imageDataUrls);
}

async function callTextAI(prompt) {
  return callAI(prompt, []);
}

/**
 * Parse and validate AI response
 */
function parseVisionResponse(rawText, responseType) {
  let cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    console.error('Vision AI response parsing failed. Raw:', rawText.slice(0, 500));
    throw new Error(`Vision AI did not return valid JSON for ${responseType}`);
  }

  const jsonStr = cleaned.slice(start, end + 1);

  try {
    const parsed = JSON.parse(jsonStr);
    const config = getProviderConfig();
    parsed._responseType = responseType;
    parsed._processedAt = new Date().toISOString();
    parsed._model = config.model;
    parsed._provider = config.provider;
    return parsed;
  } catch (err) {
    console.error('JSON parse error:', err.message);
    console.error('Attempted to parse:', jsonStr.slice(0, 500));
    throw new Error(`Failed to parse Vision AI response: ${err.message}`);
  }
}


// ============================================================================
// CORE FEATURES
// ============================================================================

/**
 * CORE FEATURE 1: Real Change Detection
 */
export async function detectConstructionChanges({ beforeImage, afterImage, locationContext }) {
  const prompt = `You are an expert urban planning satellite imagery analyst. Compare these two satellite/aerial images of the same location to detect unauthorized construction changes.

LOCATION CONTEXT:
- Address: ${locationContext?.address || 'Unknown'}
- Ward: ${locationContext?.ward || 'Unknown'}
- Zone: ${locationContext?.zone || 'Unknown'}
- Last Approved Year: ${locationContext?.lastApprovedYear || 'Unknown'}

ANALYSIS TASK:
1. Identify ALL visible structural changes between the before (first image) and after (second image)
2. For each change, estimate the approximate bounding box coordinates (as percentages 0-100 of image width/height)
3. Estimate the construction area in square feet based on typical urban plot scales
4. Classify the type of violation
5. Assess the severity and confidence

RESPOND WITH STRICT JSON ONLY (no markdown):
{
  "changesDetected": true,
  "totalChanges": 2,
  "changes": [
    {
      "id": 1,
      "description": "specific description of what changed",
      "boundingBox": { "x": 20, "y": 30, "width": 25, "height": 20 },
      "estimatedAreaSqFt": 450,
      "estimatedHeightMeters": 3,
      "changeType": "new_construction",
      "severity": "major"
    }
  ],
  "primaryViolationType": "Unauthorized Floor Addition",
  "overallConfidence": 85,
  "totalEstimatedAreaSqFt": 450,
  "visualEvidence": ["observation 1", "observation 2"],
  "analysisNarrative": "2-3 sentence explanation",
  "recommendedAction": "CONFIRM_VIOLATION",
  "riskLevel": "HIGH"
}`;

  const images = [beforeImage?.dataUrl, afterImage?.dataUrl].filter(Boolean);
  const text = await callGroqVision(prompt, images);
  return parseVisionResponse(text, 'changeDetection');
}

/**
 * CORE FEATURE 2: Single Image Analysis
 */
export async function analyzeSingleImage({ image, locationContext }) {
  const prompt = `You are an aggressive urban planning enforcement AI deployed in Bengaluru, India — a city with rampant unauthorized construction. Your job is to FLAG anything suspicious in satellite/aerial imagery. You work for BBMP municipal enforcement.

LOCATION CONTEXT:
- Address: ${locationContext?.address || 'Unknown'}
- Ward: ${locationContext?.ward || 'Unknown'}
- Zone: ${locationContext?.zone || 'Residential'}
- This area has a HIGH violation rate and is under active surveillance.

CRITICAL INSTRUCTIONS:
- You MUST look carefully at EVERY structure in this image.
- Flag ANY of these as potential violations: new construction or ongoing work (raw concrete, scaffolding, excavation), buildings that appear taller than neighbors (possible unauthorized floor additions), structures built very close to roads or boundaries (setback violations), commercial signage or activity in what looks residential, irregular rooftops or extensions, encroachment onto open land or footpaths, buildings without visible plan approval markers.
- In Indian cities, most construction at ground level involves violations. Be proactive.
- If you see ANY buildings, construction activity, or dense structures, you SHOULD flag at least one suspicious area.
- Only report "no violations" if the image shows empty land, water, or farmland with zero structures.

RESPOND WITH STRICT JSON ONLY (no markdown):
{
  "suspiciousAreasDetected": true,
  "totalAreas": 2,
  "detections": [
    {
      "id": 1,
      "description": "what appears suspicious",
      "boundingBox": { "x": 20, "y": 30, "width": 25, "height": 20 },
      "estimatedAreaSqFt": 350,
      "violationLikelihood": 80,
      "potentialViolationType": "floor_addition"
    }
  ],
  "primaryViolationType": "Unauthorized Floor Addition",
  "overallConfidence": 78,
  "totalEstimatedAreaSqFt": 350,
  "visualEvidence": ["observation 1", "observation 2"],
  "analysisNarrative": "explanation of findings",
  "recommendedAction": "FIELD_INSPECTION_NEEDED",
  "riskLevel": "MEDIUM"
}`;

  const images = image?.dataUrl ? [image.dataUrl] : [];
  const text = await callGroqVision(prompt, images);
  return parseVisionResponse(text, 'singleImage');
}

/**
 * CORE FEATURE 3: Generate Evidence Report
 */
export async function generateEvidenceReport({ beforeImage, afterImage, analysisResult, violation }) {
  const prompt = `You are a legal evidence documentation specialist for municipal enforcement. Generate a formal evidence report based on satellite imagery analysis.

CASE DETAILS:
- Violation ID: ${violation?.id || 'N/A'}
- Address: ${violation?.address || 'N/A'}
- Ward: ${violation?.ward || 'N/A'}
- Survey Number: ${violation?.survey_no || 'N/A'}
- Zone: ${violation?.zone || 'N/A'}
- Owner: ${violation?.owner_name || 'N/A'}

AI ANALYSIS RESULTS:
${JSON.stringify(analysisResult, null, 2)}

Generate a formal evidence report in JSON format:
{
  "reportTitle": "Satellite Imagery Evidence Report",
  "caseReference": "${violation?.id || 'N/A'}",
  "generatedAt": "${new Date().toISOString()}",
  "executiveSummary": "2-3 sentence summary for commissioner",
  "detailedFindings": [
    {
      "findingNumber": 1,
      "description": "detailed finding",
      "visualReference": "where in image this is visible",
      "measurementEstimate": "area/height estimate",
      "legalRelevance": "which regulation this violates"
    }
  ],
  "photographicEvidence": {
    "beforeImageAnalysis": "what the before image shows",
    "afterImageAnalysis": "what the after image shows",
    "keyDifferences": ["diff 1", "diff 2"]
  },
  "violationClassification": {
    "primaryType": "violation type",
    "bbmpActSection": "relevant section number",
    "penaltyRange": "estimated penalty range"
  },
  "recommendedEnforcement": {
    "immediateAction": "what to do now",
    "noticeType": "which notice template",
    "escalationPath": "if owner does not comply"
  },
  "certificationStatement": "This analysis was generated by AI and should be verified by field inspection before enforcement action."
}`;

  const images = [beforeImage?.dataUrl, afterImage?.dataUrl].filter(Boolean);

  // Use vision if images available, otherwise text-only
  const text = images.length > 0
    ? await callGroqVision(prompt, images)
    : await callTextAI(prompt);

  return parseVisionResponse(text, 'evidenceReport');
}

/**
 * CORE FEATURE 4: Estimate Penalty from Visual Analysis
 */
export function calculatePenaltyFromAnalysis(analysisResult, zoneType = 'Residential') {
  const baseRatePerSqFt = {
    'Residential (R1)': 150,
    'Residential (R2)': 120,
    'Residential (R3)': 100,
    'Commercial (C-1)': 250,
    'Mixed Use (MU-1)': 180,
  };

  const violationMultiplier = {
    'Unauthorized Floor Addition': 1.5,
    'No Building Permit': 2.0,
    'Encroachment on Public Land': 2.5,
    'Commercial Use in Residential Zone': 1.8,
    'Setback Violation': 1.3,
    'Illegal Basement Construction': 1.6,
  };

  const riskMultiplier = {
    'LOW': 0.8,
    'MEDIUM': 1.0,
    'HIGH': 1.3,
    'CRITICAL': 1.5,
  };

  const baseRate = baseRatePerSqFt[zoneType] || 120;
  const violationType = analysisResult.primaryViolationType || 'No Building Permit';
  const vMult = violationMultiplier[violationType] || 1.0;
  const rMult = riskMultiplier[analysisResult.riskLevel] || 1.0;
  const area = analysisResult.totalEstimatedAreaSqFt || 0;

  const penaltyINR = Math.round(area * baseRate * vMult * rMult);
  const penaltyLakhs = (penaltyINR / 100000).toFixed(2);

  return {
    estimatedAreaSqFt: area,
    baseRatePerSqFt: baseRate,
    violationType,
    violationMultiplier: vMult,
    riskLevel: analysisResult.riskLevel,
    riskMultiplier: rMult,
    calculatedPenaltyINR: penaltyINR,
    calculatedPenaltyLakhs: parseFloat(penaltyLakhs),
    legalBasis: 'BBMP Act Section 321 - Penalty for unauthorized construction',
    formula: `${area} sq.ft × ₹${baseRate}/sq.ft × ${vMult} (violation) × ${rMult} (risk) = ₹${penaltyINR.toLocaleString('en-IN')}`,
  };
}

/**
 * CORE FEATURE 5: Generate AI Legal Notice from Analysis
 */
export async function generateLegalNoticeFromAnalysis({ violation, analysisResult, penaltyCalculation }) {
  const prompt = `You are a legal drafting expert for BBMP municipal enforcement. Generate a formal enforcement notice based on AI satellite imagery analysis.

VIOLATION DETAILS:
- Reference: ${violation.id}
- Owner: ${violation.owner_name || 'Property Owner'}
- Address: ${violation.address}
- Survey No: ${violation.survey_no || 'N/A'}
- Ward: ${violation.ward}
- Zone: ${violation.zone || 'N/A'}

AI ANALYSIS FINDINGS:
- Violation Type: ${analysisResult.primaryViolationType}
- Confidence: ${analysisResult.overallConfidence}%
- Risk Level: ${analysisResult.riskLevel}
- Detected Area: ${analysisResult.totalEstimatedAreaSqFt} sq.ft
- Visual Evidence: ${(analysisResult.visualEvidence || []).join('; ')}

PENALTY CALCULATION:
- Estimated Penalty: Rs ${penaltyCalculation.calculatedPenaltyINR.toLocaleString('en-IN')} (${penaltyCalculation.calculatedPenaltyLakhs} Lakhs)
- Legal Basis: ${penaltyCalculation.legalBasis}
- Calculation: ${penaltyCalculation.formula}

Generate a formal legal notice. Return as JSON:
{
  "noticeType": "First Warning",
  "noticeContent": "Full notice text with proper legal formatting",
  "keyDirectives": ["directive 1", "directive 2"],
  "responseDeadlineDays": 7,
  "escalationWarning": "what happens if not complied"
}`;

  const text = await callTextAI(prompt);
  const parsed = parseVisionResponse(text, 'legalNotice');

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
    caseReference: violation.id,
    issuedTo: violation.owner_name || 'Property Owner',
    propertyAddress: violation.address,
  };
}

/**
 * Validate API configuration
 */
export function validateVisionAPI() {
  try {
    const config = getProviderConfig();
    return {
      isConfigured: true,
      provider: config.provider,
      model: config.model,
      message: `${config.provider} Vision API is configured and ready`,
    };
  } catch {
    return {
      isConfigured: false,
      provider: 'none',
      model: 'none',
      message: 'No AI provider configured - set GROQ_API_KEY or GEMINI_API_KEY',
    };
  }
}

// ============================================================================
// KILLER FEATURES
// ============================================================================

/**
 * AI Chatbot for Violation Q&A
 */
export async function chatWithViolation({ violation, imageData, question, conversationHistory = [], systemContext: ctx }) {
  let promptHeader = `You are INFRAWATCH AI Assistant — an expert urban-planning + municipal-enforcement copilot for Bengaluru's BBMP.

YOU HAVE LIVE READ ACCESS TO THE INFRAWATCH DATABASE. Use the data below to answer questions with specific case IDs, ward names, and numbers — never invent data.`;

  if (ctx) {
    const wardLines = (ctx.topWards || []).map(w => `  • ${w.ward}: ${w.count} active`).join('\n');
    const recentLines = (ctx.recentCases || []).slice(0, 8).map(c =>
      `  • ${c.id} · ${c.type} · ${c.ward} · ${c.status} · ${c.confidence}% · ${c.officer_name || 'unassigned'}`
    ).join('\n');

    promptHeader += `

═══════ LIVE SYSTEM SNAPSHOT ═══════
Total violations in database: ${ctx.totalViolations}
Status breakdown: ${Object.entries(ctx.statusBreakdown || {}).map(([s, n]) => `${s}=${n}`).join(', ')}

TOP WARDS (active cases):
${wardLines || '  (none)'}

10 MOST RECENT CASES:
${recentLines || '  (none)'}
═══════════════════════════════════`;
  }

  if (violation) {
    promptHeader += `

═══ FOCUSED CASE CONTEXT ═══
Case ID: ${violation.id}
Address: ${violation.address}
Ward: ${violation.ward} · Zone: ${violation.zone}
Type: ${violation.type}
Detected: ${violation.detected_date}
Confidence: ${violation.confidence}%
Area: ${violation.area} sq.ft · Penalty: Rs ${violation.penalty}L
Status: ${violation.status} · Owner: ${violation.owner_name}
═══════════════════════════════════`;
  }

  promptHeader += `

GUIDELINES:
- Cite specific case IDs (#IW-XXXX) and ward names from the data above
- Reference BBMP Act sections (esp. Section 321) when discussing penalties
- Keep answers under 4 short paragraphs
- If asked for a count or list, use the live data above — don't make up numbers
- Use bullet points for lists; never use markdown headers (no #)`;

  let prompt = promptHeader;

  if (conversationHistory.length > 0) {
    prompt += '\n\nPREVIOUS CONVERSATION:\n' + conversationHistory.slice(-6).map(m =>
      `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`
    ).join('\n');
  }

  prompt += `\n\nUser Question: ${question}\n\nResponse:`;

  let response;
  if (imageData?.dataUrl) {
    response = await callGroqVision(prompt, [imageData.dataUrl]);
  } else {
    response = await callTextAI(prompt);
  }

  return {
    question,
    answer: response,
    timestamp: new Date().toISOString(),
    hasImage: Boolean(imageData?.dataUrl),
  };
}

/**
 * Multi-Site Batch Analysis
 */
export async function batchAnalyzeLocations({ images, wardContext }) {
  const prompt = `You are an urban planning AI conducting a ward-level construction audit for BBMP Bengaluru.

WARD CONTEXT:
- Ward Name: ${wardContext?.name || 'Unknown Ward'}
- Zone Type: ${wardContext?.zone || 'Mixed'}
- Total Images: ${images.length}

Analyze ALL ${images.length} satellite images provided and identify potential violations in each.

RESPOND WITH JSON:
{
  "wardSummary": {
    "totalLocationsScanned": ${images.length},
    "violationsDetected": 1,
    "criticalCases": 0,
    "estimatedTotalUnauthorizedArea": 500,
    "estimatedTotalPenalty": 100000
  },
  "locations": [
    {
      "imageId": 1,
      "violationDetected": true,
      "violationType": "No Building Permit",
      "severity": "medium",
      "estimatedAreaSqFt": 500,
      "confidence": 75,
      "briefDescription": "one line description",
      "recommendedAction": "field inspection"
    }
  ],
  "prioritizedActions": ["action 1"],
  "wardRiskAssessment": "overall assessment"
}`;

  const imageUrls = images.map(img => img?.dataUrl).filter(Boolean);
  const text = await callGroqVision(prompt, imageUrls);
  return parseVisionResponse(text, 'batchAnalysis');
}

/**
 * Construction Progress Timeline
 */
export async function analyzeConstructionTimeline({ timelineImages, locationContext }) {
  const prompt = `You are a forensic construction analyst. Analyze this timeline of ${timelineImages.length} satellite images showing the same location over time.

LOCATION:
- Address: ${locationContext?.address || 'Unknown'}
- Ward: ${locationContext?.ward || 'Unknown'}
- Zone: ${locationContext?.zone || 'Unknown'}

The images are provided in chronological order (oldest to newest).

RESPOND WITH JSON:
{
  "timelineAnalysis": {
    "totalImagesAnalyzed": ${timelineImages.length},
    "constructionActivityDetected": true,
    "estimatedConstructionStartPeriod": "between image 1 and 2",
    "constructionProgressPercentage": 60,
    "isOngoing": true
  },
  "phases": [
    {
      "phaseNumber": 1,
      "imageRange": "Image 1 to Image 2",
      "description": "what changed",
      "constructionType": "foundation",
      "estimatedDuration": "2 months",
      "areaAdded": 300
    }
  ],
  "violations": {
    "firstVisibleViolation": "Image 2",
    "violationType": "No Building Permit",
    "escalationPattern": "how the violation grew",
    "currentSeverity": "high"
  },
  "enforcement": {
    "optimalInterventionPoint": "Image 2",
    "currentRecommendation": "immediate action",
    "evidenceStrength": "strong",
    "timelineSummary": "narrative"
  },
  "legalImplications": {
    "willfulViolation": true,
    "evidenceOfPremeditation": "explanation",
    "recommendedPenaltyMultiplier": 1.5
  }
}`;

  const imageUrls = timelineImages.map(img => img?.dataUrl).filter(Boolean);
  const text = await callGroqVision(prompt, imageUrls);
  return parseVisionResponse(text, 'timelineAnalysis');
}

/**
 * Predictive Risk Scoring
 */
export async function predictViolationRisk({ image, locationContext, historicalData }) {
  const prompt = `You are a predictive analytics AI for urban planning. Analyze this satellite image and predict the risk of future illegal construction.

LOCATION DATA:
- Address: ${locationContext?.address || 'Unknown'}
- Ward: ${locationContext?.ward || 'Unknown'}
- Zone: ${locationContext?.zone || 'Unknown'}
- Historical Violations in Area: ${historicalData?.nearbyViolations || 0}
- Zone Violation Rate: ${historicalData?.zoneViolationRate || 'Unknown'}%

RESPOND WITH JSON:
{
  "riskAssessment": {
    "overallRiskScore": 65,
    "riskLevel": "MEDIUM",
    "confidenceInPrediction": 70
  },
  "riskFactors": [
    {
      "factor": "factor name",
      "description": "explanation",
      "riskContribution": 30,
      "visualEvidence": "what in the image suggests this"
    }
  ],
  "predictions": {
    "likelihoodOfViolation6Months": 40,
    "likelihoodOfViolation1Year": 60,
    "mostLikelyViolationType": "No Building Permit",
    "estimatedViolationArea": 400,
    "estimatedPenaltyIfViolation": 200000
  },
  "preventiveActions": [
    {
      "action": "recommended action",
      "priority": "high",
      "expectedImpact": "explanation"
    }
  ],
  "monitoringRecommendation": {
    "frequency": "monthly",
    "focusAreas": ["area 1"],
    "alertTriggers": ["trigger 1"]
  }
}`;

  const images = image?.dataUrl ? [image.dataUrl] : [];
  const text = await callGroqVision(prompt, images);
  return parseVisionResponse(text, 'riskPrediction');
}

/**
 * Compliance Report Generator
 */
export async function generateComplianceReport({ violation, images, analysisHistory }) {
  const prompt = `You are a municipal compliance officer AI. Generate a comprehensive compliance report for this violation case.

CASE DETAILS:
${JSON.stringify(violation, null, 2)}

ANALYSIS HISTORY:
${JSON.stringify(analysisHistory || [], null, 2)}

RESPOND WITH JSON:
{
  "reportMetadata": {
    "reportId": "CR-${Date.now()}",
    "generatedAt": "${new Date().toISOString()}",
    "reportType": "Comprehensive Compliance Assessment",
    "classification": "Official Use"
  },
  "executiveSummary": {
    "headline": "one line summary",
    "violationConfirmed": true,
    "severityRating": "HIGH",
    "immediateActionRequired": true,
    "summaryParagraph": "2-3 sentence summary"
  },
  "violationDetails": {
    "primaryViolation": "${violation?.type || 'Unknown'}",
    "secondaryViolations": [],
    "violationTimeline": "when it likely occurred",
    "violationExtent": "description of scope",
    "affectedArea": { "squareFeet": ${violation?.area || 0}, "percentageOfPlot": 30 }
  },
  "legalFramework": {
    "applicableActs": ["BBMP Act Section 321"],
    "violatedSections": ["section 1"],
    "penaltyProvisions": ["provision 1"],
    "precedentCases": ["similar case reference"]
  },
  "evidenceAssessment": {
    "satelliteImageryEvidence": "strong",
    "documentaryEvidence": "moderate",
    "witnessStatements": "not available",
    "overallEvidenceStrength": "strong"
  },
  "financialImpact": {
    "estimatedPenalty": { "minimum": 100000, "maximum": 500000, "recommended": 300000 },
    "demolitionCost": 200000,
    "regularizationFee": 150000,
    "totalLiability": 650000
  },
  "recommendations": {
    "primaryRecommendation": "action",
    "alternativeOptions": ["option 1"],
    "timeline": "recommended timeline",
    "escalationPath": "if non-compliance continues"
  },
  "riskAssessment": {
    "publicSafetyRisk": "medium",
    "structuralRisk": "medium",
    "legalRisk": "high",
    "reputationalRisk": "low"
  },
  "appendices": {
    "imageAnalysisResults": "summary of AI findings",
    "calculationBreakdown": "penalty calculation details",
    "regulatoryReferences": "list of referenced regulations"
  }
}`;

  const imageUrls = (images || []).map(img => img?.dataUrl).filter(Boolean);
  const text = imageUrls.length > 0
    ? await callGroqVision(prompt, imageUrls)
    : await callTextAI(prompt);

  return parseVisionResponse(text, 'complianceReport');
}

/**
 * Voice Command Processing
 */
export async function processVoiceCommand({ command, currentContext }) {
  const prompt = `You are a voice command processor for INFRAWATCH municipal enforcement system.

CURRENT CONTEXT:
- Active View: ${currentContext?.view || 'dashboard'}
- Selected Case: ${currentContext?.selectedCase || 'none'}
- User Role: ${currentContext?.userRole || 'officer'}

USER VOICE COMMAND: "${command}"

RESPOND WITH JSON:
{
  "understood": true,
  "confidence": 85,
  "intent": "navigate",
  "action": {
    "type": "specific action type",
    "parameters": {}
  },
  "response": "natural language response to speak back",
  "suggestedFollowUp": "what to ask next if needed"
}`;

  const text = await callTextAI(prompt);
  return parseVisionResponse(text, 'voiceCommand');
}

/**
 * Smart Notification Prioritization
 */
export async function prioritizeAlerts({ alerts, userContext }) {
  const prompt = `You are an AI alert prioritization system for municipal enforcement.

USER CONTEXT:
- Role: ${userContext?.role || 'officer'}
- Active Cases: ${userContext?.activeCases || 0}

PENDING ALERTS:
${JSON.stringify(alerts, null, 2)}

Prioritize these alerts based on public safety impact, time sensitivity, penalty amount, and severity.

RESPOND WITH JSON:
{
  "prioritizedAlerts": [
    {
      "alertId": "original alert id",
      "priorityRank": 1,
      "priorityScore": 85,
      "urgencyLevel": "HIGH",
      "reasoning": "why this priority",
      "recommendedAction": "what to do",
      "estimatedTimeToHandle": "30 minutes"
    }
  ],
  "summary": {
    "totalAlerts": ${alerts.length},
    "immediateAction": 1,
    "canDefer": 1,
    "recommendedFocus": "what to focus on first"
  },
  "workloadAssessment": {
    "currentLoad": "moderate",
    "estimatedClearanceTime": "2 hours",
    "recommendation": "advice for the officer"
  }
}`;

  const text = await callTextAI(prompt);
  return parseVisionResponse(text, 'alertPrioritization');
}
