'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

interface PaymentFormProps {
  skillId: string;
  skillName: string;
  price: number;
  isSubscription?: boolean;
  onPurchaseComplete?: (data: any) => void;
}

export default function PaymentForm({
  skillId,
  skillName,
  price,
  isSubscription = false,
  onPurchaseComplete
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCVV] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Process payment through the API
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillId,
          paymentMethod,
          paymentDetails: {
            cardNumber,
            cardName,
            expiryDate,
            cvv
          }
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }
      
      // Show success message
      setIsSuccess(true);
      setTransactionId(data.transactionId);
      
      // Call the callback if provided
      if (onPurchaseComplete) {
        onPurchaseComplete(data);
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'There was an error processing your payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleNewPurchase = () => {
    setIsSuccess(false);
    setCardNumber('');
    setCardName('');
    setExpiryDate('');
    setCVV('');
  };

  return (
    <div>
      {!isSuccess ? (
        <Card>
          <CardHeader>
            <CardTitle>Purchase {skillName}</CardTitle>
            <CardDescription>
              {isSubscription 
                ? `Monthly subscription at $${price.toFixed(2)}/month`
                : `One-time purchase for $${price.toFixed(2)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="credit-card" id="credit-card" />
                    <Label htmlFor="credit-card">Credit/Debit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paypal" id="paypal" disabled />
                    <Label htmlFor="paypal" className="text-muted-foreground">PayPal (Coming Soon)</Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'credit-card' && (
                  <div className="space-y-4 mt-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input 
                        id="card-number"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="card-name">Name on Card</Label>
                      <Input 
                        id="card-name"
                        placeholder="John Smith"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input 
                          id="expiry"
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input 
                          id="cvv"
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCVV(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mt-2">
                      Your payment information is secure. We use industry-standard encryption to protect your data.
                    </div>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button 
              onClick={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Pay $${price.toFixed(2)}`}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Payment Successful!</CardTitle>
            <CardDescription>
              Thank you for your purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 text-green-800 rounded-md">
              <p className="font-medium">Your purchase of {skillName} is complete</p>
              <p className="text-sm mt-1">Transaction ID: {transactionId}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">What's Next?</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>You can now use this skill in your projects</li>
                <li>Access it from your profile page under "Purchased Skills"</li>
                <li>Use it in workflows to combine with other skills</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={handleNewPurchase}
            >
              Make Another Purchase
            </Button>
            <Button 
              onClick={() => window.location.href = '/dashboard/profile'}
            >
              Go to Profile
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
