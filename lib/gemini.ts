import { GoogleGenAI } from "@google/genai";
import { GeminiAction } from "@/lib/types";
import awsRegions from "@/aws-regions.json";

export async function queryGemini(userQuery: string, apiKey: string): Promise<GeminiAction> {
  const ai = new GoogleGenAI({ apiKey });

  // Detailed region information
  const regionDetails = awsRegions
    .map(r => `${r.region} (${r.displayName}, ${r.country}): ${r.availabilityZones.length} AZs`)
    .join('\n');

  const prompt = `
You are an AWS cloud architect AI assistant. Analyze the user's query and respond with a JSON object that controls a 3D visualization of AWS infrastructure.

AVAILABLE AWS REGIONS:
${regionDetails}

GEOGRAPHIC CLUSTERS:
- North America: us-east-1, us-east-2, us-west-1, us-west-2, ca-central-1
- Europe: eu-west-1, eu-west-2, eu-west-3, eu-central-1, eu-north-1, eu-south-1
- Asia Pacific: ap-south-1, ap-northeast-1, ap-northeast-2, ap-northeast-3, ap-southeast-1, ap-southeast-2, ap-east-1
- Other: sa-east-1, me-south-1, af-south-1

USER QUERY: "${userQuery}"

RESPONSE ACTIONS (choose exactly one):

1. highlight_regions
   Use when user asks about regions by location, geography, latency, availability, or single-site deployment.
   Keywords: "show me", "options for", "best for", "low latency", "where to deploy", "available in", "regions in"
   Examples:
   - "Show me options for India" → highlight: [ap-south-1]
   - "Best regions for Europe" → highlight: [eu-west-1, eu-central-1]
   - "Where should I deploy in Asia" → highlight: [ap-northeast-1, ap-southeast-1]

2. compare_regions
   Use when user asks about multi-region, redundancy, failover, DR, or connecting regions.
   Keywords: "redundancy", "between X and Y", "failover", "backup", "active-active", "DR", 
            "disaster recovery", "replicate", "multi-region", "both X and Y", "sync", "mirror",
            "high availability", "fault tolerance", "connect", "and" (when listing 2 regions)
   
   Modes:
   - "active-active": Both regions serve traffic simultaneously (keywords: "redundancy", "high availability", "load balance")
   - "active-passive": Primary + standby failover (keywords: "failover", "DR", "standby")
   - "backup": Primary + cold backup (keywords: "backup", "disaster recovery", "secondary")
   
   Examples:
   - "I need redundancy between Tokyo and Seoul" → compare: [ap-northeast-1, ap-northeast-2], mode: "active-active"
   - "Backup between Ireland and Frankfurt" → compare: [eu-west-1, eu-central-1], mode: "backup"
   - "Failover from Mumbai to Singapore" → compare: [ap-south-1, ap-southeast-1], mode: "active-passive"

3. camera_fly
   Use when user explicitly asks to view, zoom, fly to, focus on, or inspect a SINGLE specific region.
   Keywords: "fly to", "show me [specific location]", "zoom to", "focus on", "go to", "fly me to"
   Examples:
   - "Fly me to Ireland" → camera_fly: eu-west-1
   - "Show me Mumbai" → camera_fly: ap-south-1
   - "Zoom to Tokyo" → camera_fly: ap-northeast-1

4. provision_architecture
   Use for complex multi-region architectures with compliance/regulatory requirements.
   Triggers: GDPR, financial trading, multi-continent apps, global CDN, compliance-heavy workloads
   Examples:
   - "I need GDPR-compliant architecture for EU and UK" → provision: [eu-west-1, eu-west-2]
   - "Global trading platform across 3 continents" → provision: [us-east-1, eu-central-1, ap-northeast-1]

5. error
   Use when query is unclear, unrelated to AWS/cloud, or cannot be mapped to any action.
   Provide helpful suggestions in the reason field.

6. latency_suggestion — When user asks about low-latency, gaming, VoIP, streaming, mobile, SEA, Europe, India, US, etc:

{
  "action": "latency_suggestion",
  "regions": ["region-code-1", "region-code-2"],
  "latency_estimate": "10-40ms",
  "reason": "Closest region to target geography"
}


RESPONSE FORMAT (JSON only, no markdown):

For highlight_regions:
{
  "action": "highlight_regions",
  "regions": ["region-code"],
  "reason": "Brief explanation"
}

For compare_regions:
{
  "action": "compare_regions",
  "regions": ["region-code-1", "region-code-2"],
  "mode": "active-active" | "active-passive" | "backup",
  "reason": "Brief explanation"
}

For camera_fly:
{
  "action": "camera_fly",
  "target": "region-code",
  "reason": "Brief explanation"
}

For provision_architecture:
{
  "action": "provision_architecture",
  "regions": ["region-code-1", "region-code-2", ...],
  "architecture": ["multi-AZ", "active-active", "global-accelerator"],
  "reason": "Brief explanation"
}

For error:
{
  "action": "error",
  "reason": "Explanation with suggestions"
}

For latency_suggestion:
- For India: ap-south-1 (Mumbai), ap-southeast-1 (Singapore)
- For SEA: Singapore, Tokyo
- For Europe: Frankfurt, Ireland, London
- For US East: us-east-1, us-east-2
- For Low-latency gaming: choose 1-2 closest regions
Return JSON only

CRITICAL RULES:
- Always return valid region codes from the available list above
- For geography/continent queries → highlight_regions with PRIMARY hubs:
  * "Europe" → [eu-west-1, eu-central-1]
  * "Asia" → [ap-northeast-1, ap-southeast-1]
  * "US/America" → [us-east-1, us-west-2]
- For "between X and Y" or "X and Y" → ALWAYS use compare_regions
- Match city/country names to correct region codes:
  * Ireland/Dublin → eu-west-1
  * Tokyo → ap-northeast-1
  * Seoul → ap-northeast-2
  * Mumbai/India → ap-south-1
  * Singapore → ap-southeast-1
  * Sydney → ap-southeast-2
  * São Paulo/Brazil → sa-east-1
- If user mentions only ONE specific location → camera_fly
- If user mentions TWO locations with connecting words → compare_regions
- Reason should be 1-2 sentences maximum
- If ambiguous, prefer highlight_regions over error

Respond with ONLY valid JSON. No markdown formatting, no code blocks, no extra text.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    let text = response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Clean markdown and trim
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const action: GeminiAction = JSON.parse(text);
    
    // Validate the action has required fields
    if (!action.action) {
      throw new Error("Invalid response: missing action field");
    }

    return action;

  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      action: "error",
      reason: "Failed to process query. Please check your API key or try rephrasing your question."
    };
  }
}

// ```

// ## Key Improvements:

// 1. ✅ **Detailed Region Info** - Shows AZ count for each region
// 2. ✅ **Geographic Clusters** - Helps AI understand continent-level queries
// 3. ✅ **More Trigger Keywords** - Better detection for compare vs highlight
// 4. ✅ **Clear Mode Definitions** - Explains when to use active-active vs backup
// 5. ✅ **City/Country Mapping** - AI knows "Mumbai" = ap-south-1, "Ireland" = eu-west-1
// 6. ✅ **Better Examples** - Shows exact input → output for common queries
// 7. ✅ **Critical Rules Section** - Clear disambiguation logic
// 8. ✅ **Validation** - Checks if action field exists before returning
// 9. ✅ **All Your Regions** - Includes eu-south-1, ap-east-1, etc.

// ## Test Queries That Should Now Work Better:
// ```
// "Show me options for India" → highlight: [ap-south-1]
// "I need redundancy between Tokyo and Seoul" → compare: [ap-northeast-1, ap-northeast-2], mode: "active-active"
// "Fly me to Ireland" → camera_fly: eu-west-1
// "Best regions for Europe" → highlight: [eu-west-1, eu-central-1]
// "Backup between Mumbai and Singapore" → compare: [ap-south-1, ap-southeast-1], mode: "backup"