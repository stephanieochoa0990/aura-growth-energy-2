import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Sparkles, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileNavProps {
  isAdmin: boolean;
  onPortalClick: () => void;
}

export default function MobileNav({ isAdmin, onPortalClick }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg border border-amber-300"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex fixed top-4 right-4 z-50 gap-2">
        {isAdmin && (
          <Button onClick={() => navigate('/admin')} className="bg-white/90 text-gray-800 hover:bg-white border border-amber-300 font-semibold shadow-lg backdrop-blur-sm">
            <Shield className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Button>
        )}
        <Button onClick={() => navigate('/integration')} className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 font-semibold shadow-lg">
          <Sparkles className="w-4 h-4 mr-2" />
          Integration Toolkit
        </Button>
        <Button onClick={onPortalClick} className="bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 font-semibold shadow-lg">
          <Sparkles className="w-4 h-4 mr-2" />
          Student Portal
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile Menu Panel */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-40 transform transition-transform duration-300 lg:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col gap-3 p-6 pt-20">
          {isAdmin && (
            <Button onClick={() => { navigate('/admin'); setIsOpen(false); }} className="w-full min-h-[48px] bg-white text-gray-800 hover:bg-gray-50 border border-amber-300 font-semibold justify-start">
              <Shield className="w-5 h-5 mr-2" />
              Admin Dashboard
            </Button>
          )}
          <Button onClick={() => { navigate('/integration'); setIsOpen(false); }} className="w-full min-h-[48px] bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 font-semibold justify-start">
            <Sparkles className="w-5 h-5 mr-2" />
            Integration Toolkit
          </Button>
          <Button onClick={() => { onPortalClick(); setIsOpen(false); }} className="w-full min-h-[48px] bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 font-semibold justify-start">
            <Sparkles className="w-5 h-5 mr-2" />
            Student Portal
          </Button>
        </div>
      </div>
    </>
  );
}
