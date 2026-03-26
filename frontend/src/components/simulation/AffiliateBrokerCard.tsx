import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { AffiliateBroker } from '@/types/affiliate';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AffiliateBrokerCardProps {
  broker: AffiliateBroker;
}

export const AffiliateBrokerCard: React.FC<AffiliateBrokerCardProps> = ({ broker }) => {
  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-md border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          {broker.logo_url ? (
            <img 
              src={broker.logo_url} 
              alt={`${broker.name} logo`} 
              className="w-10 h-10 rounded-md object-contain bg-white p-1 border"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold">
              {broker.name.charAt(0)}
            </div>
          )}
          <CardTitle className="text-xl">{broker.name}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow py-4">
        <ul className="space-y-2">
          {broker.description.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button 
          asChild 
          className="w-full font-semibold"
          variant="default"
        >
          <a 
            href={broker.affiliate_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            {broker.cta_text}
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};
