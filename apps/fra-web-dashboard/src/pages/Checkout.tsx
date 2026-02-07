import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import {
  Shield,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Loader2,
} from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();

  const packageName = searchParams.get('package');
  const priceParam = searchParams.get('price');
  const price = priceParam ? parseFloat(priceParam) : 0;

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!packageName || !priceParam) {
    return <Navigate to="/" replace />;
  }

  const vat = price * 0.20;
  const total = price * 1.20;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <Layout>
        <section className="py-20 lg:py-32">
          <div className="container max-w-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-xl text-center">
                <CardContent className="pt-12 pb-10 px-8">
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                  <p className="text-muted-foreground mb-8">
                    Your {packageName} package is now active.
                  </p>

                  <div className="rounded-lg bg-muted/50 p-4 mb-8 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Package</span>
                      <span className="font-medium">{packageName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">
                        {'\u00A3'}{total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-green-600 dark:text-green-400">Confirmed</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button className="w-full" asChild>
                      <Link to="/dashboard">Go to Dashboard</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/">Back to Home</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-0 shadow-xl gradient-hero text-primary-foreground">
                <CardHeader>
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{packageName}</h3>
                    <p className="text-primary-foreground/70 text-sm">
                      {packageName === 'Professional'
                        ? 'FRA + Training - Annual Subscription'
                        : 'Full Dashboard - Annual Subscription'}
                    </p>
                  </div>

                  <div className="space-y-3 border-t border-primary-foreground/20 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-foreground/70">Subtotal</span>
                      <span>{'\u00A3'}{price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-foreground/70">VAT (20%)</span>
                      <span>{'\u00A3'}{vat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-primary-foreground/20 pt-3">
                      <span>Total</span>
                      <span>{'\u00A3'}{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-xs font-semibold text-primary-foreground/90 backdrop-blur">
                    <Shield className="h-3.5 w-3.5" />
                    <span>GovS-013 & ECCTA 2023 Compliant</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div>
                      <label htmlFor="card-number" className="block text-sm font-medium mb-1.5">
                        Card Number
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          id="card-number"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          maxLength={19}
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expiry" className="block text-sm font-medium mb-1.5">
                          Expiry
                        </label>
                        <input
                          id="expiry"
                          type="text"
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          maxLength={5}
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="cvc" className="block text-sm font-medium mb-1.5">
                          CVC
                        </label>
                        <input
                          id="cvc"
                          type="text"
                          placeholder="123"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                          maxLength={4}
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="cardholder" className="block text-sm font-medium mb-1.5">
                        Cardholder Name
                      </label>
                      <input
                        id="cardholder"
                        type="text"
                        placeholder="Name on card"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : `Pay \u00A3${total.toFixed(2)}`}
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Secure payment</span>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
