// FIX: Replace deprecated GenerateContentRequest with Content.
import { GoogleGenAI, Modality, Part, GenerateContentResponse, Content } from "@google/genai";
import { base64ToGenerativePart } from '../utils/fileUtils';

if (!process.env.API_KEY) {
  throw new Error("Variabel lingkungan API_KEY tidak diatur");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const imageEditModel = 'gemini-2.5-flash-image';
const textModel = 'gemini-2.5-flash';
const videoModel = 'veo-2.0-generate-001';

/**
 * Generates a single image based on the provided parts (images and text prompt).
 * Returns a Promise, resolving to a base64 image string.
 */
export const generateImage = (request: Content): Promise<string> => {
  const config = {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
  };

  return ai.models.generateContent({ model: imageEditModel, contents: request, config })
    .then(response => {
      const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
      if (imagePart && imagePart.inlineData) {
        const { data, mimeType } = imagePart.inlineData;
        return `data:${mimeType};base64,${data}`;
      }
      throw new Error("Tidak ada bagian gambar yang ditemukan dalam respons.");
    });
};


/**
 * Generates a descriptive prompt for a given image.
 */
export const generateImagePrompt = async (base64Image: string): Promise<string> => {
  const imagePart = base64ToGenerativePart(base64Image);
  const textPart = { text: "Jelaskan gambar ini secara rinci untuk generator teks-ke-gambar. Fokus pada objek, latar, warna, dan gaya." };

  const response = await ai.models.generateContent({
    model: textModel,
    contents: { parts: [imagePart, textPart] },
  });
  
  return response.text.trim();
};

/**
 * Generates a video from an image and polls for completion.
 */
export const generateVideoFromImage = async (base64Image: string): Promise<string> => {
  const imagePart = base64ToGenerativePart(base64Image);
  if (!imagePart.inlineData) throw new Error("Tidak dapat memproses gambar untuk pembuatan video.");

  const prompt = 'Animasikan gambar pemotretan produk ini secara halus. Tambahkan gerakan sinematik yang lembut agar terlihat seperti iklan video pendek premium. Gerakannya harus mulus dan elegan.';

  let operation = await ai.models.generateVideos({
    model: videoModel,
    prompt: prompt,
    image: {
      // FIX: The property for the base64 encoded image string is `imageBytes`, not `bytesBase64Encoded`.
      imageBytes: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    },
    config: {
      numberOfVideos: 1,
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Pembuatan video selesai, tetapi tidak ada tautan unduhan yang diberikan. Ini mungkin karena peninjauan kebijakan konten. Silakan coba gambar yang berbeda.");
  }

  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!videoResponse.ok) {
    throw new Error("Gagal mengunduh video yang dihasilkan.");
  }

  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
};