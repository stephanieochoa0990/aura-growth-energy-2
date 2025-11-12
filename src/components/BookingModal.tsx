import React, { useState } from 'react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classTitle: string;
  classPrice: string;
  classDate: string;
  classTime: string;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, classTitle, classPrice, classDate, classTime }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '' });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border-2 border-[#D4AF37] rounded-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-3xl font-bold text-black mb-4">{classTitle}</h2>
        <div className="mb-6 text-gray-700">
          <p className="mb-2"><span className="text-[#B8941F] font-semibold">Date:</span> {classDate}</p>
          <p className="mb-2"><span className="text-[#B8941F] font-semibold">Duration:</span> {classTime}</p>
          <p className="text-2xl font-bold text-[#D4AF37] mt-4">{classPrice}</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black focus:border-[#D4AF37] focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black focus:border-[#D4AF37] focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black focus:border-[#D4AF37] focus:outline-none"
            />
            <div className="flex gap-4">
              <button type="submit" className="flex-1 bg-[#D4AF37] text-black py-3 rounded-lg font-semibold hover:bg-[#B8941F] transition-all">
                Reserve Your Spot
              </button>
              <button type="button" onClick={onClose} className="px-6 py-3 border border-[#D4AF37] text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/10 transition-all">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#D4AF37] text-xl font-semibold">✓ Booking Confirmed!</p>
            <p className="text-gray-700 mt-2">Check your email for details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;