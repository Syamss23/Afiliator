
import { Part } from '@google/genai';

export const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        // We need to get rid of the "data:mime/type;base64," part
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
    };
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const base64ToGenerativePart = (base64String: string): Part => {
    const [header, data] = base64String.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return {
        inlineData: {
            data,
            mimeType,
        }
    };
}
