'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Send, Brain, TrendingUp, Heart, Calendar, BarChart3, Lightbulb, Save, MessageCircle, Target } from 'lucide-react'

interface MoodEntry {
  id: string
  date: string
  entry: string
  isIncident?: boolean
  responseRole?: 'mom' | 'dad' | 'brother' | 'close_friend' | 'lover' | 'counselor' | 'supportive_friend'
  aiSentiment: {
    emotions: string[]
    dominantEmotion: string
    intensity: number // 1-10
    sentiment: 'positive' | 'negative' | 'neutral'
  }
  aiInsight: string
  suggestions: string[]
  timestamp: number
}

interface TrendData {
  weeklyTrend: string
  monthlyComparison: string
  emotionalPatterns: { [emotion: string]: number }
  insights: string[]
  recommendations: string[]
}

const emotionEmojis: { [key: string]: string } = {
  'happy': '�',
  'sad': '�',
  'angry': '�',
  'anxious': '�',
  'stressed': '😫',
  'calm': '😌',
  'excited': '🤩',
  'frustrated': '😤',
  'grateful': '🙏',
  'lonely': '😞',
  'confident': '💪',
  'overwhelmed': '🤯',
  'peaceful': '☮️',
  'hopeful': '🌟',
  'tired': '😴',
  'energetic': '⚡',
  'content': '😌'
}

