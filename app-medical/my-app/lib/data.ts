export const SPECIALTIES = [
  "General Physician", "Cardiologist", "Dermatologist", "ENT Specialist",
  "Pediatrician", "Orthopedic", "Gynecologist", "Neurologist",
  "Dentist", "Psychiatrist"
];

export const callGeminiAPI = async (symptoms: string) => {
  const apiKey = ""; // Provided by execution environment
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const systemInstruction = `You are a helpful, safety-first AI health assistant. A user will provide their symptoms. 
  You must analyze them and return ONLY a valid JSON object with the following structure:
  {
    "causes": ["cause 1", "cause 2"],
    "remedies": ["remedy 1", "remedy 2"],
    "specialist": "One of these EXACTLY: General Physician, Cardiologist, Dermatologist, ENT Specialist, Pediatrician, Orthopedic, Gynecologist, Neurologist, Dentist, Psychiatrist",
    "disclaimer": "This is an AI analysis, not a medical diagnosis. Please consult a doctor immediately if symptoms are severe."
  }
  Do not include markdown tags like \`\`\`json. Return just the raw JSON string.`;

  const payload = {
    contents: [{ parts: [{ text: symptoms }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { responseMimeType: "application/json" }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error("API call failed");
  const data = await response.json();
  const textResponse = data.candidates[0].content.parts[0].text;
  return JSON.parse(textResponse);
};
