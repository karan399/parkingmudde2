import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ParkingAnalysis {
  plate_detected: boolean;
  footpath_prob: number;
  crosswalk_prob: number;
  double_park_prob: number;
  no_parking_sign_prob: number;
  blocking_entrance_prob: number;
  score: number;
  verdict: "CORRECT" | "SUSPICIOUS" | "WRONG_PARKING";
  reason_codes: string[];
}

export async function analyzeParkingImage(base64Image: string): Promise<ParkingAnalysis> {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash-preview",
    contents: [
      {
        parts: [
          {
            text: `Analyze this image for parking violations in India. 
            Check for:
            1. Is the vehicle on a footpath?
            2. Is it on a zebra crossing?
            3. Is it double parked?
            4. Is there a 'No Parking' or 'No Stopping' sign nearby?
            5. Is it blocking an entrance or exit?
            
            Return a JSON object with probabilities (0-1) for each and a final score (0-100).
            Score bands: 0-29 Safe, 30-59 Suspicious, 60-100 Wrong.
            Reason codes should be from: ["FOOTPATH", "CROSSWALK", "DOUBLE_PARK", "SIGN_VIOLATION", "BLOCKING_ENTRANCE"].`
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plate_detected: { type: Type.BOOLEAN },
          footpath_prob: { type: Type.NUMBER },
          crosswalk_prob: { type: Type.NUMBER },
          double_park_prob: { type: Type.NUMBER },
          no_parking_sign_prob: { type: Type.NUMBER },
          blocking_entrance_prob: { type: Type.NUMBER },
          score: { type: Type.INTEGER },
          verdict: { type: Type.STRING, enum: ["CORRECT", "SUSPICIOUS", "WRONG_PARKING"] },
          reason_codes: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["plate_detected", "footpath_prob", "crosswalk_prob", "double_park_prob", "no_parking_sign_prob", "blocking_entrance_prob", "score", "verdict", "reason_codes"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
}
