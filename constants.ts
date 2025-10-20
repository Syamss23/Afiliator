
import { GeneratedImage } from './types';

export const THEMES: string[] = [
    'Studio Profesional',
    'Gaya Jalanan Perkotaan',
    'Minimalis',
    'Film Antik',
    'Alam & Luar Ruangan',
    'Neon Cyberpunk',
    'Mewah & Elegan',
    'Bohemian Chic'
];

export const LIGHTING: string[] = [
    'Cahaya Senja',
    'Bayangan Dramatis',
    'Cahaya Studio Lembut',
    'Cerah & Lapang',
    'Sinematik',
    'Sinar Neon',
    'Cahaya Latar',
    'Lampu Kilat Keras'
];

export const INITIAL_IMAGES: GeneratedImage[] = Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    src: `https://picsum.photos/seed/${i+1}/400/600`,
    prompt: undefined,
    generationRequest: undefined,
}));
