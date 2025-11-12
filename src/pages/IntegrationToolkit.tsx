import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, Flame, Heart, Sparkles, Wind, Lock, CheckCircle } from 'lucide-react';
import MysticalBackground from '@/components/MysticalBackground';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';

const IntegrationToolkit = () => {
  const navigate = useNavigate();
  const [breathCount, setBreathCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedCourse, setHasCompletedCourse] = useState(false);
  const [completedDays, setCompletedDays] = useState(0);

  const dailyPractices = [
    {
      title: "Flame Breath Technique",
      icon: Flame,
      description: "Connect to your inner fire and vital energy",
      steps: [
        "Sit comfortably with spine straight",
        "Visualize a golden flame in your solar plexus",
        "Inhale deeply, seeing the flame grow brighter",
        "Hold for 3 counts, feeling the warmth spread",
        "Exhale slowly, releasing what no longer serves",
        "Repeat 7 times for full activation"
      ]
    },
    {
      title: "Planetary Tuning",
      icon: Sparkles,
      description: "Align with cosmic frequencies",
      steps: [
        "Stand barefoot if possible",
        "Feel roots extending from feet into Earth",
        "Breathe in Earth's grounding energy (red)",
        "Draw energy up through each chakra",
        "Extend awareness to stars above",
        "Breathe in cosmic light (violet/white)",
        "Hold both energies, becoming a bridge"
      ]
    },
    {
      title: "Heart Coherence Practice",
      icon: Heart,
      description: "Create harmony between heart and mind",
      steps: [
        "Place hand on heart center",
        "Breathe slowly: 5 counts in, 5 counts out",
        "Focus attention on heart area",
        "Recall a moment of genuine gratitude",
        "Let that feeling expand with each breath",
        "Continue for 3-5 minutes"
      ]
    }
  ];

  const reflectionPrompts = [
    "What does my soul most want me to remember today?",
    "Where in my life am I dimming my light, and why?",
    "What would I do if I fully trusted my inner guidance?",
    "How can I bring more presence to this moment?",
    "What am I ready to release that no longer serves my highest path?",
    "Where do I feel most alive and authentic?",
    "What is my aura telling me right now?"
  ];

  const downloadables = [
    { title: "7-Day Integration Workbook", size: "2.4 MB" },
    { title: "Flame Breath Audio Guide", size: "8.1 MB" },
    { title: "Planetary Tuning Chart", size: "1.2 MB" },
    { title: "Aura Color Reference Guide", size: "3.5 MB" }
  ];

  useEffect(() => {
    checkCourseCompletion();
  }, []);

  const checkCourseCompletion = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check user progress for all 7 days
      const { data: progress, error } = await supabase
        .from('user_progress')
        .select('day_number, completed')
        .eq('user_id', user.id)
        .in('day_number', [1, 2, 3, 4, 5, 6, 7]);

      if (error) {
        console.error('Error checking progress:', error);
        setIsLoading(false);
        return;
      }

      // Count completed days
      const completed = progress?.filter(p => p.completed).length || 0;
      setCompletedDays(completed);
      setHasCompletedCourse(completed === 7);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  const handleBreathClick = () => {
    setBreathCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen relative">
      <MysticalBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/90 to-indigo-900/90 backdrop-blur-sm py-4 px-3 sm:px-6 sticky top-0 z-20 border-b border-purple-500/30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Integration Toolkit</h1>
            <Button onClick={() => navigate('/')} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Back to Home
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
          
          {/* Show loading state */}
          {isLoading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-purple-200">Checking your progress...</p>
              </div>
            </div>
          )}

          {/* Show locked state if course not completed */}
          {!isLoading && !hasCompletedCourse && (
            <div className="min-h-[600px] flex items-center justify-center">
              <Card className="bg-gradient-to-br from-purple-900/60 to-indigo-900/60 backdrop-blur-md border-purple-500/30 max-w-2xl w-full">
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl text-center text-purple-100 flex items-center justify-center gap-3">
                    <Lock className="w-8 h-8" />
                    Integration Toolkit Locked
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-purple-200 text-center text-lg">
                    The Integration Toolkit becomes available after completing all 7 days of the journey.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-purple-100">
                      <span>Your Progress</span>
                      <span className="font-semibold">{completedDays} of 7 days completed</span>
                    </div>
                    <Progress value={(completedDays / 7) * 100} className="h-3 bg-purple-900/50" />
                  </div>

                  <div className="bg-purple-800/30 rounded-lg p-4 space-y-3">
                    <h3 className="text-purple-100 font-semibold">Days Status:</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <div 
                          key={day} 
                          className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                            day <= completedDays 
                              ? 'bg-green-600/40 border border-green-500/50' 
                              : 'bg-purple-900/40 border border-purple-500/30'
                          }`}
                        >
                          <span className="text-xs text-purple-300">Day</span>
                          <span className="text-lg font-bold text-purple-100">{day}</span>
                          {day <= completedDays && (
                            <CheckCircle className="w-4 h-4 text-green-400 mt-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center space-y-4">
                    <p className="text-purple-200 italic">
                      "Complete your journey through all 7 days to unlock powerful integration practices, 
                      reflection tools, and resources to support your continued growth."
                    </p>
                    
                    <Button 
                      onClick={() => navigate(`/day${completedDays + 1}`)} 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={completedDays >= 7}
                    >
                      Continue to Day {completedDays + 1}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Show full content if course completed */}
          {!isLoading && hasCompletedCourse && (
            <>
          {/* Channeled Message */}
          <Card className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-md border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl text-center text-purple-100 flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
                Message from Your Higher Self
              </CardTitle>
            </CardHeader>
            <CardContent className="text-purple-50 space-y-4 text-sm sm:text-base leading-relaxed">
              <p className="italic">
                "Beloved one, you are reading these words because you have chosen to remember. The flame within you has never been extinguished—it has only been waiting for your recognition."
              </p>
              <p>
                "Every breath you take is an opportunity to return home to yourself. The practices in this toolkit are not tasks to complete, but invitations to presence. They are doorways back to the truth of who you are."
              </p>
              <p>
                "When you forget—and you will, for that is the nature of the human experience—know that forgetting is not failure. It is simply another opportunity to choose again. To remember again. To return to the flame."
              </p>
              <p className="font-semibold">
                "You are not learning anything new. You are simply removing the layers that have hidden what was always true: You are light. You are love. You are infinite potential expressing itself in human form."
              </p>
              <p className="text-right italic">
                "With infinite love and unwavering faith in your journey,<br />Your Higher Self"
              </p>
            </CardContent>
          </Card>

          {/* Daily Practices */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-purple-100 mb-6 text-center">Daily Practices</h2>
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              {dailyPractices.map((practice, idx) => (
                <Card key={idx} className="bg-white/10 backdrop-blur-md border-purple-500/30 hover:bg-white/15 transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl text-purple-100 flex items-center gap-2">
                      <practice.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      {practice.title}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-purple-200">{practice.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2 text-xs sm:text-sm text-purple-50">
                      {practice.steps.map((step, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-purple-300 font-semibold">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* When You Forget the Flame */}
          <Card className="bg-gradient-to-br from-orange-900/40 to-red-900/40 backdrop-blur-md border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl text-center text-orange-100 flex items-center justify-center gap-2">
                <Flame className="w-6 h-6 sm:w-8 sm:h-8" />
                When You Forget the Flame
              </CardTitle>
              <p className="text-center text-orange-200 text-sm sm:text-base">Quick tools to return to your center</p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* 1-Breath Return Tool */}
              <div className="bg-white/10 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-orange-100 mb-3">1-Breath Return Tool</h3>
                <p className="text-orange-50 mb-4 text-sm sm:text-base">
                  No matter where you are or what you're doing, one conscious breath can bring you back.
                </p>
                <div className="bg-orange-900/40 rounded-lg p-4 sm:p-6 text-center">
                  <p className="text-orange-100 mb-4 text-sm sm:text-base">Click to take one conscious breath</p>
                  <Button 
                    onClick={handleBreathClick}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white min-h-[44px]"
                  >
                    <Wind className="w-5 h-5 mr-2" />
                    Breathe Now
                  </Button>
                  {breathCount > 0 && (
                    <p className="mt-4 text-orange-200 text-sm">
                      You've taken {breathCount} conscious breath{breathCount !== 1 ? 's' : ''} today
                    </p>
                  )}
                </div>
              </div>

              {/* Mantra */}
              <div className="bg-white/10 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-orange-100 mb-3">Centering Mantra</h3>
                <p className="text-orange-50 mb-3 text-sm sm:text-base">Repeat silently or aloud:</p>
                <div className="bg-orange-900/40 rounded-lg p-4 sm:p-6 text-center">
                  <p className="text-xl sm:text-2xl font-semibold text-orange-100 italic">
                    "I am here. I am present. I am the flame."
                  </p>
                </div>
              </div>

              {/* Grounding Tips */}
              <div className="bg-white/10 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-orange-100 mb-3">Quick Grounding Tips</h3>
                <ul className="space-y-2 text-orange-50 text-sm sm:text-base">
                  <li className="flex gap-2"><span className="text-orange-300">•</span> Place both feet flat on the ground and feel the support beneath you</li>
                  <li className="flex gap-2"><span className="text-orange-300">•</span> Name 5 things you can see, 4 you can touch, 3 you can hear</li>
                  <li className="flex gap-2"><span className="text-orange-300">•</span> Splash cold water on your face or hold an ice cube</li>
                  <li className="flex gap-2"><span className="text-orange-300">•</span> Press your thumb and forefinger together and take 3 deep breaths</li>
                  <li className="flex gap-2"><span className="text-orange-300">•</span> Look at a photo that makes you smile</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Reflection Prompts */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-purple-100 mb-6 text-center">Reflection Prompts</h2>
            <Card className="bg-white/10 backdrop-blur-md border-purple-500/30">
              <CardContent className="pt-6">
                <p className="text-purple-200 mb-6 text-sm sm:text-base text-center">
                  Use these prompts in your journal or meditation practice
                </p>
                <Accordion type="single" collapsible className="space-y-2">
                  {reflectionPrompts.map((prompt, idx) => (
                    <AccordionItem key={idx} value={`prompt-${idx}`} className="bg-white/5 rounded-lg border-purple-500/20">
                      <AccordionTrigger className="px-4 text-purple-100 hover:text-purple-200 text-sm sm:text-base text-left">
                        Prompt {idx + 1}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-purple-50 text-sm sm:text-base">
                        {prompt}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>

          {/* Downloadable Resources */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-purple-100 mb-6 text-center">Downloadable Resources</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {downloadables.map((resource, idx) => (
                <Card key={idx} className="bg-white/10 backdrop-blur-md border-purple-500/30 hover:bg-white/15 transition-all">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-purple-100">{resource.title}</h3>
                      <p className="text-xs sm:text-sm text-purple-300">{resource.size}</p>
                    </div>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 min-h-[44px] min-w-[44px]">
                      <Download className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationToolkit;