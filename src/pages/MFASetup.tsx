import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function MFASetup() {
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  // STEP 1 — Enroll & Challenge
  useEffect(() => {
    async function enroll() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // 1️⃣ ENROLL TOTP FACTOR
      const { data: enrollData, error: enrollError } = 
        await supabase.auth.mfa.enroll({
          factorType: "totp",     // <-- FIXED
          friendlyName: "White Lotus MFA",
        });

      if (enrollError) {
        toast({
          title: "MFA Setup Failed",
          description: enrollError.message,
          variant: "destructive",
        });
        return;
      }

      setQr(enrollData.totp.qr_code);
      setFactorId(enrollData.id);

      // 2️⃣ REQUEST CHALLENGE
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: enrollData.id,   // <-- camelCase, required
        });

      if (challengeError) {
        toast({
          title: "Challenge Error",
          description: challengeError.message,
          variant: "destructive",
        });
        return;
      }

      setChallengeId(challengeData.id);
    }

    enroll();
  }, []);

  // STEP 2 — Verify Code
  async function verifyMFA() {
    if (!factorId || !challengeId) return;

    const { error } = await supabase.auth.mfa.verify({
      factorId,       // <-- must be camelCase
      challengeId,    // <-- must be camelCase
      code,
    });

    if (error) {
      toast({
        title: "Incorrect Code",
        description: "Try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "MFA Enabled",
      description: "Your account is now protected.",
    });

    navigate("/student-welcome");
  }

  return (
    <div className="max-w-md mx-auto p-6 text-white space-y-6">
      <h1 className="text-2xl font-bold">Set Up MFA</h1>

      {qr && (
        <img
          src={qr}
          alt="QR Code"
          className="w-48 h-48 mx-auto border p-2 rounded"
        />
      )}

      <p className="text-gray-300">
        Scan the QR code with Google Authenticator or Authy and enter the 6-digit code.
      </p>

      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="123456"
        className="text-black"
      />

      <Button onClick={verifyMFA} className="w-full bg-yellow-500 text-black">
        Verify & Enable MFA
      </Button>
    </div>
  );
}