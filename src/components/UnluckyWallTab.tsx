import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UnluckyBetPost, Language } from '../types';
import { Flame, Share2, AlertTriangle, MessageSquare, ThumbsUp } from 'lucide-react';
import { vexApi } from '../services/api';

export const UnluckyWallTab: React.FC<{ lang: Language }> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [posts, setPosts] = useState<UnluckyBetPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/viral/unlucky-bets')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPosts(data.posts);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleVote = async (postId: string) => {
    try {
      const res = await fetch('/api/viral/unlucky-bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', postId, userId: vexApi.getUserId() })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 animate-pulse">
        {isAr ? 'جاري التحميل...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 select-none" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-rose-500/20 p-2.5 rounded-xl border border-rose-500/30">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg font-black">{isAr ? 'مجتمع المنحوسين 😭' : 'Unlucky Wall 😭'}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr 
                ? 'شارك أسوأ خساراتك في الثواني الأخيرة! أكثر قسيمة تحصل على تصويت سيتم تعويضها مجاناً.' 
                : 'Share your worst last-minute losses! The most upvoted slip gets compensated for free.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {posts.map((post, idx) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-900">{post.userName}</span>
                <span className="text-slate-400">• {new Date(post.timestamp).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
              </div>
              <div className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                Loss: ${post.lossAmount}
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              "{post.story}"
            </p>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleVote(post.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
              >
                <Flame className="w-4 h-4" />
                <span>{post.votes} {isAr ? 'صوت' : 'Votes'}</span>
              </button>
              <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                <Share2 className="w-4 h-4" />
                <span>{isAr ? 'مشاركة' : 'Share'}</span>
              </button>
            </div>
          </motion.div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-10 text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
            {isAr ? 'لا توجد قسائم منحوسة بعد!' : 'No unlucky slips yet!'}
          </div>
        )}
      </div>
    </div>
  );
};
