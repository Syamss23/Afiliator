
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { ZoomIcon } from './icons/ZoomIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { VideoIcon } from './icons/VideoIcon';
import { CopyIcon } from './icons/CopyIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

const RefreshCwIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M23 4v6h-6"></path>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
);


interface ImageCardProps {
  image: GeneratedImage;
  onZoom: (src: string) => void;
  onGeneratePrompt: (id: number, src: string) => void;
  onGenerateVideo: (id: number, src: string) => void;
  onRegenerate: (id: number) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onZoom, onGeneratePrompt, onGenerateVideo, onRegenerate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.src;
    link.download = `AVE-Studio-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGeneratePromptClick = async () => {
    if (image.prompt) return;
    setIsGeneratingPrompt(true);
    await onGeneratePrompt(image.id, image.src);
    setIsGeneratingPrompt(false);
  };

  const handleCopyPrompt = () => {
    if (!image.prompt) return;
    navigator.clipboard.writeText(image.prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  if (image.isLoading) {
    return (
      <div className="aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center animate-pulse">
        <SpinnerIcon className="w-10 h-10 text-gray-600" />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {image.videoSrc ? (
         <video
            key={image.videoSrc}
            src={image.videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
      ) : (
        <img src={image.src} alt={`Generated image ${image.id}`} className="w-full h-full object-cover" />
      )}
      
      {image.isGeneratingVideo && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 text-center">
            <SpinnerIcon className="w-10 h-10" />
            <p className="mt-3 text-sm font-semibold animate-pulse">AI sedang mengarahkan...</p>
            <p className="mt-1 text-xs text-gray-300">Ini bisa memakan waktu beberapa menit.</p>
        </div>
      )}

      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isHovered && !image.isGeneratingVideo ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-3 right-3 flex items-center space-x-2">
            {!image.videoSrc && !image.isGeneratingVideo && image.generationRequest && (
                <button onClick={() => onRegenerate(image.id)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Buat Ulang"><RefreshCwIcon className="w-5 h-5" /></button>
            )}
            <button onClick={() => onZoom(image.src)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Perbesar"><ZoomIcon className="w-5 h-5" /></button>
            <button onClick={handleDownload} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Unduh"><DownloadIcon className="w-5 h-5" /></button>
            {!image.videoSrc && !image.isGeneratingVideo && (
                <button onClick={() => onGenerateVideo(image.id, image.src)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Buat Video"><VideoIcon className="w-5 h-5" /></button>
            )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {!image.prompt && (
            <button onClick={handleGeneratePromptClick} disabled={isGeneratingPrompt} className="w-full text-sm flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50">
              {isGeneratingPrompt ? <SpinnerIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
              <span>{isGeneratingPrompt ? 'Membuat...' : 'Buat Prompt'}</span>
            </button>
          )}
          {image.prompt && (
            <div className="text-xs text-gray-300 bg-black/30 p-2 rounded-md backdrop-blur-sm">
              <p className="line-clamp-3">{image.prompt}</p>
              <button onClick={handleCopyPrompt} className="mt-2 text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1">
                <CopyIcon className="w-4 h-4" />
                <span>{promptCopied ? 'Tersalin!' : 'Salin Prompt'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
