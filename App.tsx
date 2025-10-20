
import React, { useState, useCallback } from 'react';
import { Mode, GeneratedImage } from './types';
import { THEMES, LIGHTING, INITIAL_IMAGES } from './constants';
import { generateImage, generateImagePrompt, generateVideoFromImage } from './services/geminiService';
import { fileToGenerativePart } from './utils/fileUtils';
import { Content, Part } from '@google/genai';
import ImageUploader from './components/ImageUploader';
import ImageCard from './components/ImageCard';
import Modal from './components/Modal';
import { BagIcon } from './components/icons/BagIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.Lookbook);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<string>(THEMES[0]);
  const [lighting, setLighting] = useState<string>(LIGHTING[0]);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(INITIAL_IMAGES);
  
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerateClick = useCallback(async () => {
    if ((mode === Mode.Lookbook && (!modelFile || !productFile)) || (mode === Mode.Broll && !productFile)) {
      setError('Harap unggah semua gambar yang diperlukan.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const productPart = await fileToGenerativePart(productFile!);
      const requests: { id: number, request: Content }[] = [];

      if (mode === Mode.Lookbook) {
        const modelPart = await fileToGenerativePart(modelFile!);
        const baseParts = [modelPart, productPart];
        const posePrompts = [
            'Pose seluruh badan yang menunjukkan bagaimana produk melengkapi pakaian secara keseluruhan.',
            'Pose close-up yang menyoroti detail dan kualitas produk saat dikenakan.',
            'Pose aksi atau gaya hidup yang menunjukkan produk sedang digunakan dalam situasi yang alami dan menarik.'
        ];

        posePrompts.forEach((posePrompt, index) => {
            const fullPrompt = `Menggunakan gambar pertama sebagai model dan gambar kedua sebagai produk, buat gambar pemotretan profesional. Model harus mengenakan produk. Pemandangan harus memiliki tema '${theme}' dengan pencahayaan '${lighting}'. ${posePrompt} Hasilnya harus berupa gambar fotorealistik.`;
            const request: Content = { parts: [...baseParts, { text: fullPrompt }] };
            requests.push({ id: index + 1, request });
        });
      } else { // B-roll mode
          const parts: Part[] = [productPart];
          const prompt = `Buat foto produk profesional yang hanya menampilkan item dalam gambar. Latar belakang harus berupa pemandangan yang ditata dengan tema '${theme}' dan pencahayaan '${lighting}'. Jangan sertakan orang atau model apa pun. Fokusnya sepenuhnya pada produk. Hasilnya harus berupa gambar fotorealistik.`;
          parts.push({ text: prompt });
          const request: Content = { parts };
          for (let i = 0; i < 3; i++) {
              requests.push({ id: i + 1, request });
          }
      }

      setGeneratedImages(requests.map(r => ({
          ...INITIAL_IMAGES[r.id - 1],
          isLoading: true,
          generationRequest: r.request,
          src: '',
      })));

      const imagePromises = requests.map(r => generateImage(r.request));

      imagePromises.forEach((promise, index) => {
        promise
          .then(imageUrl => {
            setGeneratedImages(prev => prev.map(img => img.id === index + 1 ? { ...img, src: imageUrl, isLoading: false } : img));
          })
          .catch(err => {
            console.error(`Gagal membuat gambar pada indeks ${index}:`, err);
            setGeneratedImages(prev => prev.map(img => img.id === index + 1 ? { ...img, src: `https://picsum.photos/seed/error${index}/400/600`, isLoading: false } : img));
          });
      });

      const results = await Promise.allSettled(imagePromises);
      if (results.every(r => r.status === 'rejected')) {
          throw new Error("AI gagal menghasilkan gambar apa pun. Silakan coba prompt atau gambar yang berbeda.");
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui saat pembuatan gambar.');
      setGeneratedImages(INITIAL_IMAGES);
    } finally {
        setIsGenerating(false);
    }
  }, [mode, modelFile, productFile, theme, lighting]);

  const handleRegenerateImage = useCallback(async (imageId: number) => {
    const imageToRegen = generatedImages.find(img => img.id === imageId);
    if (!imageToRegen || !imageToRegen.generationRequest) {
        console.error("Tidak ada permintaan pembuatan yang ditemukan untuk gambar ini.");
        setError("Tidak dapat membuat ulang gambar: data asli tidak ditemukan.");
        return;
    }

    setError(null);
    setGeneratedImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, isLoading: true, src: '' } : img
    ));

    try {
        const newImageUrl = await generateImage(imageToRegen.generationRequest);
        setGeneratedImages(prev => prev.map(img =>
            img.id === imageId ? { ...img, isLoading: false, src: newImageUrl } : img
        ));
    } catch (err) {
        console.error(`Gagal membuat ulang gambar ${imageId}:`, err);
        setError(err instanceof Error ? `Gagal membuat ulang gambar: ${err.message}` : 'Terjadi kesalahan yang tidak diketahui.');
        setGeneratedImages(prev => prev.map(img =>
            img.id === imageId ? { ...img, isLoading: false, src: imageToRegen.src || `https://picsum.photos/seed/error${imageId}/400/600` } : img
        ));
    }
  }, [generatedImages]);

  const handleGeneratePrompt = useCallback(async (imageId: number, imageSrc: string) => {
    try {
      const prompt = await generateImagePrompt(imageSrc);
      setGeneratedImages(prev =>
        prev.map(img => (img.id === imageId ? { ...img, prompt } : img))
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui saat membuat prompt.');
    }
  }, []);

  const handleGenerateVideo = useCallback(async (imageId: number, imageSrc: string) => {
    setGeneratedImages(prev => prev.map(img => img.id === imageId ? { ...img, isGeneratingVideo: true } : img));
    setError(null);
    try {
      const videoUrl = await generateVideoFromImage(imageSrc);
      setGeneratedImages(prev => prev.map(img => img.id === imageId ? { ...img, videoSrc: videoUrl, isGeneratingVideo: false } : img));
    } catch (err)
      {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui saat membuat video.');
      setGeneratedImages(prev => prev.map(img => img.id === imageId ? { ...img, isGeneratingVideo: false } : img));
    }
  }, []);

  const handleZoom = (src: string) => {
    setZoomedImage(src);
    setIsZoomModalOpen(true);
  };

  const modelImagePreview = modelFile ? URL.createObjectURL(modelFile) : null;
  const productImagePreview = productFile ? URL.createObjectURL(productFile) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Imajinasikan Produk Afiliator</h1>
          <BagIcon className="w-8 h-8 text-indigo-400" />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex-grow">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Left Column: Controls */}
          <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0">
            <div className="space-y-8 sticky top-24">
              {/* Section 1: Mode */}
              <div>
                <h2 className="text-lg font-semibold text-white">1. Pilih Mode</h2>
                <p className="text-sm text-gray-400 mb-4">Pilih jenis pemotretan yang Anda inginkan.</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setMode(Mode.Lookbook)} className={`px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 ${mode === Mode.Lookbook ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-700 hover:bg-gray-600'}`}>Lookbook</button>
                  <button onClick={() => setMode(Mode.Broll)} className={`px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 ${mode === Mode.Broll ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-700 hover:bg-gray-600'}`}>B-roll</button>
                </div>
              </div>

              {/* Section 2: Upload */}
              <div>
                 <h2 className="text-lg font-semibold text-white">2. Unggah Gambar</h2>
                 <p className="text-sm text-gray-400 mb-4">Sediakan gambar yang diperlukan untuk mode yang Anda pilih.</p>
                 <div className="space-y-4">
                   {mode === Mode.Lookbook && (
                     <ImageUploader title="Gambar Model" imagePreview={modelImagePreview} onImageUpload={setModelFile} onImageRemove={() => setModelFile(null)} />
                   )}
                   <ImageUploader title="Gambar Produk" imagePreview={productImagePreview} onImageUpload={setProductFile} onImageRemove={() => setProductFile(null)} />
                 </div>
              </div>

              {/* Section 3: Customize */}
              <div>
                 <h2 className="text-lg font-semibold text-white">3. Kustomisasi</h2>
                 <p className="text-sm text-gray-400 mb-4">Sesuaikan estetika pemotretan Anda.</p>
                 <div className="space-y-4">
                   <div>
                     <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-1">Tema Pemotretan</label>
                     <select id="theme" value={theme} onChange={e => setTheme(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 transition">
                       {THEMES.map(t => <option key={t}>{t}</option>)}
                     </select>
                   </div>
                   <div>
                     <label htmlFor="lighting" className="block text-sm font-medium text-gray-300 mb-1">Gaya Pencahayaan</label>
                     <select id="lighting" value={lighting} onChange={e => setLighting(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 transition">
                       {LIGHTING.map(l => <option key={l}>{l}</option>)}
                     </select>
                   </div>
                 </div>
              </div>

              {/* Generate Button */}
              <button onClick={handleGenerateClick} disabled={isGenerating} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2">
                {isGenerating && <SpinnerIcon className="w-5 h-5" />}
                <span>{isGenerating ? 'Menyiapkan penata gaya AI...' : (mode === Mode.Lookbook ? 'Buat Lookbook' : 'Buat B-roll')}</span>
              </button>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
          </div>

          {/* Right Column: Gallery */}
          <div className="w-full lg:w-2/3 xl:w-3/4 mt-8 lg:mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {generatedImages.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onZoom={handleZoom}
                  onGeneratePrompt={handleGeneratePrompt}
                  onGenerateVideo={handleGenerateVideo}
                  onRegenerate={handleRegenerateImage}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800/50 border-t border-gray-700 mt-8">
        <div className="container mx-auto px-6 py-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} AVE-Studio. Didukung oleh Google Gemini.
        </div>
      </footer>
      
      {/* Modals */}
      <Modal isOpen={isZoomModalOpen} onClose={() => setIsZoomModalOpen(false)}>
        {zoomedImage && <img src={zoomedImage} alt="Tampilan yang diperbesar" className="max-w-full max-h-[90vh] rounded-lg" />}
      </Modal>
    </div>
  );
};

export default App;
