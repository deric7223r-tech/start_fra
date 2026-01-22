import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useWorkshopProgress } from '@/hooks/useWorkshopProgress';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Certificate as CertificateType } from '@/types/workshop';
import {
  Award,
  Download,
  ArrowLeft,
  Share2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Certificate() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { progress } = useWorkshopProgress();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<CertificateType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCertificate();
    }
  }, [user]);

  const fetchCertificate = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setCertificate(data);
    }
  };

  const generateCertificate = async () => {
    if (!user || !progress?.completed_at) return;

    setIsGenerating(true);
    
    // Generate a unique certificate number
    const certNumber = `FRA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        certificate_number: certNumber,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to generate certificate');
      console.error(error);
    } else {
      setCertificate(data);
      toast.success('Certificate generated!');
    }

    setIsGenerating(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || !profile) return null;

  const isCompleted = progress?.completed_at !== null;

  if (!isCompleted) {
    return (
      <Layout>
        <div className="container py-8 lg:py-12">
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Complete the Workshop First</h2>
              <p className="text-muted-foreground mb-6">
                You need to complete all workshop sections before you can receive your certificate.
              </p>
              <Button onClick={() => navigate('/workshop')}>
                Continue Workshop
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 lg:py-12">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {certificate ? (
            <>
              {/* Certificate Display */}
              <Card className="overflow-hidden mb-6">
                <div className="gradient-hero p-8 lg:p-12 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center">
                      <Award className="h-10 w-10 text-accent-foreground" />
                    </div>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-2">
                    Certificate of Completion
                  </h1>
                  <p className="text-primary-foreground/80 text-lg">
                    Fraud Risk Awareness Workshop
                  </p>
                </div>

                <CardContent className="p-8 lg:p-12">
                  <div className="text-center mb-8">
                    <p className="text-muted-foreground mb-2">This is to certify that</p>
                    <h2 className="text-2xl font-bold mb-2">{profile.full_name}</h2>
                    <p className="text-muted-foreground">{profile.organization_name}</p>
                  </div>

                  <div className="text-center mb-8">
                    <p className="text-muted-foreground">
                      has successfully completed the Fraud Risk Awareness Workshop
                      for trustees, executive leadership, and budget-holders.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-8 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground">Certificate Number</p>
                      <p className="font-mono font-medium">{certificate.certificate_number}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Date Issued</p>
                      <p className="font-medium">
                        {new Date(certificate.issued_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t flex flex-wrap justify-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Regulatory Landscape</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Fraud Types & Risks</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Defense Strategies</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Case Studies</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Download PDF
                </Button>
                <Button size="lg" variant="outline">
                  <Share2 className="mr-2 h-5 w-5" />
                  Share Certificate
                </Button>
              </div>
            </>
          ) : (
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <Award className="h-8 w-8 text-success" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Congratulations!</CardTitle>
                <CardDescription>
                  You've completed the Fraud Risk Awareness Workshop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Generate your certificate of completion to document your training.
                </p>
                <Button size="lg" onClick={generateCertificate} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Award className="mr-2 h-5 w-5" />
                  )}
                  Generate Certificate
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}