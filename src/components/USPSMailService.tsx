import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { USPSService, MailingAddress, USPSMailOptions } from '@/lib/services/uspsIntegration';
import { motion } from 'framer-motion';

export function USPSMailService() {
  const [recipient, setRecipient] = useState<MailingAddress>({
    name: '',
    address1: '',
    city: '',
    state: '',
    zip: ''
  });
  const [letterContent, setLetterContent] = useState('');
  const [mailOptions, setMailOptions] = useState<USPSMailOptions>({
    serviceType: 'certified',
    returnReceipt: true,
    signature: true
  });
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    correctedAddress?: MailingAddress;
    suggestions?: MailingAddress[];
    errors?: string[];
  } | null>(null);
  const [sending, setSending] = useState(false);

  const validateAddress = async () => {
    const result = await USPSService.validateAddress(recipient);
    setValidationResult(result);
  };

  const sendMail = async () => {
    setSending(true);
    try {
      const result = await USPSService.sendCertifiedMail(recipient, letterContent, mailOptions);
      if (result.success) {
        console.log('Mail sent successfully:', result.trackingNumber);
      }
    } catch (error) {
      console.error('Failed to send mail:', error);
    } finally {
      setSending(false);
    }
  };

  const cost = USPSService.calculateCost(mailOptions.serviceType, mailOptions);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-2">USPS Mail Service</h1>
        <p className="text-blue-100">
          Send certified mail with tracking and delivery confirmation
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Address Form */}
        <Card>
          <CardHeader>
            <CardTitle>Recipient Information</CardTitle>
            <CardDescription>
              Enter the recipient's mailing address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={recipient.name}
                onChange={(e) => setRecipient({...recipient, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <Label htmlFor="address1">Address Line 1</Label>
              <Input
                id="address1"
                value={recipient.address1}
                onChange={(e) => setRecipient({...recipient, address1: e.target.value})}
                placeholder="123 Main Street"
              />
            </div>
            
            <div>
              <Label htmlFor="address2">Address Line 2 (Optional)</Label>
              <Input
                id="address2"
                value={recipient.address2 || ''}
                onChange={(e) => setRecipient({...recipient, address2: e.target.value})}
                placeholder="Apt 4B"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={recipient.city}
                  onChange={(e) => setRecipient({...recipient, city: e.target.value})}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={recipient.state}
                  onChange={(e) => setRecipient({...recipient, state: e.target.value})}
                  placeholder="NY"
                  maxLength={2}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={recipient.zip}
                onChange={(e) => setRecipient({...recipient, zip: e.target.value})}
                placeholder="10001"
              />
            </div>
            
            <Button onClick={validateAddress} variant="outline" className="w-full">
              Validate Address
            </Button>
            
            {validationResult && (
              <div className={`p-3 rounded-lg ${
                validationResult.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {validationResult.valid ? '✓ Address is valid' : '✗ Address validation failed'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mail Options */}
        <Card>
          <CardHeader>
            <CardTitle>Mail Options</CardTitle>
            <CardDescription>
              Choose your mailing service and options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service Type Selection */}
            <div className="space-y-3">
              {[
                { type: 'certified', name: 'Certified Mail', price: 3.75, description: 'Legal proof of delivery' },
                { type: 'priority', name: 'Priority Mail', price: 8.95, description: '1-3 business days' },
                { type: 'express', name: 'Priority Express', price: 26.95, description: 'Next day delivery' }
              ].map((service) => (
                <div
                  key={service.type}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    mailOptions.serviceType === service.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setMailOptions({...mailOptions, serviceType: service.type as USPSMailOptions['serviceType']})}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    <Badge variant="secondary">${service.price}</Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Options */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={mailOptions.returnReceipt}
                  onChange={(e) => setMailOptions({...mailOptions, returnReceipt: e.target.checked})}
                />
                <span>Return Receipt (+$2.85)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={mailOptions.signature}
                  onChange={(e) => setMailOptions({...mailOptions, signature: e.target.checked})}
                />
                <span>Signature Confirmation (+$3.05)</span>
              </label>
            </div>

            {/* Cost Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Cost:</span>
                <span>${cost.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Letter Content */}
      <Card>
        <CardHeader>
          <CardTitle>Letter Content</CardTitle>
          <CardDescription>
            Enter or paste your dispute letter content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={letterContent}
            onChange={(e) => setLetterContent(e.target.value)}
            placeholder="Enter your letter content here..."
            className="min-h-[300px]"
          />
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {letterContent.length} characters
            </div>
            <Button
              onClick={sendMail}
              disabled={!letterContent || !recipient.name || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? 'Sending...' : `Send Mail ($${cost.toFixed(2)})`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 