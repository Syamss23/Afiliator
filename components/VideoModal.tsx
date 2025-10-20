
import React, { useEffect, FC } from 'react';
import Modal from './Modal';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
}

const VideoModal: FC<VideoModalProps> = ({ isOpen, onClose, videoUrl }) => {
  useEffect(() => {
    // Cleanup the blob URL when the component unmounts or the URL changes
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {videoUrl && (
        <video 
          src={videoUrl} 
          controls 
          autoPlay 
          loop 
          className="max-w-full max-h-[90vh] rounded-lg"
        />
      )}
    </Modal>
  );
};

export default VideoModal;
