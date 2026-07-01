import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  ChevronLeft, ChevronRight, Volume2, VolumeX
} from 'lucide-react';
import Avatar from '../common/Avatar';
import TimeAgo, { formatCount } from '../common/TimeAgo';
import { toggleLike, toggleSave, deletePost } from '../../api/posts';
import { useAuthStore } from '../../store/authStore';
import type { Post } from '../../types';
import CommentModal from './CommentModal';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

export default function PostCard({ post: initialPost, onDelete }: PostCardProps) {
  const [post, setPost] = useState(initialPost);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [muted, setMuted] = useState(true);
  const lastTap = useRef(0);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const currentMedia = post.media[mediaIndex];
  const isOwner = user?._id === post.author._id;

  const handleLike = async () => {
    const wasLiked = post.isLiked;
    // Optimistic update
    setPost(p => ({
      ...p,
      isLiked: !wasLiked,
      likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1,
    }));
    try {
      await toggleLike(post._id);
    } catch {
      setPost(p => ({
        ...p,
        isLiked: wasLiked,
        likesCount: wasLiked ? p.likesCount + 1 : p.likesCount - 1,
      }));
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!post.isLiked) { handleLike(); }
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 800);
    }
    lastTap.current = now;
  };

  const handleSave = async () => {
    const prev = post.isSaved;
    setPost(p => ({ ...p, isSaved: !p.isSaved }));
    try {
      await toggleSave(post._id);
    } catch {
      setPost(p => ({ ...p, isSaved: prev }));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    setShowMenu(false);
    try {
      await deletePost(post._id);
      onDelete?.(post._id);
    } catch {}
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

  return (
    <article
      style={{
        backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 4px 18px rgba(0,0,0,0.06)', border: '1px solid #f2f2f2',
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: '14px 16px' }}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/${post.author.username}`)}>
          <Avatar src={post.author.avatar} alt={post.author.username} size="sm" hasStory hasUnviewed />
          <div>
            <p className="text-black text-sm font-semibold">{post.author.username}</p>
            {post.location && <p className="text-gray-500 text-xs">{post.location}</p>}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: '#f7f7f7', border: 'none', borderRadius: '50%',
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#000',
            }}
          >
            <MoreHorizontal size={17} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 bg-white border border-gray-100 shadow-xl z-20 min-w-[190px] overflow-hidden" style={{ borderRadius: 16, boxShadow: '0 12px 30px rgba(0,0,0,0.14)' }}>
              {isOwner && (
                <button onClick={handleDelete} className="w-full text-left px-4 py-3 text-red-500 text-sm hover:bg-gray-100">
                  Delete post
                </button>
              )}
              <button
                onClick={() => { navigate(`/${post.author.username}`); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-black text-sm hover:bg-gray-100"
              >
                Go to profile
              </button>
              <button onClick={() => setShowMenu(false)} className="w-full text-left px-4 py-3 text-black text-sm hover:bg-gray-100">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="relative bg-black select-none" style={{ aspectRatio: '1 / 1', margin: '0 10px', borderRadius: 18, overflow: 'hidden' }}>
        <div onClick={handleDoubleTap} className="w-full h-full">
          {currentMedia?.type === 'video' ? (
            <div className="relative w-full h-full">
              <video
                src={currentMedia.url}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted={muted}
                playsInline
              />
              <button
                onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                className="absolute bottom-3 right-3 bg-black/60 rounded-full p-1.5 text-white"
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          ) : (
            <img src={currentMedia?.url} alt="post" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Like animation */}
        {likeAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="text-white fill-white" size={80} style={{ animation: 'likeHeart 0.8s ease-out forwards' }} />
          </div>
        )}

        {/* Carousel controls */}
        {post.media.length > 1 && (
          <>
            {mediaIndex > 0 && (
              <button
                onClick={() => setMediaIndex(i => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-1.5 backdrop-blur-sm"
              >
                <ChevronLeft size={16} className="text-white" />
              </button>
            )}
            {mediaIndex < post.media.length - 1 && (
              <button
                onClick={() => setMediaIndex(i => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-1.5 backdrop-blur-sm"
              >
                <ChevronRight size={16} className="text-white" />
              </button>
            )}
            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {post.media.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${i === mediaIndex ? 'w-2 h-2 bg-blue-500' : 'w-1.5 h-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between" style={{ padding: '12px 16px 0' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
              backgroundColor: post.isLiked ? 'rgba(237,73,86,0.1)' : '#f7f7f7',
              transition: 'transform 0.1s, background-color 0.15s',
            }}
            className="active:scale-90"
          >
            <Heart
              size={20}
              className={post.isLiked ? 'fill-red-500 text-red-500' : 'text-black'}
            />
          </button>
          <button
            onClick={() => setShowComments(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
              backgroundColor: '#f7f7f7',
            }}
          >
            <MessageCircle size={20} className="text-black" />
          </button>
          <button
            onClick={handleShare}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
              backgroundColor: '#f7f7f7',
            }}
          >
            <Send size={20} className="text-black" />
          </button>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
            backgroundColor: post.isSaved ? '#f0f0f0' : '#f7f7f7',
          }}
        >
          <Bookmark size={20} className={post.isSaved ? 'fill-black text-black' : 'text-black'} />
        </button>
      </div>

      {/* Likes */}
      <div style={{ padding: '10px 16px 0' }}>
        {post.likesCount > 0 && (
          <p className="text-black text-sm font-semibold">{formatCount(post.likesCount)} likes</p>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div style={{ padding: '4px 16px 0' }}>
          <p className="text-black text-sm">
            <Link to={`/${post.author.username}`} className="font-semibold mr-1">{post.author.username}</Link>
            <CaptionText text={post.caption} />
          </p>
        </div>
      )}

      {/* Comments link */}
      {post.commentsCount > 0 && (
        <button
          onClick={() => setShowComments(true)}
          className="text-gray-500 text-sm hover:text-gray-700"
          style={{ padding: '6px 16px 0', display: 'block' }}
        >
          View all {post.commentsCount} comments
        </button>
      )}

      {/* Time */}
      <div style={{ padding: '6px 16px 16px' }}>
        <TimeAgo date={post.createdAt} />
      </div>

      <CommentModal
        postId={post._id}
        post={post}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onLikePost={handleLike}
        onCommentAdded={() => setPost(p => ({ ...p, commentsCount: p.commentsCount + 1 }))}
      />
    </article>
  );
}

function CaptionText({ text }: { text: string }) {
  const parts = text.split(/(#\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <span key={i} className="text-blue-400">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
