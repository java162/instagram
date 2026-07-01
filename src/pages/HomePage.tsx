import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getFeed, getExplore } from '../api/posts';
import { getSuggestions, toggleFollow } from '../api/users';
import { useAuthStore } from '../store/authStore';
import PostCard from '../components/post/PostCard';
import StoriesBar from '../components/stories/StoriesBar';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import type { Post, User } from '../types';

export default function HomePage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedPosts, setSuggestedPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadPosts = useCallback(async (p: number, replace = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await getFeed(p);
      const items = res.posts;
      if (replace) setPosts(items);
      else setPosts(prev => [...prev, ...items]);
      setHasMore(res.hasMore);
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setInitialLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPosts(1, true);
  }, []);

  /* When feed is empty after first load, fetch explore posts to show something */
  useEffect(() => {
    if (!initialLoaded) return;
    if (posts.length > 0) return;
    getExplore(1, 12)
      .then(r => setSuggestedPosts(r.posts))
      .catch(() => {});
  }, [initialLoaded, posts.length]);

  useEffect(() => {
    getSuggestions()
      .then(s => {
        setSuggestions(s.slice(0, 5));
        const map: Record<string, boolean> = {};
        (s as User[]).forEach(u => { map[u._id] = u.isFollowing ?? false; });
        setFollowing(map);
      })
      .catch(() => {});
  }, []);

  /* Infinite scroll */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        const next = page + 1;
        setPage(next);
        loadPosts(next);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, page, loadPosts]);

  const handleFollow = async (userId: string) => {
    const prev = following[userId];
    setFollowing(f => ({ ...f, [userId]: !prev }));
    try { await toggleFollow(userId); }
    catch { setFollowing(f => ({ ...f, [userId]: prev })); }
  };

  const isFeedEmpty = initialLoaded && posts.length === 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* Feed column */}
      <div style={{ flex: 1, maxWidth: 500, margin: '0 auto', padding: '20px 14px 20px' }}>
        <div style={{
          backgroundColor: '#fff', borderRadius: 22, border: '1px solid #f2f2f2',
          boxShadow: '0 4px 18px rgba(0,0,0,0.05)', marginBottom: 20, padding: '4px 0',
        }}>
          <StoriesBar />
        </div>

        {/* Real feed posts */}
        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onDelete={id => setPosts(ps => ps.filter(p => p._id !== id))}
          />
        ))}

        {/* Empty feed state — show suggested/explore posts */}
        {isFeedEmpty && (
          <>
            <div style={{
              padding: '14px 18px',
              marginBottom: 14,
              backgroundColor: '#fff', borderRadius: 18, border: '1px solid #f2f2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: '#737373', fontSize: 14, fontWeight: 600 }}>Suggested for you</span>
              <Link to="/explore" style={{ color: '#dc2743', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                See all
              </Link>
            </div>

            {suggestedPosts.length === 0 && !loading && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', color: '#737373',
                backgroundColor: '#fff', borderRadius: 22, border: '1px solid #f2f2f2',
              }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#000', marginBottom: 8 }}>Welcome to Instagram</p>
                <p style={{ fontSize: 14, textAlign: 'center', lineHeight: 1.5 }}>
                  Follow people to see their posts here.
                </p>
                <Link to="/explore" style={{
                  marginTop: 16, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  background: 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)', padding: '9px 20px', borderRadius: 999,
                }}>
                  Explore →
                </Link>
              </div>
            )}

            {suggestedPosts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={() => {}}
              />
            ))}
          </>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Spinner />
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 8 }} />
      </div>

      {/* Right sidebar — hidden on smaller screens */}
      <div
        className="hidden xl:block"
        style={{ width: 320, flexShrink: 0, padding: '20px 20px 32px 0' }}
      >
        <div style={{ position: 'sticky', top: 20 }}>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16, padding: 14, backgroundColor: '#fff', borderRadius: 18,
              border: '1px solid #f2f2f2', boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link to={`/${user.username}`}>
                  <Avatar src={user.avatar} alt={user.username} size="md" />
                </Link>
                <div>
                  <Link to={`/${user.username}`} style={{ color: '#000', fontSize: 14, fontWeight: 600, display: 'block', textDecoration: 'none' }}>
                    {user.username}
                  </Link>
                  <span style={{ color: '#737373', fontSize: 14 }}>{user.fullName}</span>
                </div>
              </div>
              <button style={{ color: '#dc2743', fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                Switch
              </button>
            </div>
          )}

          {suggestions.length > 0 && (
            <div style={{
              padding: 16, backgroundColor: '#fff', borderRadius: 18,
              border: '1px solid #f2f2f2', boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ color: '#737373', fontSize: 14, fontWeight: 600 }}>Suggested for you</span>
                <Link to="/explore" style={{ color: '#dc2743', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  See all
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {suggestions.map(s => (
                  <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Link to={`/${s.username}`}>
                        <Avatar src={s.avatar} alt={s.username} size="sm" />
                      </Link>
                      <div>
                        <Link to={`/${s.username}`} style={{ color: '#000', fontSize: 13, fontWeight: 600, display: 'block', textDecoration: 'none' }}>
                          {s.username}
                        </Link>
                        <span style={{ color: '#737373', fontSize: 12 }}>Suggested for you</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollow(s._id)}
                      style={{
                        color: following[s._id] ? '#000' : '#fff', fontSize: 12.5, fontWeight: 700,
                        background: following[s._id] ? '#f0f0f0' : 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)',
                        border: 'none', borderRadius: 999, padding: '6px 14px', cursor: 'pointer',
                      }}
                    >
                      {following[s._id] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, padding: '0 4px' }}>
            <p style={{ color: '#8e8e8e', fontSize: 11, lineHeight: 1.8 }}>
              About · Help · Press · API · Jobs · Privacy · Terms · Locations · Language · Meta Verified
            </p>
            <p style={{ color: '#8e8e8e', fontSize: 11, marginTop: 6 }}>© 2026 INSTAGRAM FROM META</p>
          </div>
        </div>
      </div>
    </div>
  );
}
