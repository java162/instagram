import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Volume2, VolumeX, ChevronUp, ChevronDown, Play, X, Clapperboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getExplore } from '../api/posts';
import { toggleLike, toggleSave } from '../api/posts';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import CommentModal from '../components/post/CommentModal';
import { formatCount } from '../components/common/TimeAgo';
import type { Post } from '../types';

function GlassButton({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: active ? 'rgba(237,73,86,0.85)' : 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(6px)', color: '#fff', transition: 'background-color 0.15s',
      }}
    >
      {children}
    </button>
  );
}

export default function ReelsPage() {
  const [reels, setReels] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadReels = useCallback(async (p: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getExplore(p, 10);
      const videos = res.posts.filter((post: import('../types').Post) => post.media.some((m: import('../types').MediaFile) => m.type === 'video'));
      setReels(prev => p === 1 ? videos : [...prev, ...videos]);
      setHasMore(res.hasMore);
    } catch {}
    finally { setLoading(false); }
  }, [loading]);

  useEffect(() => { loadReels(1); }, []);

  useEffect(() => {
    if (currentIdx >= reels.length - 3 && hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      loadReels(next);
    }
  }, [currentIdx]);

  const goNext = () => { if (currentIdx < reels.length - 1) setCurrentIdx(i => i + 1); };
  const goPrev = () => { if (currentIdx > 0) setCurrentIdx(i => i - 1); };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIdx, reels.length]);

  const pageBg = 'radial-gradient(circle at 15% 15%, #ffe3ec 0%, transparent 45%), radial-gradient(circle at 85% 20%, #e0ecff 0%, transparent 45%), radial-gradient(circle at 50% 95%, #f2e8ff 0%, transparent 50%), #fafafa';

  if (loading && reels.length === 0) {
    return <div className="flex items-center justify-center h-screen" style={{ background: pageBg }}><Spinner /></div>;
  }

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: pageBg, color: '#8e8e8e' }}>
        <p>No reels available</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen overflow-hidden flex items-center justify-center relative" style={{ background: pageBg }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-6%', left: '-6%', width: 280, height: 280, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(240,148,51,0.18), rgba(220,39,67,0.14))', filter: 'blur(10px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-8%', right: '-6%', width: 300, height: 300, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', filter: 'blur(10px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
        <Clapperboard size={18} color="#000" />
        <span style={{ fontWeight: 700, fontSize: 15, color: '#000' }}>Reels</span>
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute', top: 20, right: 24, zIndex: 2,
          width: 34, height: 34, borderRadius: '50%', border: '1px solid #dbdbdb',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <X size={16} color="#000" />
      </button>

      <div
        className="relative"
        style={{
          width: 400, maxWidth: '90vw', height: '90vh', maxHeight: 840,
          borderRadius: 32, overflow: 'hidden', backgroundColor: '#000',
          boxShadow: '0 30px 70px rgba(0,0,0,0.28)', border: '6px solid #fff',
        }}
      >
        {reels[currentIdx] && (
          <ReelCard
            key={reels[currentIdx]._id}
            post={reels[currentIdx]}
            isActive={true}
            onNavigate={navigate}
            onUpdate={(updated) => setReels(rs => rs.map(r => r._id === updated._id ? updated : r))}
          />
        )}
      </div>

      {/* Navigation + progress */}
      <div style={{ position: 'absolute', right: 'calc(50% - 260px)', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, zIndex: 2 }}>
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          style={{
            backgroundColor: '#fff', border: '1px solid #dbdbdb',
            borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentIdx === 0 ? 0.35 : 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <ChevronUp size={18} />
        </button>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#8e8e8e', writingMode: 'vertical-rl' }}>
          {currentIdx + 1} / {reels.length}
        </span>
        <button
          onClick={goNext}
          disabled={currentIdx >= reels.length - 1}
          style={{
            backgroundColor: '#fff', border: '1px solid #dbdbdb',
            borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentIdx >= reels.length - 1 ? 0.35 : 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {loading && reels.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2" style={{ zIndex: 2 }}>
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}

interface ReelCardProps {
  post: Post;
  isActive: boolean;
  onNavigate: (path: string) => void;
  onUpdate: (post: Post) => void;
}

function ReelCard({ post: initialPost, isActive, onNavigate, onUpdate }: ReelCardProps) {
  const [post, setPost] = useState(initialPost);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useAuthStore();

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive && playing) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive, playing]);

  const handleLike = async () => {
    const updated = { ...post, isLiked: !post.isLiked, likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 };
    setPost(updated);
    onUpdate(updated);
    try { await toggleLike(post._id); } catch {}
  };

  const handleSave = async () => {
    const updated = { ...post, isSaved: !post.isSaved };
    setPost(updated);
    onUpdate(updated);
    try { await toggleSave(post._id); } catch {}
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${post.author.username}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: `@${post.author.username} on Instagram` });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  const videoMedia = post.media.find(m => m.type === 'video');

  return (
    <div className="relative w-full h-full flex items-center">
      {/* Video */}
      <div className="relative w-full h-full" onClick={() => setPlaying(!playing)}>
        {videoMedia ? (
          <video
            ref={videoRef}
            src={videoMedia.url}
            className="w-full h-full object-cover"
            loop
            muted={muted}
            playsInline
            autoPlay
          />
        ) : (
          <img src={post.media[0]?.url} alt="reel" className="w-full h-full object-cover" />
        )}

        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play size={60} className="text-white/80 fill-white/80" />
          </div>
        )}
      </div>

      {/* Overlay info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => onNavigate(`/${post.author.username}`)}>
          <Avatar src={post.author.avatar} alt={post.author.username} size="sm" />
          <span className="text-white font-semibold text-sm">{post.author.username}</span>
          <button
            style={{
              border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px',
              borderRadius: 999, marginLeft: 4, cursor: 'pointer',
              background: 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)',
            }}
          >
            Follow
          </button>
        </div>
        {post.caption && (
          <p className="text-white text-sm leading-snug line-clamp-2 mb-1">{post.caption}</p>
        )}
        {post.location && (
          <p className="text-white/70 text-xs">{post.location}</p>
        )}
      </div>

      {/* Right action buttons */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <GlassButton onClick={handleLike} active={post.isLiked}>
            <Heart size={19} className={post.isLiked ? 'fill-white text-white' : 'text-white'} />
          </GlassButton>
          <span className="text-white text-xs font-semibold">{formatCount(post.likesCount)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <GlassButton onClick={() => setShowComments(true)}>
            <MessageCircle size={19} className="text-white" />
          </GlassButton>
          <span className="text-white text-xs font-semibold">{formatCount(post.commentsCount)}</span>
        </div>
        <GlassButton onClick={handleShare}>
          <Send size={19} className="text-white" />
        </GlassButton>
        <GlassButton onClick={handleSave} active={post.isSaved}>
          <Bookmark size={19} className={post.isSaved ? 'fill-white text-white' : 'text-white'} />
        </GlassButton>
        <GlassButton onClick={() => setMuted(!muted)}>
          {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
        </GlassButton>
        <GlassButton>
          <MoreHorizontal size={19} />
        </GlassButton>
      </div>

      <CommentModal
        postId={post._id}
        post={post}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onLikePost={handleLike}
        onCommentAdded={() => setPost(p => ({ ...p, commentsCount: p.commentsCount + 1 }))}
      />
    </div>
  );
}
