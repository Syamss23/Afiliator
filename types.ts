
import { Content } from '@google/genai';

export enum Mode {
    Lookbook = 'lookbook',
    Broll = 'b-roll',
}

export interface GeneratedImage {
    id: number;
    src: string;
    prompt?: string;
    videoSrc?: string;
    isGeneratingVideo?: boolean;
    isLoading?: boolean;
    generationRequest?: Content;
}
