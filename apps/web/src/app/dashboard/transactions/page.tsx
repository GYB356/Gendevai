'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
  id: string;
  transactionId: string;
  status: string;
  purchaseDate: string;
  expirationDate?: string;
  skill: {
    id: string;
    name: string;
    price: number;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/payments');
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setTransactions(data.purchases || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load transaction history',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">
            View your purchases and subscriptions
          </p>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/marketplace'}>
          Browse Marketplace
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Overview of your transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Total Spent</div>
                <div className="text-2xl font-bold mt-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(
                      transactions.reduce((total, t) => total + t.skill.price, 0)
                    )
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Active Subscriptions</div>
                <div className="text-2xl font-bold mt-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    transactions.filter(t => t.expirationDate).length
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Skills Purchased</div>
                <div className="text-2xl font-bold mt-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    transactions.length
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All your purchases and subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between p-4 border rounded-md">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex flex-col md:flex-row md:justify-between p-4 border rounded-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <h3 className="font-medium">{transaction.skill.name}</h3>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'outline'}
                          className="ml-2"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Transaction ID: {transaction.transactionId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.purchaseDate)}
                        {transaction.expirationDate && (
                          <span> • Expires: {formatDate(transaction.expirationDate)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 md:text-right flex flex-col justify-between">
                      <div className="font-medium">
                        {formatCurrency(transaction.skill.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.expirationDate ? 'Subscription' : 'One-time purchase'}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                        onClick={() => window.location.href = `/dashboard/marketplace/skill/${transaction.skill.id}`}
                      >
                        View Skill
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">
                  You haven't made any purchases yet
                </p>
                <Button onClick={() => window.location.href = '/dashboard/marketplace'}>
                  Browse Marketplace
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
