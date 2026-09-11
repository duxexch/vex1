import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SportsMatchFixture, SportsNewsItem, Language, AiMatchAnalysis } from '../types';
import { SportsFixturesSkeleton } from './SkeletonLoader';
import { SportsNotificationsModal } from './SportsNotificationsModal';
import {
  Bot,
  Sparkles,
  Trophy,
  Flame,
  Newspaper,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Clock,
  Filter,
  Calendar,
  CalendarPlus,
  ChevronRight,
  Send,
  BellRing,
} from 'lucide-react';

interface AiSportsHubTabProps {
  fixtures?: SportsMatchFixture[];
  news?: SportsNewsItem[];
  loadingFixtures?: boolean;
  onAnalyzeMatch: (fixture: SportsMatchFixture) => void;
  onTriggerAgentBroadcast?: () => void;
  lang: Language;
}

export const AiSportsHubTab: React.FC<AiSportsHubTabProps> = ({
  fixtures = [],
  news = [],
  loadingFixtures = false,
  onAnalyzeMatch,
  onTriggerAgentBroadcast,
  lang,
}) => {

  const isAr = lang === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<'fixtures' | 'news'>('fixtures');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(fixtures.map(f => f.category).filter(Boolean)))];
  const dates = ['All', ...Array.from(new Set(fixtures.map(f => f.date).filter(Boolean)))];

  const filteredFixtures = fixtures.filter(f => {
    const matchCategory = selectedCategory === 'All' || f.category === selectedCategory;
    const matchDate = selectedDate === 'All' || f.date === selectedDate;
    return matchCategory && matchDate;
  });


  const topMatch = fixtures[0];

  const handleBroadcast = async () => {
    if (!onTriggerAgentBroadcast) return;
    setBroadcastLoading(true);
    try {
      await onTriggerAgentBroadcast();
    } finally {
      setTimeout(() => setBroadcastLoading(false), 800);
    }
  };

  const downloadICS = (fixture: SportsMatchFixture) => {
    // Try to extract time (HH:MM) from kickoffTime. Default to current time + 2 hours if not found.
    const timeMatch = fixture.kickoffTime.match(/(\d{1,2}):(\d{2})/);
    const date = new Date();
    
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      date.setHours(hours, minutes, 0, 0);
    } else {
      date.setHours(date.getHours() + 2);
    }

    const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000); // Assume match duration of 2 hours

    const formatDate = (d: Date) => {
      return d.toISOString().replace(/-|:|\.\d+/g, '').substring(0, 15) + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VEX Deals//Sports Fixtures//EN
BEGIN:VEVENT
SUMMARY:${fixture.homeTeam} vs ${fixture.awayTeam} (${fixture.league})
DTSTART:${formatDate(date)}
DTEND:${formatDate(endDate)}
DESCRIPTION:Match between ${fixture.homeTeam} and ${fixture.awayTeam}. Category: ${fixture.category || 'Sports'}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fixture.homeTeam}-vs-${fixture.awayTeam}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3.5 pb-24 select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Featured AI Agent Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {isAr ? 'وكيل التحليلات التكتيكية' : 'Sports AI Agent'}
              </span>
              <h2 className="text-sm font-black text-slate-900">
                {isAr ? 'التحليلات الرياضية الذكية' : 'AI Sports Analytics'}
              </h2>
            </div>
          </div>

          <button
            onClick={handleBroadcast}
            disabled={broadcastLoading}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
            title={isAr ? 'بث توقع ذكي فوري' : 'Broadcast AI Prediction'}
          >
            {broadcastLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isAr ? 'بث توقع' : 'Broadcast'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          {isAr
            ? 'تحليل تكتيكي مدعوم بالذكاء الاصطناعي لجاهزية الفرق، الغيابات ومعدلات الأهداف المتوقعة مع تنبيهات فورية.'
            : 'AI-driven tactical analysis of team readiness, line-ups, and expected goals with instant alerts.'}
        </p>

        {/* Quick Highlight of Top Match */}
        {topMatch && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                {isAr ? 'قمة الجولة' : 'Top Match'}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {topMatch.homeTeam} ضد {topMatch.awayTeam}
              </span>
            </div>

            <button
              onClick={() => onAnalyzeMatch(topMatch)}
              className="h-7 flex items-center gap-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isAr ? 'تقرير تكتيكي' : 'Analyze'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Tab Switcher: Fixtures vs News */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveSubTab('fixtures')}
          className={`flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'fixtures'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>{isAr ? 'المباريات والتوقعات' : 'Matches'}</span>
          <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-slate-100 text-slate-600 font-mono">
            {fixtures.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('news')}
          className={`flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'news'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5 text-sky-600" />
          <span>{isAr ? 'الأخبار الرياضية' : 'News'}</span>
          <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-slate-100 text-slate-600 font-mono">
            {news.length}
          </span>
        </button>
      </div>

      {/* Filters & Settings (Only for fixtures) */}
      {activeSubTab === 'fixtures' && (
        <div className="flex gap-2 mb-2">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
            >
              {categories.map(cat => (
                <option key={cat as string} value={cat as string}>
                  {cat === 'All' ? (isAr ? 'كل الرياضات' : 'All Sports') : (cat as string)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
            >
              {dates.map(d => (
                <option key={d as string} value={d as string}>
                  {d === 'All' ? (isAr ? 'كل التواريخ' : 'All Dates') : (d as string)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setNotificationsModalOpen(true)}
            className="h-[38px] px-3 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 shadow-2xs"
            title={isAr ? 'إعدادات الإشعارات' : 'Notification Settings'}
          >
            <BellRing className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fixtures List */}
      {activeSubTab === 'fixtures' && (
        <div>
          {loadingFixtures ? (
            <SportsFixturesSkeleton />
          ) : filteredFixtures.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              {isAr ? 'لا توجد مباريات مطابقة للبحث' : 'No matches found matching criteria'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredFixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-3">
                    {/* League & Kickoff */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate max-w-[140px]">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{fixture.league}</span>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {fixture.kickoffTime}
                        </span>
                        <button
                          onClick={() => downloadICS(fixture)}
                          className="p-1 rounded-md bg-slate-50 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title={isAr ? 'أضف إلى التقويم' : 'Add to Calendar'}
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Teams Showcase */}
                    <div className="flex items-center justify-between gap-3 py-2 border-y border-slate-100">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <img
                          src={fixture.homeLogo}
                          alt={fixture.homeTeam}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-xl object-contain border border-slate-200 p-0.5 bg-slate-50 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 block truncate">
                            {fixture.homeTeam}
                          </span>
                          <span className="text-[10px] text-slate-400">مضيف</span>
                        </div>
                      </div>

                      <div className="text-center px-2 shrink-0">
                        <span className="text-xs font-black text-slate-400 font-mono">VS</span>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-left" dir="ltr">
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 block text-right truncate">
                            {fixture.awayTeam}
                          </span>
                          <span className="text-[10px] text-slate-400 block text-right">ضيف</span>
                        </div>
                        <img
                          src={fixture.awayLogo}
                          alt={fixture.awayTeam}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-xl object-contain border border-slate-200 p-0.5 bg-slate-50 shrink-0"
                        />
                      </div>
                    </div>

                    {/* Odds Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-200">
                        <span className="text-[10px] text-slate-500 block mb-0.5 truncate">
                          1 ({fixture.homeTeam.slice(0, 8)})
                        </span>
                        <span className="text-xs font-black text-emerald-700 font-mono">
                          {fixture.odds.home}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-200">
                        <span className="text-[10px] text-slate-500 block mb-0.5">X (تعادل)</span>
                        <span className="text-xs font-black text-amber-700 font-mono">
                          {fixture.odds.draw}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-200">
                        <span className="text-[10px] text-slate-500 block mb-0.5 truncate">
                          2 ({fixture.awayTeam.slice(0, 8)})
                        </span>
                        <span className="text-xs font-black text-sky-700 font-mono">
                          {fixture.odds.away}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action: AI Analysis */}
                  <div className="pt-2.5 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      +18 تحليل تكتيكي
                    </span>

                    <button
                      onClick={() => onAnalyzeMatch(fixture)}
                      className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAr ? 'تقرير الذكاء الاصطناعي' : 'AI Report'}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sports News Feed */}
      {activeSubTab === 'news' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {news.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="h-40 w-full relative overflow-hidden bg-slate-100">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-emerald-700 text-[10px] font-bold border border-slate-200">
                    {item.category}
                  </span>
                </div>

                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">{item.source}</span>
                    <span>{item.publishedAt}</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SportsNotificationsModal 
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        lang={lang}
        categories={[
          { id: 'cat-1', name: 'Football', nameAr: 'كرة القدم', icon: '⚽', enabled: true, leagues: ['Premier League', 'La Liga'] },
          { id: 'cat-2', name: 'Basketball', nameAr: 'كرة السلة', icon: '🏀', enabled: true, leagues: ['NBA', 'EuroLeague'] },
          { id: 'cat-3', name: 'Tennis', nameAr: 'تنس', icon: '🎾', enabled: true, leagues: ['ATP', 'WTA'] }
        ]}
      />
    </div>
  );
};