export default function Home() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [journalEntry, setJournalEntry] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentView, setCurrentView] = useState<'journal' | 'insights' | 'trends'>('journal')
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [incidentMode, setIncidentMode] = useState(false)
  const [responseRole, setResponseRole] = useState<'mom' | 'dad' | 'brother' | 'close_friend' | 'lover' | 'counselor' | 'supportive_friend'>('close_friend')
  const [typedText, setTypedText] = useState('')
  const [videoIndex, setVideoIndex] = useState(0)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  const fullQuote = "The greatest revolution of our generation is the discovery that human beings, by changing the inner attitudes of their minds, can change the outer aspects of their lives."

  // Load mood entries from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('moodJournalEntries')
    if (saved) {
      const entries = JSON.parse(saved)
      setMoodEntries(entries)
      generateTrendData(entries)
    }
  }, [])

  // Save mood entries to localStorage whenever they change
  useEffect(() => {
    if (moodEntries.length > 0) {
      localStorage.setItem('moodJournalEntries', JSON.stringify(moodEntries))
      generateTrendData(moodEntries)
    }
  }, [moodEntries])

  // Typing effect for the quote
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullQuote.length) {
        setTypedText(fullQuote.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        // Hide cursor after typing is complete
        setTimeout(() => setShowCursor(false), 500);
      }
    }, 50); // Adjust speed here (lower = faster)

    return () => clearInterval(timer);
  }, [fullQuote])

  // Advanced seamless video loop with precise timing
  useEffect(() => {
    let currentVideo = 0; // 0 for video1, 1 for video2
    let isTransitioning = false;
    let timeUpdateHandler1: (() => void) | null = null;
    let timeUpdateHandler2: (() => void) | null = null;
    let endedHandler1: (() => void) | null = null;
    let endedHandler2: (() => void) | null = null;

    const setupPerfectLoop = () => {
      const video1 = document.querySelector('#video1') as HTMLVideoElement;
      const video2 = document.querySelector('#video2') as HTMLVideoElement;
      
      if (!video1 || !video2) return false;

      // Enhanced video preparation
      const prepareVideos = async () => {
        try {
          // Ensure both videos are fully loaded
          await Promise.all([
            new Promise(resolve => {
              if (video1.readyState >= 3) resolve(true);
              else video1.addEventListener('loadeddata', () => resolve(true), { once: true });
            }),
            new Promise(resolve => {
              if (video2.readyState >= 3) resolve(true);
              else video2.addEventListener('loadeddata', () => resolve(true), { once: true });
            })
          ]);

          // Set initial states
          video1.currentTime = 0;
          video2.currentTime = 0;
          video1.style.opacity = '1';
          video2.style.opacity = '0';
          
          // Precise crossfade timing - start transition 0.5 seconds before end
          const createTimeUpdateHandler = (activeVideo: HTMLVideoElement, nextVideo: HTMLVideoElement, videoIndex: number) => {
            return () => {
              if (isTransitioning) return;
              
              const timeRemaining = activeVideo.duration - activeVideo.currentTime;
              
              if (timeRemaining <= 0.5 && timeRemaining > 0) {
                isTransitioning = true;
                
                // Prepare next video
                nextVideo.currentTime = 0;
                nextVideo.style.opacity = '0';
                
                // Start next video
                nextVideo.play().then(() => {
                  // Smooth crossfade over 0.3 seconds
                  nextVideo.style.transition = 'opacity 0.3s ease-out';
                  activeVideo.style.transition = 'opacity 0.3s ease-out';
                  
                  requestAnimationFrame(() => {
                    nextVideo.style.opacity = '1';
                    activeVideo.style.opacity = '0';
                  });
                  
                  // Complete transition after fade
                  setTimeout(() => {
                    activeVideo.pause();
                    activeVideo.currentTime = 0;
                    currentVideo = videoIndex === 0 ? 1 : 0;
                    isTransitioning = false;
                  }, 350);
                }).catch(e => {
                  console.log('Video transition failed:', e);
                  isTransitioning = false;
                });
              }
            };
          };

          // Alternative: Use 'ended' event as backup
          const createEndedHandler = (activeVideo: HTMLVideoElement, nextVideo: HTMLVideoElement, videoIndex: number) => {
            return () => {
              if (isTransitioning) return;
              
              isTransitioning = true;
              nextVideo.currentTime = 0;
              nextVideo.style.opacity = '1';
              activeVideo.style.opacity = '0';
              nextVideo.play();
              
              setTimeout(() => {
                activeVideo.currentTime = 0;
                currentVideo = videoIndex === 0 ? 1 : 0;
                isTransitioning = false;
              }, 50);
            };
          };

          // Set up event handlers
          timeUpdateHandler1 = createTimeUpdateHandler(video1, video2, 0);
          timeUpdateHandler2 = createTimeUpdateHandler(video2, video1, 1);
          endedHandler1 = createEndedHandler(video1, video2, 0);
          endedHandler2 = createEndedHandler(video2, video1, 1);

          video1.addEventListener('timeupdate', timeUpdateHandler1);
          video2.addEventListener('timeupdate', timeUpdateHandler2);
          video1.addEventListener('ended', endedHandler1);
          video2.addEventListener('ended', endedHandler2);

          // Start first video
          await video1.play();
          
        } catch (error) {
          console.log('Video setup failed:', error);
        }
      };

      prepareVideos();
      return true;
    };

    // Wait for DOM and videos to be ready
    const initializeVideos = () => {
      if (setupPerfectLoop()) {
        return;
      }
      setTimeout(initializeVideos, 100);
    };

    // Start after a brief delay to ensure DOM is ready
    setTimeout(initializeVideos, 200);

    // Cleanup function
    return () => {
      const video1 = document.querySelector('#video1') as HTMLVideoElement;
      const video2 = document.querySelector('#video2') as HTMLVideoElement;
      
      if (video1 && timeUpdateHandler1) {
        video1.removeEventListener('timeupdate', timeUpdateHandler1);
      }
      if (video2 && timeUpdateHandler2) {
        video2.removeEventListener('timeupdate', timeUpdateHandler2);
      }
      if (video1 && endedHandler1) {
        video1.removeEventListener('ended', endedHandler1);
      }
      if (video2 && endedHandler2) {
        video2.removeEventListener('ended', endedHandler2);
      }
    };
  }, [])

  const generateTrendData = (entries: MoodEntry[]) => {
    if (entries.length === 0) return

    const recent = entries.slice(-7) // Last 7 entries
    const thisWeek = recent.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return entryDate >= weekAgo
    })

    const lastMonth = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return entryDate >= monthAgo
    })

    // Calculate emotional patterns
    const emotionalPatterns: { [emotion: string]: number } = {}
    recent.forEach(entry => {
      entry.aiSentiment.emotions.forEach(emotion => {
        emotionalPatterns[emotion] = (emotionalPatterns[emotion] || 0) + 1
      })
    })

    // Generate insights
    const insights = []
    const positiveCount = recent.filter(e => e.aiSentiment.sentiment === 'positive').length
    const negativeCount = recent.filter(e => e.aiSentiment.sentiment === 'negative').length
    
    if (positiveCount > negativeCount) {
      insights.push("You've been experiencing more positive emotions recently!")
    } else if (negativeCount > positiveCount) {
      insights.push("You've been having some challenging times lately.")
    }

    // Week trend analysis
    let weeklyTrend = 'stable'
    if (thisWeek.length >= 3) {
      const firstHalf = thisWeek.slice(0, Math.ceil(thisWeek.length / 2))
      const secondHalf = thisWeek.slice(Math.ceil(thisWeek.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, entry) => sum + entry.aiSentiment.intensity, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, entry) => sum + entry.aiSentiment.intensity, 0) / secondHalf.length
      
      if (secondAvg > firstAvg + 1) weeklyTrend = 'improving'
      else if (secondAvg < firstAvg - 1) weeklyTrend = 'declining'
    }

    setTrendData({
      weeklyTrend,
      monthlyComparison: `${lastMonth.length} entries this month`,
      emotionalPatterns,
      insights,
      recommendations: generateRecommendations(emotionalPatterns, weeklyTrend)
    })
  }

  const generateRecommendations = (patterns: { [emotion: string]: number }, trend: string): string[] => {
    const recommendations = []
    
    if (patterns['stressed'] > 2) {
      recommendations.push("Consider stress management techniques like deep breathing or meditation")
    }
    if (patterns['anxious'] > 2) {
      recommendations.push("Try grounding exercises: name 5 things you can see, 4 you can touch, etc.")
    }
    if (patterns['sad'] > 2) {
      recommendations.push("Reach out to friends or family, or engage in activities you enjoy")
    }
    if (trend === 'declining') {
      recommendations.push("Your mood seems to be declining. Consider talking to someone or practicing self-care")
    }
    if (trend === 'improving') {
      recommendations.push("Great progress! Keep doing what you're doing")
    }

    return recommendations.slice(0, 3) // Max 3 recommendations
  }

  const saveMoodEntry = async () => {
    if (!journalEntry.trim()) return

    setIsAnalyzing(true)
    
    const now = new Date()
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      date: now.toISOString().split('T')[0],
      entry: journalEntry,
      isIncident: incidentMode,
      responseRole: responseRole,
      aiSentiment: {
        emotions: [],
        dominantEmotion: '',
        intensity: 5,
        sentiment: 'neutral'
      },
      aiInsight: '',
      suggestions: [],
      timestamp: Date.now()
    }

    try {
      // Get AI analysis
      const response = await fetch('/api/mood-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          entry: journalEntry,
          previousEntries: moodEntries.slice(-5), // Last 5 entries for context
          isIncident: incidentMode,
          responseRole: responseRole
        }),
      })

      if (response.ok) {
        const data = await response.json()
        newEntry.aiSentiment = data.sentiment
        newEntry.aiInsight = data.insight
        newEntry.suggestions = data.suggestions || []
      }
    } catch (error) {
      console.error('Failed to get AI analysis:', error)
      newEntry.aiInsight = "Thanks for sharing your thoughts. Reflecting on your feelings is an important step in emotional wellness."
    }

    setMoodEntries(prev => [...prev, newEntry])
    
    // Reset form
    setJournalEntry('')
    setIncidentMode(false)
    setIsAnalyzing(false)
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const dateStr = date.toLocaleDateString()
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${dateStr} at ${timeStr}`
  }

  const getEmotionEmoji = (emotion: string) => {
    return emotionEmojis[emotion.toLowerCase()] || '😐'
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'from-green-500 to-emerald-500'
      case 'negative': return 'from-red-500 to-red-600'
      default: return 'from-yellow-500 to-orange-500'
    }
  }

  return (
    <main className="min-h-screen relative">
      {/* Dual Video Background for Seamless Loop */}
      <video 
        id="video1"
        autoPlay 
        muted 
        playsInline
        preload="auto"
        className="video-background"
        style={{ transition: 'opacity 0.2s ease-in-out' }}
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <video 
        id="video2"
        muted 
        playsInline
        preload="auto"
        className="video-background"
        style={{ transition: 'opacity 0.2s ease-in-out', opacity: 0 }}
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Overlay for better text readability */}
      <div className="video-overlay"></div>
      
      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col relative z-10">
        {/* Header */}
        <div className="text-center text-slate-800 mb-6 flex-shrink-0">
          <div className="flex justify-center items-center mb-4">
            <h1 className="text-5xl italic text-slate-900 font-bold tracking-tight text-center drop-shadow-lg" style={{ fontFamily: 'Dancing Script, Brush Script MT, cursive', letterSpacing: '0.02em', textShadow: '2px 2px 4px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8)' }}>
              .                   .
            </h1>
          </div>
          <p className="text-xl font-semibold text-black mb-4" style={{textShadow: '1px 1px 2px rgba(255,255,255,0.8)'}}>Track your emotions, discover patterns, and get AI insights</p>
          
          {/* Inspirational Quote */}
          <div className="max-w-2xl mx-auto p-4 rounded-lg mb-4">
            <div className="flex items-center justify-center mb-2">
              <p className="text-lg italic text-slate-900 font-bold text-center drop-shadow-lg" style={{textShadow: '2px 2px 4px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8)'}}>
                "<span className="inline-block">{typedText}</span>{showCursor && <span className="animate-pulse">|</span>}"
              </p>
            </div>
            <p className="text-sm text-slate-800 font-semibold text-center" style={{textShadow: '1px 1px 2px rgba(255,255,255,0.8)'}}>- William James, Psychologist</p>
            <p className="text-sm text-slate-700 font-medium mt-1 text-center" style={{textShadow: '1px 1px 2px rgba(255,255,255,0.8)'}}>Your emotional wellness journey starts here</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-6 flex-shrink-0">
          <div className="spiritual-glass rounded-lg p-1 flex space-x-1">
            <button
              onClick={() => {
                console.log('Switching to journal view');
                setCurrentView('journal');
              }}
              className={`px-6 py-2 rounded-md transition-all font-medium ${
                currentView === 'journal'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg button-glow'
                  : 'text-slate-700 hover:bg-white/30'
              }`}
            >
              📝 Daily Journal
            </button>
            <button
              onClick={() => {
                console.log('Switching to insights view');
                setCurrentView('insights');
              }}
              className={`px-6 py-2 rounded-md transition-all font-medium ${
                currentView === 'insights'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg button-glow'
                  : 'text-slate-700 hover:bg-white/30'
              }`}
            >
              🧠 AI Insights
            </button>
            <button
              onClick={() => {
                console.log('Switching to trends view');
                setCurrentView('trends');
              }}
              className={`px-6 py-2 rounded-md transition-all font-medium ${
                currentView === 'trends'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold shadow-lg button-glow'
                  : 'text-slate-700 hover:bg-white/30'
              }`}
            >
              📊 Trends & History
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          {/* Journal Entry View */}
          {currentView === 'journal' && (
            <div className="h-full spiritual-glass rounded-lg p-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Left: Entry Form */}
                <div className="space-y-6 h-fit">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">How are you feeling today?</h3>
                    
                    {/* Incident Mode Toggle */}
                    <div className="bg-slate-100 rounded-lg p-4 mb-4 border border-slate-200">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="incidentMode"
                          checked={incidentMode}
                          onChange={(e) => setIncidentMode(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="incidentMode" className="text-slate-700 font-medium">
                          🚨 Specific Incident Mode
                        </label>
                        <span className="text-slate-500 text-sm">
                          (Get targeted advice for specific situations)
                        </span>
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 border border-blue-200">
                      <h4 className="text-slate-800 font-semibold mb-3 flex items-center">
                        💭 Choose who you want support from:
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <button
                          onClick={() => setResponseRole('mom')}
                          className={`p-3 rounded-lg text-left transition-all ${
                            responseRole === 'mom'
                              ? 'bg-pink-500 text-white shadow-lg transform scale-105'
                              : 'bg-white/70 text-slate-700 hover:bg-pink-100 border border-pink-200'
                          }`}
                        >
                          <div className="text-lg mb-1">👩 Mom</div>
                          <div className="text-xs opacity-80">Loving & nurturing</div>
                        </button>
                        
                        <button
                          onClick={() => setResponseRole('dad')}
                          className={`p-3 rounded-lg text-left transition-all ${
                            responseRole === 'dad'
                              ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                              : 'bg-white/70 text-slate-700 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          <div className="text-lg mb-1">👨 Dad</div>
                          <div className="text-xs opacity-80">Encouraging & wise</div>
                        </button>
                        
                        <button
                          onClick={() => setResponseRole('brother')}
                          className={`p-3 rounded-lg text-left transition-all ${
                            responseRole === 'brother'
                              ? 'bg-green-500 text-white shadow-lg transform scale-105'
                              : 'bg-white/70 text-slate-700 hover:bg-green-100 border border-green-200'
                          }`}
                        >
                          <div className="text-lg mb-1">👫 Sibling</div>
                          <div className="text-xs opacity-80">Real talk & loyal</div>
                        </button>
                        
                        <button
                          onClick={() => setResponseRole('close_friend')}
                          className={`p-3 rounded-lg text-left transition-all ${
                            responseRole === 'close_friend'
                              ? 'bg-yellow-500 text-white shadow-lg transform scale-105'
                              : 'bg-white/70 text-slate-700 hover:bg-yellow-100 border border-yellow-200'
                          }`}
                        >
                          <div className="text-lg mb-1">👥 Best Friend</div>
                          <div className="text-xs opacity-80">Super supportive</div>
                        </button>
                        
                        <button
                          onClick={() => setResponseRole('lover')}
                          className={`p-3 rounded-lg text-left transition-all ${
                            responseRole === 'lover'
                              ? 'bg-red-500 text-white shadow-lg transform scale-105'
                              : 'bg-white/70 text-slate-700 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          <div className="text-lg mb-1">💕 Partner</div>
                          <div className="text-xs opacity-80">Romantic & tender</div>
                        </button>
                        
                        <button
                          onClick={() => setResponseRole('counselor')}
                          className={`p-3 rounded-lg text-left transition-all ${
                            responseRole === 'counselor'
                              ? 'bg-purple-500 text-white shadow-lg transform scale-105'
                              : 'bg-white/70 text-slate-700 hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          <div className="text-lg mb-1">🧠 Counselor</div>
                          <div className="text-xs opacity-80">Professional & helpful</div>
                        </button>
                        
                        <button
                          onClick={() => setResponseRole('supportive_friend')}
                          className={`p-3 rounded-lg text-left transition-all ${
                            responseRole === 'supportive_friend'
                              ? 'bg-teal-500 text-white shadow-lg transform scale-105'
                              : 'bg-white/70 text-slate-700 hover:bg-teal-100 border border-teal-200'
                          }`}
                        >
                          <div className="text-lg mb-1">🤝 Support Friend</div>
                          <div className="text-xs opacity-80">Balanced & wise</div>
                        </button>
                      </div>
                      
                      <div className="mt-3 text-center">
                        <span className="text-sm text-slate-600 bg-white/60 px-3 py-1 rounded-full">
                          Selected: <span className="font-semibold capitalize">{responseRole.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>

                    {/* Journal Entry */}
                    <div>
                      <h4 className="text-slate-700 font-semibold mb-3">
                        {incidentMode ? 
                          "Tell me about what happened and how it made you feel..." : 
                          "Write about your day, feelings, or what's on your mind..."
                        }
                      </h4>
                      <textarea
                        value={journalEntry}
                        onChange={(e) => setJournalEntry(e.target.value)}
                        placeholder={incidentMode ? 
                          "Describe the specific incident, what happened, who was involved, and how it affected you emotionally..." :
                          "What happened today? How are you feeling? What are you grateful for? Any thoughts or emotions you want to explore..."
                        }
                        className="w-full h-40 bg-white/70 text-slate-800 placeholder-slate-500 px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200"
                      />
                      <div className="flex justify-between text-sm text-slate-500 mt-2">
                        <span>{journalEntry.trim().length} characters</span>
                        <span className={journalEntry.trim().length < 50 ? "text-red-500" : "text-green-600"}>
                          {journalEntry.trim().length < 50 ? `Need ${50 - journalEntry.trim().length} more characters` : "Ready for AI analysis"}
                        </span>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={saveMoodEntry}
                      disabled={isAnalyzing || journalEntry.trim().length < 50}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 button-glow"
                    >
                      {isAnalyzing ? (
                        <>
                          <Brain className="animate-spin" size={20} />
                          <span>AI is analyzing your emotions...</span>
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          <span>Analyze & Save Entry</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right: Recent Entries */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">Recent Entries</h3>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2" style={{scrollbarWidth: 'thin'}}>
                    {moodEntries.slice(-10).reverse().map(entry => (
                      <div key={entry.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mood-entry border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-slate-700 font-semibold text-sm">{formatDateTime(entry.timestamp)}</span>
                            <div className={`inline-block ml-2 px-2 py-1 rounded text-xs text-white bg-gradient-to-r ${getSentimentColor(entry.aiSentiment.sentiment)}`}>
                              {entry.aiSentiment.sentiment} • {entry.aiSentiment.intensity}/10
                            </div>
                            {entry.isIncident && (
                              <div className="inline-block ml-2 px-2 py-1 rounded text-xs text-white bg-red-600 font-semibold">
                                🚨 Incident Report
                              </div>
                            )}
                            {entry.responseRole && (
                              <div className="inline-block ml-2 px-2 py-1 rounded text-xs text-white bg-gradient-to-r from-purple-500 to-pink-500 font-semibold">
                                💭 {entry.responseRole === 'mom' ? '👩 Mom' : 
                                     entry.responseRole === 'dad' ? '👨 Dad' : 
                                     entry.responseRole === 'brother' ? '👫 Sibling' : 
                                     entry.responseRole === 'close_friend' ? '👥 Best Friend' : 
                                     entry.responseRole === 'lover' ? '💕 Partner' : 
                                     entry.responseRole === 'counselor' ? '🧠 Counselor' :
                                     '🤝 Support Friend'} Support
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* ALL Detected Emotions */}
                        <div className="mb-3">
                          <div className="text-slate-700 text-xs font-semibold mb-2">🧠 Detected Emotions:</div>
                          <div className="flex flex-wrap gap-1">
                            {entry.aiSentiment.emotions.length > 0 ? (
                              entry.aiSentiment.emotions.map((emotion, idx) => (
                                <span key={idx} className={`text-white text-xs px-2 py-1 rounded flex items-center space-x-1 ${
                                  idx === 0 ? 'bg-indigo-600 font-semibold' : 'bg-indigo-500'
                                }`}>
                                  <span>{getEmotionEmoji(emotion)}</span>
                                  <span>{emotion}</span>
                                  {idx === 0 && <span className="text-yellow-300">★</span>}
                                </span>
                              ))
                            ) : (
                              <span className="bg-slate-500 text-white text-xs px-2 py-1 rounded">
                                😐 neutral
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className={`rounded p-3 mb-3 ${entry.isIncident ? 'bg-red-50 border-2 border-red-200' : 'bg-slate-50'}`}>
                          {entry.isIncident ? (
                            <div>
                              <div className="flex items-center mb-2">
                                <span className="text-red-700 text-xs font-bold">🚨 COMPLETE INCIDENT REPORT:</span>
                              </div>
                              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{entry.entry}</p>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center mb-2">
                                <span className="text-slate-600 text-xs font-bold">📝 COMPLETE ENTRY:</span>
                              </div>
                              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{entry.entry}</p>
                            </div>
                          )}
                        </div>
                        
                        {entry.aiInsight && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center space-x-1 mb-2">
                              <Lightbulb size={16} className="text-blue-600" />
                              <span className="text-blue-800 text-sm font-semibold">💖 AI Insight</span>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed">{entry.aiInsight}</p>
                          </div>
                        )}
                        
                        {entry.suggestions.length > 0 && (
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-3">
                            <div className="flex items-center space-x-1 mb-2">
                              <Target size={16} className="text-emerald-600" />
                              <span className="text-emerald-800 text-sm font-semibold">🎯 Personal Suggestions</span>
                            </div>
                            <ul className="text-slate-700 text-sm space-y-1 leading-relaxed">
                              {entry.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                  <span className="text-emerald-600 mt-1">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {moodEntries.length === 0 && (
                      <div className="text-center text-slate-600 py-8">
                        <div className="flex justify-center items-center mb-4">
                          <span className="text-6xl sticker-glow">🌱</span>
                        </div>
                        <p className="text-xl mb-2 text-slate-700">Start your emotional wellness journey!</p>
                        <p className="text-sm mt-2 mb-4 text-slate-500">Write your first daily entry to get AI insights</p>
                        <div className="bg-white/70 backdrop-blur-sm border border-slate-200 max-w-sm mx-auto p-4 rounded-lg">
                          <p className="text-sm italic text-slate-700 mb-2">
                            "The journey of a thousand miles begins with one step"
                          </p>
                          <p className="text-xs text-slate-500">- Lao Tzu, Ancient Chinese Philosopher</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights View */}
          {currentView === 'insights' && (
            <div className="h-full spiritual-glass rounded-lg p-6 overflow-y-auto">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">🧠 AI Emotional Insights</h3>
              
              {!trendData || moodEntries.length === 0 ? (
                <div className="text-center text-slate-600 py-12">
                  <div className="flex justify-center items-center mb-6">
                    <span className="text-6xl sticker-glow">🔮</span>
                    <span className="text-6xl sticker-glow ml-4">💡</span>
                  </div>
                  <p className="text-2xl mb-4 text-slate-700">Your insights are growing!</p>
                  <p className="text-lg mb-4 text-slate-600">Write a few journal entries to unlock AI insights about your emotional patterns</p>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200 max-w-md mx-auto p-4 rounded-lg">
                    <p className="text-sm italic text-slate-700 mb-2">
                      "Knowing yourself is the beginning of all wisdom"
                    </p>
                    <p className="text-xs text-slate-500">- Aristotle, Ancient Greek Philosopher</p>
                  </div>
                  <p className="text-sm text-slate-400 mt-4">You need at least 1 journal entry to generate insights</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Weekly Trend */}
                    <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-6 text-center shadow-sm">
                      <div className="text-4xl mb-2">
                        {trendData.weeklyTrend === 'improving' ? '📈' : 
                         trendData.weeklyTrend === 'declining' ? '📉' : '➡️'}
                      </div>
                      <h4 className="text-slate-700 font-semibold mb-2">Weekly Trend</h4>
                      <p className="text-xl font-bold text-slate-800 capitalize">{trendData.weeklyTrend}</p>
                    </div>

                    {/* Dominant Emotions */}
                    <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-slate-700 font-semibold mb-3 text-center">Top Emotions This Week</h4>
                      <div className="space-y-2">
                        {Object.entries(trendData.emotionalPatterns)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([emotion, count], index) => (
                          <div key={emotion} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span>{getEmotionEmoji(emotion)}</span>
                              <span className="text-slate-700 capitalize">{emotion}</span>
                            </div>
                            <span className="text-slate-500">{count} times</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <Brain className="text-blue-600" size={24} />
                      <h4 className="text-slate-800 font-bold text-xl">AI Analysis</h4>
                    </div>
                    <div className="space-y-3">
                      {trendData.insights.map((insight, index) => (
                        <p key={index} className="text-slate-700">{insight}</p>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <Target className="text-emerald-600" size={24} />
                      <h4 className="text-slate-800 font-bold text-xl">Personalized Recommendations</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trendData.recommendations.map((rec, index) => (
                        <div key={index} className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <p className="text-slate-700 text-sm">• {rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Trends & History View */}
          {currentView === 'trends' && (
            <div className="h-full spiritual-glass rounded-lg p-6 overflow-y-auto">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">📊 Emotional History & Complete Entries</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Complete Entries History */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-slate-700 font-semibold mb-4">All Your Journal Entries (Latest First)</h4>
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {moodEntries.slice().reverse().map(entry => (
                      <div key={entry.id} className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-slate-700 font-semibold text-sm">{formatDateTime(entry.timestamp)}</span>
                            <div className={`inline-block ml-2 px-2 py-1 rounded text-xs text-white bg-gradient-to-r ${getSentimentColor(entry.aiSentiment.sentiment)}`}>
                              {entry.aiSentiment.sentiment} • {entry.aiSentiment.intensity}/10
                            </div>
                            {entry.isIncident && (
                              <div className="inline-block ml-2 px-2 py-1 rounded text-xs text-white bg-red-600 font-semibold">
                                🚨 Incident Report
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Emotions */}
                        <div className="mb-3">
                          <div className="text-slate-700 text-xs font-semibold mb-2">🧠 Emotions:</div>
                          <div className="flex flex-wrap gap-1">
                            {entry.aiSentiment.emotions.length > 0 ? (
                              entry.aiSentiment.emotions.map((emotion, idx) => (
                                <span key={idx} className={`text-white text-xs px-2 py-1 rounded flex items-center space-x-1 ${
                                  idx === 0 ? 'bg-indigo-600 font-semibold' : 'bg-indigo-500'
                                }`}>
                                  <span>{getEmotionEmoji(emotion)}</span>
                                  <span>{emotion}</span>
                                  {idx === 0 && <span className="text-yellow-300">★</span>}
                                </span>
                              ))
                            ) : (
                              <span className="bg-slate-500 text-white text-xs px-2 py-1 rounded">
                                😐 neutral
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* FULL ENTRY TEXT - Always show complete text */}
                        <div className={`rounded p-4 mb-3 ${entry.isIncident ? 'bg-red-50 border-2 border-red-200' : 'bg-white'}`}>
                          <div className="flex items-center mb-2">
                            <span className={`text-xs font-bold ${entry.isIncident ? 'text-red-700' : 'text-slate-600'}`}>
                              {entry.isIncident ? '🚨 COMPLETE INCIDENT REPORT:' : '📝 COMPLETE ENTRY:'}
                            </span>
                          </div>
                          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{entry.entry}</p>
                        </div>
                        
                        {/* AI Insight */}
                        {entry.aiInsight && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center space-x-1 mb-2">
                              <Lightbulb size={16} className="text-blue-600" />
                              <span className="text-blue-800 text-sm font-semibold">💖 AI Insight</span>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed">{entry.aiInsight}</p>
                          </div>
                        )}
                        
                        {/* Suggestions */}
                        {entry.suggestions.length > 0 && (
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-3">
                            <div className="flex items-center space-x-1 mb-2">
                              <Target size={16} className="text-emerald-600" />
                              <span className="text-emerald-800 text-sm font-semibold">🎯 Personal Suggestions</span>
                            </div>
                            <ul className="text-slate-700 text-sm space-y-1 leading-relaxed">
                              {entry.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                  <span className="text-emerald-600 mt-1">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {moodEntries.length === 0 && (
                      <div className="text-center text-slate-600 py-8">
                        <div className="flex justify-center items-center mb-4">
                          <span className="text-6xl sticker-glow">📊</span>
                          <span className="text-6xl sticker-glow ml-4">🌟</span>
                        </div>
                        <p className="text-xl mb-2 text-slate-700">Your story begins here!</p>
                        <p className="text-sm mt-2 mb-4 text-slate-500">Start writing to see your emotional journey unfold</p>
                        <div className="bg-white/70 backdrop-blur-sm border border-slate-200 max-w-sm mx-auto p-4 rounded-lg">
                          <p className="text-sm italic text-slate-700 mb-2">
                            "Progress, not perfection"
                          </p>
                          <p className="text-xs text-slate-500">- Anonymous</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics & Quick Timeline */}
                <div className="space-y-6">
                  {/* Emotion Statistics */}
                  <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
                    <h4 className="text-slate-700 font-semibold mb-4">📊 Statistics</h4>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-slate-600 text-sm">Total Entries</p>
                        <p className="text-3xl font-bold text-slate-800">{moodEntries.length}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-slate-600 text-sm">Incident Reports</p>
                        <p className="text-2xl font-bold text-red-600">{moodEntries.filter(e => e.isIncident).length}</p>
                      </div>
                      
                      {trendData && (
                        <div className="space-y-2">
                          <p className="text-slate-600 text-sm">Most Common Emotions:</p>
                          {Object.entries(trendData.emotionalPatterns)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([emotion, count]) => (
                            <div key={emotion} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span>{getEmotionEmoji(emotion)}</span>
                                <span className="text-slate-700 capitalize">{emotion}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-16 h-2 bg-slate-200 rounded-full">
                                  <div 
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${(count / moodEntries.length) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-slate-500 text-sm">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Timeline */}
                  <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
                    <h4 className="text-slate-700 font-semibold mb-4">Recent Timeline</h4>
                    <div className="space-y-3">
                      {moodEntries.slice(-8).reverse().map(entry => (
                        <div key={entry.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-slate-600 text-xs">{entry.date}</span>
                            <span className="text-lg">{getEmotionEmoji(entry.aiSentiment.dominantEmotion)}</span>
                            {entry.isIncident && <span className="text-red-500 text-xs">🚨</span>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-16 h-2 rounded-full bg-gradient-to-r ${getSentimentColor(entry.aiSentiment.sentiment)}`}></div>
                            <span className="text-slate-500 text-xs capitalize">{entry.aiSentiment.sentiment}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 