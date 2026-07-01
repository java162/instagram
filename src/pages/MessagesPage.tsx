import React, { useState, useEffect, useRef } from 'react';
import { Send, SquarePen, Search, ArrowLeft, ImageIcon, Sticker as StickerIcon, Mic, MessageCircleMore, Play, Pause, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getConversations, getMessages, sendMessage, startConversation } from '../api/messages';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import TimeAgo from '../components/common/TimeAgo';
import type { Conversation, Message } from '../types';

const STICKER_CATEGORIES: Record<string, string[]> = {
  Smileys: ['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '😭', '🤣', '😏', '😴'],
  Hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💖', '💘', '💗'],
  Gestures: ['👍', '👎', '🙏', '👏', '🤝', '✌️', '🤙', '💪', '🫶', '👋', '🤞', '🤟'],
  Fun: ['🔥', '🎉', '✨', '💯', '🚀', '🌸', '🍕', '⭐', '🎶', '🥳', '🌈', '🎈'],
};
const STICKER_CATEGORY_NAMES = Object.keys(STICKER_CATEGORIES);
const ALL_STICKERS = new Set(Object.values(STICKER_CATEGORIES).flat());

function getBestAudioMime(): string {
  const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm';
}

function VoiceBubble({ src, isMe }: { src: string; isMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const bars = useRef(Array.from({ length: 22 }, (_, i) => 6 + ((i * 37) % 16))).current;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrent(audio.currentTime);
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrent(0); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const shownTime = current > 0 ? current : duration;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: isMe ? '#0095f6' : '#f0f0f0', borderRadius: 20, padding: '8px 12px', minWidth: 190 }}>
      <button
        type="button"
        onClick={toggle}
        style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer', backgroundColor: isMe ? 'rgba(255,255,255,0.25)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {playing
          ? <Pause size={13} color={isMe ? '#fff' : '#000'} fill={isMe ? '#fff' : '#000'} />
          : <Play size={13} color={isMe ? '#fff' : '#000'} fill={isMe ? '#fff' : '#000'} style={{ marginLeft: 2 }} />}
      </button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
        {bars.map((h, i) => {
          const filled = i / bars.length <= progress;
          return (
            <div
              key={i}
              style={{
                width: 2.5, height: h, borderRadius: 2,
                backgroundColor: isMe ? (filled ? '#fff' : 'rgba(255,255,255,0.4)') : (filled ? '#0095f6' : '#c7c7c7'),
                animation: playing ? `waveBar 0.8s ease-in-out ${i * 0.04}s infinite` : 'none',
              }}
            />
          );
        })}
      </div>
      <span style={{ fontSize: 11, color: isMe ? 'rgba(255,255,255,0.85)' : '#8e8e8e', flexShrink: 0 }}>{fmt(shownTime)}</span>
      <audio ref={audioRef} src={src} style={{ display: 'none' }} />
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false); // mobile: show chat panel
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [stickerCategory, setStickerCategory] = useState(STICKER_CATEGORY_NAMES[0]);
  const [recording, setRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [windowW, setWindowW] = useState(window.innerWidth);
  const [search, setSearch] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const didInit = useRef(false);
  const selectedRef = useRef<Conversation | null>(null);

  useEffect(() => {
    const onResize = () => setWindowW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isDesktop = windowW >= 768;

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const loadMessages = async (conv: Conversation) => {
    setSelected(conv);
    setShowChat(true);
    setMsgLoading(true);
    try {
      const msgs = await getMessages(conv._id);
      setMessages(msgs);
    } catch {}
    finally { setMsgLoading(false); }
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    setLoading(true);
    getConversations()
      .then(async (convs) => {
        setConversations(convs);
        const targetUserId = (location.state as any)?.userId;
        if (targetUserId) {
          const existing = convs.find(c => c.participants.some(p => p._id === targetUserId));
          if (existing) {
            loadMessages(existing);
          } else {
            try {
              const newConv = await startConversation(targetUserId);
              setConversations(prev => [newConv, ...prev]);
              loadMessages(newConv);
            } catch {}
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMediaFile(f);
    setMediaPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  const doSend = async (content: string, file?: File | null, voiceBlob?: Blob, voiceMime?: string) => {
    const conv = selectedRef.current;
    if (!conv) return;
    const optimisticId = `opt_${Date.now()}`;
    const optimistic: Message = {
      _id: optimisticId,
      sender: user!,
      content: content || (voiceBlob ? '🎤 Voice' : ''),
      media: file ? URL.createObjectURL(file) : undefined,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const fd = new FormData();
      fd.append('content', content.trim() || (voiceBlob ? '🎤 Voice message' : '📷'));
      if (file) fd.append('media', file);
      if (voiceBlob) {
        const ext = (voiceMime ?? '').includes('mp4') ? 'mp4' : (voiceMime ?? '').includes('ogg') ? 'ogg' : 'webm';
        const audioFile = new File([voiceBlob], `voice_${Date.now()}.${ext}`, { type: voiceMime ?? 'audio/webm' });
        fd.append('media', audioFile);
      }
      const msg = await sendMessage(conv._id, fd);
      setMessages(prev => prev.map(m => m._id === optimisticId ? msg : m));
      setConversations(cs => cs.map(c => c._id === conv._id ? { ...c, lastMessage: msg } : c));
    } catch (err) {
      console.error('[Messages] send error:', err);
      // keep optimistic
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !mediaFile) || !selected || sending) return;
    setSending(true);
    const t = text;
    const f = mediaFile;
    setText('');
    setMediaFile(null);
    setMediaPreview(null);
    setShowStickers(false);
    await doSend(t, f);
    setSending(false);
  };

  const handleStickerClick = async (sticker: string) => {
    if (!selected || sending) return;
    setShowStickers(false);
    setSending(true);
    await doSend(sticker);
    setSending(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getBestAudioMime();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size > 100) await doSend('', null, blob, mimeType);
      };
      recorder.start(100);
      setRecording(true);
      setRecordingSecs(0);
      recordingTimer.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch {
      alert('Mikrofonga ruxsat bering');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setRecording(false);
    setRecordingSecs(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    audioChunksRef.current = [];
    setRecording(false);
    setRecordingSecs(0);
  };

  const getOtherUser = (conv: Conversation) => conv.participants.find(p => p._id !== user?._id);
  const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Visibility logic:
  // Desktop (≥768px): always show BOTH panels
  // Mobile: show only conv list OR only chat panel
  const showConvList = isDesktop || !showChat;
  const showChatPanel = isDesktop || showChat;

  const filteredConversations = conversations.filter(conv => {
    if (!search.trim()) return true;
    const other = getOtherUser(conv);
    return other?.username.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#fff' }}>
      {/* Conversations panel */}
      {showConvList && (
        <div style={{ display: 'flex', flexDirection: 'column', width: isDesktop ? 360 : '100%', minWidth: 0, flexShrink: 0, backgroundColor: '#fafafa', borderRight: '1px solid #efefef' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageCircleMore size={18} color="#fff" />
              </div>
              <h1 style={{ color: '#000', fontWeight: 700, fontSize: 20, margin: 0 }}>Chats</h1>
            </div>
            <button style={{ background: '#fff', border: '1px solid #dbdbdb', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SquarePen size={17} />
            </button>
          </div>

          <div style={{ padding: '0 18px 14px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8e8e8e' }} />
              <input
                placeholder="Search messages"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', backgroundColor: '#fff', border: '1px solid #dbdbdb', borderRadius: 999, paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, color: '#000', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
            ) : filteredConversations.length === 0 ? (
              <p style={{ color: '#8e8e8e', fontSize: 14, textAlign: 'center', padding: 32 }}>No conversations yet</p>
            ) : (
              filteredConversations.map(conv => {
                const other = getOtherUser(conv);
                if (!other) return null;
                const isActive = selected?._id === conv._id;
                return (
                  <button
                    key={conv._id}
                    onClick={() => loadMessages(conv)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', marginBottom: 4,
                      background: isActive ? '#fff' : 'transparent',
                      boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                      borderLeft: isActive ? '3px solid #0095f6' : '3px solid transparent',
                      borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ flexShrink: 0 }}><Avatar src={other.avatar} alt={other.username} size="lg" /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <p style={{ color: '#000', fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other.username}</p>
                        {conv.lastMessage && <TimeAgo date={conv.lastMessage.createdAt} />}
                      </div>
                      <p style={{ color: '#8e8e8e', fontSize: 13, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.lastMessage?.content || 'Start a conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Chat panel */}
      {showChatPanel && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden', backgroundColor: '#fff' }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 18 }}>
              <div style={{ width: 96, height: 96, borderRadius: 24, background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={36} color="#fff" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#000', fontSize: 20, fontWeight: 600, margin: '0 0 6px' }}>Your messages</h2>
                <p style={{ color: '#8e8e8e', fontSize: 14, margin: 0 }}>Send private photos and messages to a friend or group.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #efefef', flexShrink: 0 }}>
                {!isDesktop && (
                  <button
                    onClick={() => { setShowChat(false); setSelected(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', display: 'flex', marginRight: 4 }}
                  >
                    <ArrowLeft size={22} />
                  </button>
                )}
                <Avatar src={getOtherUser(selected)?.avatar} alt={getOtherUser(selected)?.username} size="md" />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#000', fontWeight: 600, fontSize: 14, margin: 0 }}>{getOtherUser(selected)?.username}</p>
                  <p style={{ color: '#8e8e8e', fontSize: 12, margin: 0 }}>Active now</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: '#fcfcfc' }}>
                {msgLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender._id === user?._id;
                    const isVoice = msg.media && (
                      msg.media.includes('.webm') || msg.media.includes('.mp4') ||
                      msg.media.includes('.ogg') || msg.media.includes('.m4a') ||
                      msg.content === '🎤 Voice message'
                    );
                    const isSticker = !msg.media && !!msg.content && ALL_STICKERS.has(msg.content.trim());
                    return (
                      <div key={msg._id || msg.createdAt} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                        {!isMe && <Avatar src={msg.sender.avatar} alt={msg.sender.username ?? ''} size="xs" />}
                        <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          {msg.media && !isVoice && (
                            <img src={msg.media} alt="media" style={{ maxWidth: 220, borderRadius: 18, display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
                          )}
                          {msg.media && isVoice && (
                            <VoiceBubble src={msg.media} isMe={isMe} />
                          )}
                          {isSticker && (
                            <div style={{ fontSize: 52, lineHeight: 1, padding: '2px 4px' }}>{msg.content}</div>
                          )}
                          {!isSticker && msg.content && msg.content !== '🎤 Voice message' && (
                            <div
                              style={{
                                padding: '9px 14px', fontSize: 14,
                                backgroundColor: isMe ? '#0095f6' : '#f0f0f0',
                                color: isMe ? '#fff' : '#000',
                                wordBreak: 'break-word', lineHeight: 1.4,
                                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              }}
                            >
                              {msg.content}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Media preview */}
              {mediaPreview && (
                <div style={{ padding: '8px 20px', borderTop: '1px solid #efefef', flexShrink: 0 }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={mediaPreview} alt="preview" style={{ height: 80, borderRadius: 12, objectFit: 'cover' }} />
                    <button onClick={() => { setMediaPreview(null); setMediaFile(null); }} style={{ position: 'absolute', top: -6, right: -6, background: '#000', border: '1px solid #333', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                  </div>
                </div>
              )}

              {/* Sticker panel */}
              {showStickers && (
                <div style={{ borderTop: '1px solid #efefef', backgroundColor: '#fafafa', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 6, padding: '10px 20px 0', overflowX: 'auto' }}>
                    {STICKER_CATEGORY_NAMES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setStickerCategory(cat)}
                        style={{
                          background: stickerCategory === cat ? '#0095f6' : '#fff',
                          color: stickerCategory === cat ? '#fff' : '#8e8e8e',
                          border: '1px solid ' + (stickerCategory === cat ? '#0095f6' : '#dbdbdb'),
                          borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, padding: '12px 20px 16px' }}>
                    {STICKER_CATEGORIES[stickerCategory].map(s => (
                      <button
                        key={s}
                        onClick={() => handleStickerClick(s)}
                        onMouseEnter={el => (el.currentTarget.style.backgroundColor = '#eee')}
                        onMouseLeave={el => (el.currentTarget.style.backgroundColor = 'transparent')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 30, padding: '6px 0', borderRadius: 10, lineHeight: 1 }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recording */}
              {recording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: '1px solid #efefef', backgroundColor: '#fff6f6', flexShrink: 0 }}>
                  <button onClick={cancelRecording} style={{ background: '#fff', border: '1px solid #f3c6c6', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trash2 size={16} />
                  </button>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'micPulse 1.2s ease-in-out infinite' }} />
                      <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20, flex: 1, overflow: 'hidden' }}>
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} style={{ width: 3, height: 6 + (i % 5) * 3, borderRadius: 2, backgroundColor: '#ef4444', animation: `waveBar 0.6s ease-in-out ${i * 0.05}s infinite`, flexShrink: 0 }} />
                      ))}
                    </div>
                    <span style={{ color: '#000', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{fmtSecs(recordingSecs)}</span>
                  </div>
                  <button
                    onClick={stopRecording}
                    style={{ backgroundColor: '#ef4444', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              )}

              {/* Input */}
              {!recording && (
                <form
                  onSubmit={handleSend}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', flexShrink: 0 }}
                >
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#fafafa', border: '1px solid #dbdbdb', borderRadius: 999, padding: '6px 8px 6px 16px', gap: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <input
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Message..."
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#000', fontSize: 14 }}
                    />
                    <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e8e', display: 'flex', flexShrink: 0, padding: 4 }}>
                      <ImageIcon size={19} />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />
                    <button
                      type="button"
                      onClick={() => setShowStickers(v => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0, color: showStickers ? '#0095f6' : '#8e8e8e', padding: 4 }}
                    >
                      <StickerIcon size={19} />
                    </button>
                    {text.trim() || mediaFile ? (
                      <button type="submit" disabled={sending} style={{ background: '#0095f6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sending ? <Spinner size="sm" /> : <Send size={15} />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        style={{ background: 'none', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#8e8e8e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        title="Voice message"
                      >
                        <Mic size={18} />
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
