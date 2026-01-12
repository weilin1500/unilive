
import { GoogleGenAI, Modality } from "@google/genai";

class GeminiService {
  private ttsCache: Map<string, string>;

  constructor() {
    this.ttsCache = new Map();
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "I'm thinking...";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Sorry, I encountered an error processing your request.";
    }
  }

  async searchMaps(prompt: string, location?: { latitude: number, longitude: number }): Promise<{ text: string, links: { title: string, url: string, type?: string }[] }> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Locate this place or type of place: "${prompt}". Provide helpful context and specific locations.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: location ? {
                latitude: location.latitude,
                longitude: location.longitude
              } : undefined
            }
          }
        },
      });

      const text = response.text || "I found some locations for you.";
      const links: { title: string, url: string, type?: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.maps) {
            links.push({
              title: chunk.maps.title || "Selected Location",
              url: chunk.maps.uri,
              type: 'place'
            });
          }
        });
      }
      return { text, links };
    } catch (error) {
      console.error("Gemini Maps Error:", error);
      return { text: "I couldn't reach the location service.", links: [] };
    }
  }

  /**
   * Analyzes an image using Gemini 3 Pro
   */
  async analyzeImage(base64Image: string, prompt: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = {
        inlineData: {
          data: base64Image.split(',')[1] || base64Image,
          mimeType: 'image/jpeg',
        },
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            imagePart,
            { text: prompt },
          ],
        },
      });
      return response.text || "I couldn't analyze the image.";
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "Sorry, I couldn't analyze that image.";
    }
  }

  /**
   * Edits an image using Gemini 2.5 Flash Image based on a text prompt
   */
  async editImage(base64Image: string, prompt: string): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1] || base64Image,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
          }
      }
      return null;
    } catch (error) {
      console.error("Gemini Image Edit Error:", error);
      return null;
    }
  }

  /**
   * Analyzes a video using Gemini 3 Pro
   * Extracts key information or summarizes content
   */
  async analyzeVideo(base64Video: string, prompt: string, mimeType: string = 'video/mp4'): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const videoPart = {
        inlineData: {
          data: base64Video.split(',')[1] || base64Video,
          mimeType: mimeType,
        },
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            videoPart,
            { text: prompt },
          ],
        },
      });
      return response.text || "I couldn't analyze the video content.";
    } catch (error) {
      console.error("Gemini Video Analysis Error:", error);
      return "Sorry, I encountered an issue analyzing that video. It might be too large or the format isn't supported directly.";
    }
  }

  /**
   * Generates video from image using Veo 3.1
   * Adheres to mandatory individual API key requirements
   */
  async generateVideoFromImage(base64Image: string, prompt: string, aspectRatio: '9:16' | '16:9'): Promise<string | null> {
    try {
      // Create new instance to pick up latest API key from studio selection
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: base64Image.split(',')[1] || base64Image,
          mimeType: 'image/jpeg',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      // Poll until done
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) return null;

      // Append API key as required by the docs for fetching final video bytes
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error("Failed to download synthesized video");
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Veo Generation Error:", error);
      if (error.message?.includes("Requested entity was not found")) {
         throw new Error("KEY_NOT_FOUND");
      }
      return null;
    }
  }

  /**
   * Generates video from text prompt using Veo 3.1
   */
  async generateVideo(prompt: string, aspectRatio: '9:16' | '16:9'): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      // Poll until done
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) return null;

      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error("Failed to download synthesized video");
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Veo Text-to-Video Error:", error);
      if (error.message?.includes("Requested entity was not found")) {
         throw new Error("KEY_NOT_FOUND");
      }
      return null;
    }
  }

  /**
   * Generates image using Gemini models.
   * Defaults to 'gemini-2.5-flash-image' for 1K size to ensure better availability.
   * Uses 'gemini-3-pro-image-preview' for higher resolutions.
   */
  async generateImage(prompt: string, size: '1K' | '2K' | '4K'): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Select model based on size/quality requirement
      // gemini-2.5-flash-image is good for general 1K generation
      // gemini-3-pro-image-preview is needed for 2K/4K
      const isHighQuality = size === '2K' || size === '4K';
      const model = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

      const config: any = {};
      
      if (isHighQuality) {
          // Pro model supports explicit size config
          config.imageConfig = {
              imageSize: size,
              aspectRatio: "1:1"
          };
      } else {
          // Flash image model supports aspectRatio but not imageSize
          config.imageConfig = {
              aspectRatio: "1:1"
          }
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: prompt }],
        },
        config: config,
      });

      if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
          }
      }
      return null;
    } catch (error: any) {
      console.error("Gemini Image Gen Error:", error);
      // Map common permission/key errors to KEY_NOT_FOUND
      if (
          error.message?.includes("Requested entity was not found") || 
          error.message?.includes("404") ||
          error.message?.includes("403") ||
          error.message?.includes("PERMISSION_DENIED")
      ) {
         throw new Error("KEY_NOT_FOUND");
      }
      return null;
    }
  }

  async translateText(text: string, targetLang: string): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Translate into ${targetLang}. Return ONLY translated text: "${text}"`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        return response.text?.trim() || text;
    } catch (error) { return text; }
  }

  async speakText(text: string): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error: any) { return null; }
  }

  async conductAISearch(query: string): Promise<{ summary: string; suggestions: string[]; category: string }> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze: "${query}". Return JSON: {summary, suggestions, category}.`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      return { summary: `Results for ${query}`, suggestions: [], category: "General" };
    }
  }

  /**
   * Performs a real-time search using Google Search Grounding.
   * Returns a text summary and a list of source links.
   */
  async searchExplore(query: string): Promise<{ text: string, sources: { title: string, url: string }[] }> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find latest and trending information about: "${query}". Summarize the key points efficiently for a social media explore feed (max 100 words).`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "Here is what I found.";
      const sources: { title: string, url: string }[] = [];
      
      // Extract Grounding Chunks (URLs)
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((c: any) => {
          if (c.web) {
            sources.push({ title: c.web.title || "Source", url: c.web.uri });
          }
        });
      }
      
      return { text, sources };
    } catch (error) {
      console.error("Explore Search Error:", error);
      return { text: "Unable to fetch live results at the moment.", sources: [] };
    }
  }

  /**
   * Simulates finding users by interest using AI generation
   */
  async findUsersByInterest(query: string): Promise<any[]> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate 3 fictional social media user profiles relevant to the search term "${query}". 
      Return JSON array of objects with keys: username, name, bio, mutuals (number 1-20). 
      Make them sound realistic and appealing.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const users = JSON.parse(response.text || "[]");
      return users.map((u: any, i: number) => ({
          id: `ai_gen_${Date.now()}_${i}`,
          username: u.username,
          name: u.name,
          bio: u.bio,
          avatar: `https://picsum.photos/seed/${u.username}/100`,
          isFollowing: false,
          mutuals: u.mutuals || 0,
          source: 'suggested'
      }));
    } catch (error) {
      console.error("AI User Search Error", error);
      return [];
    }
  }

  /**
   * Universal App Search for Home Bar
   * Searches/Generates Users, Posts, Music, Live, Hashtags, Events
   */
  async searchUniversal(query: string): Promise<any> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are the search engine for a social app. The user searched for "${query}".
        Generate a JSON object containing search results categorized by type.
        Include realistic data for the following arrays if relevant to the query:
        - users: [{id, name, username, avatar, isVerified, followers}] (max 3)
        - posts: [{id, description, thumbnail, type, likes}] (max 3, type='image'|'video')
        - lives: [{id, streamer, title, viewers, avatar}] (max 2)
        - hashtags: [{tag, count}] (max 3)
        - music: [{id, title, artist, cover}] (max 3)
        - events: [{id, title, date, location, image}] (max 2)
        
        If the query is empty or nonsense, return empty arrays.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Universal Search Error", error);
      return { users: [], posts: [], lives: [], hashtags: [], music: [], events: [] };
    }
  }

  /**
   * Simulates music generation.
   */
  async generateMusic(prompt: string): Promise<{ url: string, cover: string, title: string, artist: string }> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a creative title and artist name for a song described as: "${prompt}". Return JSON: {title, artist}.`,
        config: { responseMimeType: "application/json" }
      });
      
      const meta = JSON.parse(response.text || '{"title": "AI Song", "artist": "Gemini"}');
      
      return {
        url: 'https://www.soundjay.com/free-music/midnight-ride-01a.mp3', // Placeholder
        cover: `https://picsum.photos/seed/${meta.title}/200`,
        title: meta.title,
        artist: meta.artist
      };
    } catch (error) {
      console.error("Music Gen Error", error);
      return {
        url: 'https://www.soundjay.com/free-music/midnight-ride-01a.mp3',
        cover: 'https://picsum.photos/200',
        title: 'Error Generating',
        artist: 'System'
      };
    }
  }

  /**
   * Uses Gemini 3 Pro/Flash with Thinking Config
   */
  async askDeepThink(prompt: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 1024 }
        }
      });
      return response.text || "I couldn't think of an answer.";
    } catch (error) {
      console.error("Deep Think Error", error);
      return "Thinking process failed.";
    }
  }

  /**
   * Simple chat interface
   */
  async chatWithAI(message: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message
      });
      return response.text || "I didn't get that.";
    } catch (error) {
        console.error("Chat Error", error);
        return "I'm having trouble connecting right now.";
    }
  }
}

export const geminiService = new GeminiService();
