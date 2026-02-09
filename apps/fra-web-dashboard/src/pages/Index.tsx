import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import {
  Shield,
  Users,
  Target,
  Award,
  ArrowRight,
  Play,
  BookOpen,
  Clock,
  CheckCircle2,
  BadgeCheck,
} from 'lucide-react';
import { useState } from 'react';

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');

  const handleJoinSession = () => {
    if (sessionCode.trim()) {
      navigate(`/workshop?session=${sessionCode.trim().toUpperCase()}`);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: 'Interactive Learning',
      description: 'Engage with dynamic slides, quizzes, and real-world scenarios tailored to your sector.',
    },
    {
      icon: Users,
      title: 'Live Collaboration',
      description: 'Participate in real-time polls and Q&A sessions with your colleagues and facilitator.',
    },
    {
      icon: Target,
      title: 'Personalised Action Plans',
      description: 'Receive customised recommendations based on your responses and organisation needs.',
    },
    {
      icon: Award,
      title: 'Certificate of Completion',
      description: 'Earn a verified certificate documenting your fraud risk awareness training.',
    },
  ];

  const stats = [
    { value: '30', label: 'Minutes', sublabel: 'Workshop Duration' },
    { value: '6', label: 'Modules', sublabel: 'Comprehensive Coverage' },
    { value: '100%', label: 'Interactive', sublabel: 'Engaging Content' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero py-20 lg:py-32" aria-label="Hero">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aDZ2Nmgtengvex0WC8rMC8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" aria-hidden="true" />
        
        <div className="container relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent mb-4">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>Professional Fraud Risk Training</span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl mb-4">
                Fraud Risk CO UK
                <br />
                <span className="text-accent">Protect Your Organisation</span>
              </h1>

              <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-xs font-semibold text-primary-foreground/90 mb-6 backdrop-blur">
                <BadgeCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>GovS-013 & ECCTA 2023 Compliant</span>
              </div>

              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto lg:mx-0">
                An interactive 30-minute workshop designed for trustees, executive leadership, and budget-holders.
                Build fraud resilience through engaging content and practical action plans.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {user ? (
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                    <Link to="/dashboard">
                      <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                      Go to Dashboard
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                    <Link to="/auth?mode=signup">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link to="/resources">
                    <BookOpen className="mr-2 h-5 w-5" aria-hidden="true" />
                    View Resources
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl">Join a Live Session</CardTitle>
                  <CardDescription>
                    Enter the session code provided by your facilitator
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={(e) => { e.preventDefault(); handleJoinSession(); }} className="flex gap-3">
                    <Input
                      placeholder="Enter session code"
                      value={sessionCode}
                      onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                      className="text-center text-lg font-mono tracking-widest uppercase"
                      maxLength={6}
                      aria-label="Session code"
                    />
                    <Button type="submit" disabled={!sessionCode.trim()}>
                      Join
                    </Button>
                  </form>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => navigate(user ? '/workshop' : '/auth?mode=signup')}
                  >
                    Start Self-Paced Workshop
                  </Button>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className="text-center p-4 rounded-lg bg-primary-foreground/5 backdrop-blur"
                  >
                    <div className="text-2xl font-bold text-primary-foreground">{stat.value}</div>
                    <div className="text-sm font-medium text-primary-foreground/80">{stat.label}</div>
                    <div className="text-xs text-primary-foreground/60">{stat.sublabel}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32" aria-label="Features">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              What You'll Experience
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our workshop combines cutting-edge interactive technology with expert-curated content 
              to deliver an engaging and impactful learning experience.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages / Pricing Section */}
      <section className="py-20 lg:py-32 bg-muted/50" aria-label="Packages">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Choose Your Package
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select the plan that best fits your organisation's fraud risk
              management needs — from a one-off assessment to full enterprise
              coverage.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 items-stretch">
            {/* ---- Package 1: Starter ---- */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full flex flex-col border shadow-lg hover:shadow-xl transition-shadow bg-card">
                <CardHeader className="pb-4">
                  <div className="mb-3">
                    <span className="inline-block rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Package 1
                    </span>
                  </div>
                  <CardTitle className="text-2xl">Starter</CardTitle>
                  <CardDescription>
                    Ideal for a one-time fraud risk health-check
                  </CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">£795</span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      one-time
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-3 mb-8 text-left flex-1">
                    {[
                      'Single fraud risk assessment',
                      'Comprehensive PDF report',
                      'ECCTA compliance snapshot',
                      '1 key-pass included',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/auth?mode=signup">
                      Start Assessment
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* ---- Package 2: Professional (Most Popular) ---- */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
              className="md:-mt-4 md:mb-[-16px]"
            >
              <Card className="h-full flex flex-col ring-2 ring-primary shadow-2xl relative bg-card">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
                    <Award className="h-3.5 w-3.5" aria-hidden="true" />
                    Most Popular
                  </span>
                </div>
                <CardHeader className="pb-4 pt-10">
                  <div className="mb-3">
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                      Package 2
                    </span>
                  </div>
                  <CardTitle className="text-2xl">Professional</CardTitle>
                  <CardDescription>
                    Ongoing protection with training & support
                  </CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">£1,995</span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      / year
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-3 mb-8 text-left flex-1">
                    {[
                      'Everything in Starter',
                      'Fraud awareness training workshop',
                      '50 key-passes included',
                      'Quarterly reassessment',
                      'Email support',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" size="lg" asChild>
                    <Link to={user ? '/checkout?package=Professional&price=1995' : '/auth?mode=signup'}>
                      Choose Professional
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* ---- Package 3: Enterprise ---- */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="h-full flex flex-col border-2 border-amber-500/70 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-b from-amber-50/50 to-card dark:from-amber-950/20 dark:to-card">
                <CardHeader className="pb-4">
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                      <Shield className="h-3 w-3" aria-hidden="true" />
                      Package 3
                    </span>
                  </div>
                  <CardTitle className="text-2xl text-amber-900 dark:text-amber-100">Enterprise</CardTitle>
                  <CardDescription>
                    Full-scale fraud risk management for large organisations
                  </CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-amber-700 dark:text-amber-400">£4,995</span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      / year
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-3 mb-8 text-left flex-1">
                    {[
                      'Everything in Professional',
                      'Full management dashboard',
                      'Unlimited key-passes',
                      'Organisation risk register',
                      'API access',
                      'Priority support',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-amber-500 text-white hover:bg-amber-600 shadow-md" asChild>
                    <Link to={user ? '/checkout?package=Enterprise&price=4995' : '/auth?mode=signup'}>
                      Choose Enterprise
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Workshop Overview Section */}
      <section className="py-20 lg:py-32" aria-label="Workshop overview">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                A Comprehensive 30-Minute Journey
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                From regulatory updates to practical action planning, our workshop covers
                everything you need to strengthen your organisation's fraud defences.
              </p>

              <div className="space-y-4">
                {[
                  { time: '5 min', title: 'Regulatory Landscape', desc: 'Current compliance requirements and legislation' },
                  { time: '5 min', title: 'Fraud Types & Risks', desc: 'Understanding common fraud schemes' },
                  { time: '5 min', title: 'Defence Strategies', desc: 'Practical controls and prevention measures' },
                  { time: '5 min', title: 'Organisational Impact', desc: 'The true cost of fraud incidents' },
                  { time: '5 min', title: 'Interactive Scenarios', desc: 'Real-world case studies and exercises' },
                  { time: '5 min', title: 'Action Planning', desc: 'Your personalised next steps' },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-primary min-w-[60px]">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {item.time}
                    </div>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="border-0 shadow-xl">
                <CardHeader className="gradient-hero text-primary-foreground rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    What You'll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {[
                      'Understand your obligations under the Economic Crime Act 2023',
                      'Identify common fraud schemes targeting your sector',
                      'Implement practical defence strategies immediately',
                      'Recognise red flags and early warning signs',
                      'Develop a personalised fraud prevention action plan',
                      'Access downloadable resources and tools',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32" aria-label="Call to action">
        <div className="container">
          <Card className="border-0 gradient-hero overflow-hidden">
            <CardContent className="p-12 lg:p-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl mb-4">
                Ready to Strengthen Your Fraud Defences?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of professionals who have enhanced their fraud awareness
                through Fraud Risk Co UK's interactive workshop platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                  <Link to={user ? '/workshop' : '/auth?mode=signup'}>
                    Start Workshop Now
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link to="/resources">
                    Download Resources
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30" aria-label="Site footer">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="font-semibold">Fraud Risk Co UK</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Fraud Risk Co UK. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}