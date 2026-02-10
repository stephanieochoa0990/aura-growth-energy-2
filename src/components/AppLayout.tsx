import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { GraduationCap, Shield, Sparkles, Star } from 'lucide-react';
import BookingModal from './BookingModal';
import ClassCard from './ClassCard';
import InstructorCard from './InstructorCard';
import MobileNav from './MobileNav';
import { NewsletterSignup } from './NewsletterSignup';
import { ReviewsSection } from './reviews/ReviewsSection';
import { instructorsData } from '@/data/instructorsData';
import StudentPortal from './StudentPortal';
import TestimonialCard from './TestimonialCard';
import { WhiteLotus } from './WhiteLotus';
import MysticalBackground from './MysticalBackground';

const AppLayout: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [showPortal, setShowPortal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    checkAdminStatus();
  }, []);
  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, role')
          .eq('id', user.id)
          .maybeSingle();
        
        // Check both is_admin flag and role-based access
        const adminRoles = ['admin', 'super_admin', 'content_manager', 'moderator', 'support_staff'];
        if (profile && (profile.is_admin === true || adminRoles.includes(profile.role))) {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };


  const testimonials = [{
    name: "Sarah Mitchell",
    text: "Stephanie's guidance transformed my entire understanding of energy. I finally feel sovereign in my own field.",
    rating: 5,
    transformation: "Reclaimed my energetic sovereignty"
  }, {
    name: "James Chen",
    text: "The 7-day journey with Stephanie was life-changing. I now have practical tools I use every day.",
    rating: 5,
    transformation: "Mastered daily energy coherence"
  }, {
    name: "Emma Rodriguez",
    text: "Stephanie helped me remember who I truly am. This class is a profound homecoming.",
    rating: 5,
    transformation: "Activated my inner flame"
  }];
  if (showPortal) {

    return <StudentPortal />;
  }
  return <div className="min-h-screen bg-white relative overflow-x-hidden">

      {/* Logo at the very top */}
      <div className="relative z-50 bg-black py-6 flex justify-center border-b-2 border-gold">
        <img 
          src="https://d64gsuwffb70l.cloudfront.net/68f1691de1f12dbc13ceb089_1762904659748_05042e0c.jpg" 
          alt="White Lotus" 
          className="h-24 sm:h-28 md:h-32 lg:h-40 w-auto object-contain drop-shadow-2xl"
        />
      
      </div>

      {/* Mobile & Desktop Navigation */}
      <MobileNav isAdmin={isAdmin} onPortalClick={() => setShowPortal(true)} />

      {/* Hero */}
      <div className="relative min-h-[600px] lg:min-h-[700px] flex items-center justify-center overflow-hidden bg-white px-4 py-16 sm:py-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-gold-light/5 to-white"></div>
        </div>
        
        {/* Floating lotus decorations */}
        {/* Floating lotus decorations */}
        <div className="absolute top-20 left-10 opacity-5 animate-lotus-bloom hidden lg:block">
          <img src="https://d64gsuwffb70l.cloudfront.net/68f1691de1f12dbc13ceb089_1762904659748_05042e0c.jpg" alt="" className="w-32 h-32 object-contain" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-5 animate-lotus-bloom hidden lg:block" style={{animationDelay: '0.3s'}}>
          <img src="https://d64gsuwffb70l.cloudfront.net/68f1691de1f12dbc13ceb089_1762904659748_05042e0c.jpg" alt="" className="w-32 h-32 object-contain" />
        </div>

        
        <div className="relative z-10 text-center px-4 max-w-5xl w-full">
          <div className="relative inline-block mb-8 sm:mb-10">

            <img 
              src="https://d64gsuwffb70l.cloudfront.net/68f1691de1f12dbc13ceb089_1762904659748_05042e0c.jpg" 
              alt="Sacred Lotus" 
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto gold-glow animate-glow-pulse object-contain"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display mb-6 gold-gradient-text leading-tight tracking-tight">Aura Empowerment Class</h1>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-4 text-black/80 font-light font-accent tracking-wide">A 7-Day Mystical Journey</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-10 sm:mb-12 text-black/70 max-w-3xl mx-auto leading-relaxed">Awaken to the sacred mysteries within. Remember your divine essence and learn to command your energetic field with sovereign grace.</p>
          <button onClick={() => setShowPortal(true)} className="btn-gold group inline-flex items-center gap-3">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse" />
            <span className="text-base sm:text-lg font-semibold">Sign In to Student Portal</span>
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse" />
          </button>
        </div>

      </div>



      {/* Benefits */}
      <div id="benefits" className="relative py-20 lg:py-28 bg-white">
        <div className="gold-divider mb-16"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-center mb-6 gold-gradient-text leading-tight tracking-tight">Sacred Gifts You'll Receive</h2>
          <p className="text-lg sm:text-xl md:text-2xl text-center text-black/70 mb-4 max-w-3xl mx-auto font-accent">
            The Aura Empowerment Class is more than a teaching — it's an initiation.
          </p>
          <p className="text-base sm:text-lg md:text-xl text-center text-black/60 mb-10 max-w-3xl mx-auto">
            A 7-day mystical journey to awaken the divine remembrance of who you truly are.
          </p>
          <p className="text-base sm:text-lg md:text-xl text-center gold-text mb-16 max-w-3xl mx-auto font-semibold">
            By the completion of this sacred experience, you'll embody:
          </p>

          <div className="space-y-6">
            {[
              {
                title: "The Sacred Flame Within",
                description: "Experience the mystical ignition of your inner fire — not as mere concept, but as living activation that awakens your entire energetic matrix. Transform from seeking to knowing, from protecting to radiating divine light."
              },
              {
                title: "Mastery of Your Luminous Field",
                description: "Transcend seeing your aura as abstract energy. Discover it as your living temple — a sacred electromagnetic field that holds ancient memory, responds to divine will, and connects you to the cosmic web.",
                subtitle: "Learn the sacred arts of tending, communing with, and commanding your field."
              },
              {
                title: "Ancient Tools for Modern Mastery",
                description: "Receive a sacred treasury of timeless practices — breathwork, celestial sound, sacred movement, crystal wisdom, planetary alignments, and divine intention — to maintain your luminous coherence.",
                subtitle: "Master the art of instant centering — returning to your divine axis at will."
              },
              {
                title: "Sovereign Discernment & Divine Override",
                description: "Awaken to recognize when energies are not your own — whether astral, emotional, technological, or interdimensional interference.",
                subtitle: "Command the sacred authority to transmute all distortion and return to your sovereign throne."
              },
              {
                title: "Oracle of Your Inner Temple",
                description: "Unlock multiple gateways to your inner wisdom — muscle testing, pendulum divination, intuitive knowing, and direct field communication — discovering your unique oracle path.",
                subtitle: "Trust your sacred \"yes\" and sovereign \"no\" with unwavering clarity."
              },
              {
                title: "Embodiment of Celestial Light",
                description: "Experience how Source light flows through your sacred vessel, how planetary frequencies activate your energy centers, and how to restore your divine blueprint.",
                subtitle: "This is full embodiment — returning to your original luminous signal."
              }
            ].map((benefit, index) => (
              <div key={index} className="lotus-card group">
                <div className="flex items-start gap-4">
                  <img 
                    src="https://d64gsuwffb70l.cloudfront.net/68f1696ee5627338ad0f6d12_1762894140475_b7f8faae.webp" 
                    alt="" 
                    className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-display gold-text mb-3">{benefit.title}</h3>
                    <p className="text-base sm:text-lg text-black/70 leading-relaxed mb-2">
                      {benefit.description}
                    </p>
                    {benefit.subtitle && (
                      <p className="text-base sm:text-lg text-black/60 leading-relaxed font-medium italic">
                        {benefit.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="gold-divider"></div>

          {/* Closing */}
          <div className="mt-16 lotus-card text-center">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display mb-6 gold-gradient-text leading-tight">You'll Receive the Keys to Your Divine Kingdom</h3>
            <p className="text-base sm:text-lg md:text-xl text-black/70 mb-4 max-w-3xl mx-auto">
              This sacred journey creates no dependency on external healers or shields.
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold gold-text mb-8 max-w-3xl mx-auto">
              It's about igniting your divine sovereignty — commanding your field through any challenge with grace, power, and crystalline clarity.
            </p>
            <div className="space-y-3 text-base sm:text-lg md:text-xl text-black/60 max-w-2xl mx-auto mb-10">
              <p>If you've felt your light is too sensitive for this world…</p>
              <p>If you've experienced overwhelm, confusion, or fragmentation…</p>
              <p>If you're called to remember your true divine nature —</p>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display gold-gradient-text mb-10 leading-tight">
              This is your homecoming. Your activation. Your remembrance.
            </p>
            <button onClick={() => setModalOpen(true)} className="btn-gold group inline-flex items-center gap-3">
              <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
              <span className="text-base sm:text-lg font-semibold">Begin Your Sacred Journey</span>
              <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
            </button>
          </div>
        </div>
      </div>



      {/* Meet Your Facilitator */}
      <div className="relative py-20 lg:py-28 bg-white">
        <div className="gold-divider mb-16"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-center mb-4 gold-gradient-text leading-tight tracking-tight">Meet Your Facilitator</h2>
          <p className="text-center text-black/60 mb-12 text-lg sm:text-xl lg:text-2xl font-accent">Channel of divine wisdom and mystical teachings</p>
          <div className="flex justify-center">
            {instructorsData.map(i => <InstructorCard key={i.id} {...i} />)}
          </div>
        </div>
        <div className="gold-divider mt-16"></div>
      </div>

      {/* Reviews Section */}
      <div className="relative py-20 lg:py-28 bg-white">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <ReviewsSection />
        </div>
        <div className="gold-divider mt-16"></div>
      </div>

      {/* Newsletter Section */}
      <div className="relative py-20 bg-white">
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
          <NewsletterSignup />
        </div>
      </div>
      
      <footer className="relative bg-black text-white py-16 border-t-2 border-gold">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex flex-col items-center justify-center gap-6 mb-6">
            <img 
              src="https://d64gsuwffb70l.cloudfront.net/68f1691de1f12dbc13ceb089_1762904659748_05042e0c.jpg" 
              alt="White Lotus" 
              className="w-32 h-32 object-contain opacity-90"
            />
            <h3 className="text-2xl sm:text-3xl font-display gold-gradient-text">White Lotus</h3>
          </div>
          <p className="text-white/60 mb-6 text-sm sm:text-base">Sacred teachings for divine remembrance</p>
          <button onClick={() => navigate('/admin/login')} className="text-sm text-gold hover:text-gold-light underline transition-colors min-h-[44px] inline-flex items-center justify-center px-4">
            Admin Access
          </button>
        </div>
      </footer>


      <BookingModal isOpen={modalOpen} onClose={() => setModalOpen(false)} classTitle="Aura Empowerment Class" classPrice="$497" classDate="Starting Soon" classTime="7-Day Journey" />
    </div>;
};
export default AppLayout;