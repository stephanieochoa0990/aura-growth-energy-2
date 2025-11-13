import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function MFASetup() {
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // STEP 1 — Enroll TOTP MFA
  useEffect(() => {
    async function enroll() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase.auth.mfa.enroll({
        factor_type: "totp",
        friendly_name: "White Lotus MFA",
      });

      if (error) {
        toast({
          title: "MFA Setup Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setQr(data.totp.qr_code);
      setFactorId(data.id);
    }

    enroll();
  }, []);

  // STEP 2 — Verify the MFA code
  async function verifyMFA() {
    if (!factorId) return;

    const { error } = await supabase.auth.mfa.verify({
      factor_id: factorId, // MUST BE factor_id (underscore)
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
    <div className="max-w-md mx-auto p-6 space-y-6 text-white">
      <h1 className="text-2xl font-bold">Set Up MFA</h1>

      {qr && (
        <img
          src={qr}
          alt="MFA QR Code"
          className="w-48 h-48 mx-auto border p-2 rounded"
        />
      )}

      <p>Enter the 6-digit code from your authenticator app.</p>

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
