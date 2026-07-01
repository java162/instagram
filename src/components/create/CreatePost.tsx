import React, { useState, useRef, useCallback } from 'react';
import { Image, Video, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { createPost } from '../../api/posts';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type Step = 'select' | 'edit';

export default function CreatePost({ isOpen, onClose, onCreated }: CreatePostProps) {
  const [step, setStep] = useState<Step>('select');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('select');
    setFiles([]);
    setPreviews([]);
    setPreviewIdx(0);
    setCaption('');
    setLocation('');
  };

  const handleClose = () => { reset(); onClose(); };

  const processFiles = (selected: File[]) => {
    const valid = selected.filter(f =>
      f.type.startsWith('image/') ||
      f.type.startsWith('video/') ||
      /\.(jpg|jpeg|png|gif|webp|bmp|mp4|mov|webm|avi|mkv)$/i.test(f.name)
    ).slice(0, 10);
    if (!valid.length) return;
    setFiles(valid);
    setPreviews(valid.map(f => URL.createObjectURL(f)));
    setStep('edit');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleSubmit = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('media', f));
      if (caption) fd.append('caption', caption);
      if (location) fd.append('location', location);
      await createPost(fd);
      onCreated?.();
      handleClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const isVideo = (idx: number) =>
    files[idx]?.type.startsWith('video/') ||
    /\.(mp4|mov|webm|avi|mkv)$/i.test(files[idx]?.name ?? '');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-2xl" title={step === 'select' ? 'Create new post' : 'New post'}>
      {step === 'select' && (
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '56px 32px', margin: 16, borderRadius: 24,
            border: `2px dashed ${dragging ? '#dc2743' : '#e5e5e5'}`,
            backgroundColor: dragging ? 'rgba(220,39,67,0.04)' : '#fafafa',
            transition: 'all 0.15s',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div style={{
            width: 76, height: 76, borderRadius: 20, marginBottom: 20,
            background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            boxShadow: '0 10px 24px rgba(220,39,67,0.28)',
          }}>
            <Image size={26} color="#fff" strokeWidth={1.5} />
            <Video size={26} color="#fff" strokeWidth={1.5} />
          </div>
          <p style={{ color: '#000', fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Drag photos and videos here</p>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              background: 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)', color: '#fff',
              padding: '11px 26px', borderRadius: 999, fontWeight: 700, fontSize: 14, border: 'none',
              cursor: 'pointer', boxShadow: '0 6px 18px rgba(220,39,67,0.3)',
            }}
          >
            Select From Computer
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {step === 'edit' && (
        <div>
          {/* Header: back + Share button */}
          <div className="flex justify-between items-center" style={{ padding: '12px 16px', borderBottom: '1px solid #f2f2f2' }}>
            <button
              onClick={() => { setStep('select'); setFiles([]); setPreviews([]); }}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: '#f7f7f7', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000',
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: loading ? '#f2b3ba' : 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)',
                color: '#fff', border: 'none', borderRadius: 999, padding: '8px 20px',
                fontWeight: 700, fontSize: 13, cursor: loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {loading ? <Spinner size="sm" /> : 'Share'}
            </button>
          </div>

          {/* Image/video preview */}
          <div className="relative bg-black" style={{ margin: '14px 16px 0', borderRadius: 18, maxHeight: 340, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isVideo(previewIdx) ? (
              <video src={previews[previewIdx]} style={{ width: '100%', maxHeight: 340, objectFit: 'contain' }} controls />
            ) : (
              <img src={previews[previewIdx]} alt="preview" style={{ width: '100%', maxHeight: 340, objectFit: 'contain' }} />
            )}

            {previews.length > 1 && (
              <>
                {previewIdx > 0 && (
                  <button
                    onClick={() => setPreviewIdx(i => i - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2"
                  >
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                )}
                {previewIdx < previews.length - 1 && (
                  <button
                    onClick={() => setPreviewIdx(i => i + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2"
                  >
                    <ChevronRight size={18} className="text-white" />
                  </button>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {previews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPreviewIdx(i)}
                      className={`rounded-full ${i === previewIdx ? 'w-2.5 h-2.5 bg-blue-400' : 'w-2 h-2 bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Caption */}
          <div style={{ margin: '14px 16px 0' }}>
            <div style={{
              border: '1.5px solid #e5e5e5', borderRadius: 16, padding: '12px 14px',
              transition: 'border-color 0.15s',
            }}>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write a caption..."
                maxLength={2200}
                rows={3}
                onFocus={e => (e.currentTarget.parentElement!.style.borderColor = '#dc2743')}
                onBlur={e => (e.currentTarget.parentElement!.style.borderColor = '#e5e5e5')}
                className="w-full bg-transparent text-black text-sm placeholder-gray-400 focus:outline-none resize-none"
              />
              <p className="text-right" style={{ color: '#8e8e8e', fontSize: 11, margin: '4px 0 0' }}>{caption.length}/2,200</p>
            </div>
          </div>

          {/* Location */}
          <div style={{ margin: '10px 16px 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              border: '1.5px solid #e5e5e5', borderRadius: 999, padding: '10px 16px',
              transition: 'border-color 0.15s',
            }}>
              <MapPin size={17} className="text-gray-500" />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Add location"
                onFocus={e => (e.currentTarget.parentElement!.style.borderColor = '#dc2743')}
                onBlur={e => (e.currentTarget.parentElement!.style.borderColor = '#e5e5e5')}
                className="flex-1 bg-transparent text-black text-sm placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
