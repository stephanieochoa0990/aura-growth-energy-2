import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MFASetup() {
  const [user, setUser] = useState<any>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;
    setUser(auth.user);

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "White Lotus Academy",
      friendlyName: "TOTP Authenticator"
    });

    if (error) {
      console.error(error);
      toast({ title: "MFA Error", description: error.message, variant: "destructive" });
      return;
    }

    setQr(data.totp.qr_code ?? null);
    setFactorId(data.id);
  }

  async function verify() {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      code
    });

    if (error) {
      toast({ title: "Incorrect Code", description: "Try again.", variant: "destructive" });
      return;
    }

    toast({
      title: "MFA Enabled",
      description: "Your account is now protected with 2-step verification."
    });

    window.location.href = "/student-welcome";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <Card className="max-w-md w-full bg-gray-900 border-yellow-600/20 text-white">
        <CardHeader>
          <CardTitle className="text-yellow-500">Secure Your Account</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p>Scan this QR code with Google Authenticator, Authy, or another TOTP app.</p>

          {qr && (
            <img src={qr} alt="QR Code" className="w-48 h-48 mx-auto border rounded" />
          )}

          <div className="space-y-2">
            <Input
              className="bg-black border-gray-700 text-white"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <Button onClick={verify} className="w-full bg-yellow-600 hover:bg-yellow-500">
            Verify & Enable
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
