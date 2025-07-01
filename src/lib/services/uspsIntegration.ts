export interface USPSMailOptions {
  serviceType: 'certified' | 'priority' | 'express';
  returnReceipt: boolean;
  signature: boolean;
}

export interface MailingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface MailTrackingInfo {
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  deliveryDate?: string;
  signedBy?: string;
  attempts: number;
  lastLocation?: string;
  estimatedDelivery?: string;
}

export interface MailCost {
  serviceType: USPSMailOptions['serviceType'];
  baseCost: number;
  returnReceipt: number;
  signature: number;
  total: number;
}

export class USPSService {
  private static readonly API_BASE = 'https://api.usps.com';
  private static readonly COSTS: Record<USPSMailOptions['serviceType'], { base: number; returnReceipt: number; signature: number }> = {
    certified: { base: 3.75, returnReceipt: 2.85, signature: 3.05 },
    priority: { base: 8.95, returnReceipt: 2.85, signature: 3.05 },
    express: { base: 26.95, returnReceipt: 2.85, signature: 3.05 }
  };

  static async validateAddress(address: MailingAddress): Promise<{
    valid: boolean;
    correctedAddress?: MailingAddress;
    suggestions?: MailingAddress[];
    errors?: string[];
  }> {
    try {
      // Simulate USPS Address Validation API
      // In production, this would call the actual USPS API
      const response = await fetch(`${this.API_BASE}/addresses/v3/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_USPS_API_KEY || 'demo-key'}`
        },
        body: JSON.stringify({
          address: {
            streetAddress: address.address1,
            secondaryAddress: address.address2,
            city: address.city,
            state: address.state,
            ZIPCode: address.zip
          }
        })
      });

      // For demo purposes, simulate validation
      const isValid = this.simulateAddressValidation(address);
      
      return {
        valid: isValid,
        correctedAddress: isValid ? address : undefined,
        suggestions: isValid ? [] : this.generateAddressSuggestions(address)
      };
    } catch (error) {
      console.error('Address validation failed:', error);
      return { 
        valid: false, 
        errors: ['Address validation service unavailable']
      };
    }
  }

  static async sendCertifiedMail(
    recipient: MailingAddress,
    letterContent: string,
    options: USPSMailOptions = {
      serviceType: 'certified',
      returnReceipt: true,
      signature: true
    }
  ): Promise<{
    success: boolean;
    trackingNumber?: string;
    cost?: number;
    estimatedDelivery?: string;
    errors?: string[];
  }> {
    try {
      // Simulate USPS Mail API
      const trackingNumber = this.generateTrackingNumber();
      const cost = this.calculateCost(options.serviceType, options);
      const estimatedDelivery = this.calculateEstimatedDelivery(options.serviceType);

      // In production, this would call the actual USPS API
      const response = await fetch(`${this.API_BASE}/mail/v3/mail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_USPS_API_KEY || 'demo-key'}`
        },
        body: JSON.stringify({
          mail: {
            recipient,
            content: letterContent,
            serviceType: options.serviceType,
            extraServices: {
              certifiedMail: options.serviceType === 'certified',
              returnReceipt: options.returnReceipt,
              signatureConfirmation: options.signature
            }
          }
        })
      });

      // Simulate successful mail sending
      return {
        success: true,
        trackingNumber,
        cost,
        estimatedDelivery
      };
    } catch (error) {
      console.error('Mail sending failed:', error);
      return { 
        success: false, 
        errors: ['Mail service unavailable']
      };
    }
  }

  static async trackMail(trackingNumber: string): Promise<MailTrackingInfo | null> {
    try {
      // Simulate USPS Tracking API
      const response = await fetch(`${this.API_BASE}/tracking/v3/tracking/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_USPS_API_KEY || 'demo-key'}`
        }
      });

      // For demo purposes, simulate tracking data
      return this.simulateTrackingData(trackingNumber);
    } catch (error) {
      console.error('Tracking failed:', error);
      return null;
    }
  }

  static calculateCost(
    serviceType: USPSMailOptions['serviceType'],
    options: Omit<USPSMailOptions, 'serviceType'>
  ): number {
    const serviceCosts = this.COSTS[serviceType];
    let total = serviceCosts.base;
    
    if (options.returnReceipt) total += serviceCosts.returnReceipt;
    if (options.signature) total += serviceCosts.signature;
    
    return total;
  }

  static getServiceInfo(serviceType: USPSMailOptions['serviceType']): {
    name: string;
    description: string;
    deliveryTime: string;
    features: string[];
  } {
    const serviceInfo = {
      certified: {
        name: 'Certified Mail',
        description: 'Legal proof of delivery with tracking',
        deliveryTime: '3-5 business days',
        features: ['Tracking number', 'Delivery confirmation', 'Legal documentation']
      },
      priority: {
        name: 'Priority Mail',
        description: 'Fast delivery with tracking',
        deliveryTime: '1-3 business days',
        features: ['Tracking number', 'Faster delivery', 'Insurance included']
      },
      express: {
        name: 'Priority Express',
        description: 'Overnight delivery guarantee',
        deliveryTime: '1-2 business days',
        features: ['Overnight delivery', 'Money-back guarantee', 'Signature required']
      }
    };

    return serviceInfo[serviceType];
  }

  // Helper methods for simulation
  private static simulateAddressValidation(address: MailingAddress): boolean {
    // Simple validation - check for basic address format
    const hasValidFormat = 
      address.name.length > 0 &&
      address.address1.length > 0 &&
      address.city.length > 0 &&
      address.state.length === 2 &&
      /^\d{5}(-\d{4})?$/.test(address.zip);
    
    return hasValidFormat;
  }

  private static generateAddressSuggestions(address: MailingAddress): MailingAddress[] {
    // Generate suggestions for invalid addresses
    return [
      {
        ...address,
        address1: address.address1.replace(/\s+/g, ' ').trim(),
        city: address.city.replace(/\s+/g, ' ').trim(),
        state: address.state.toUpperCase()
      }
    ];
  }

  private static generateTrackingNumber(): string {
    // Generate a realistic USPS tracking number
    const prefix = '9400';
    const random = Math.random().toString().slice(2, 12);
    return `${prefix}${random}`;
  }

  private static calculateEstimatedDelivery(serviceType: USPSMailOptions['serviceType']): string {
    const deliveryDays = {
      certified: 5,
      priority: 3,
      express: 2
    };

    const days = deliveryDays[serviceType];
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private static simulateTrackingData(trackingNumber: string): MailTrackingInfo {
    // Simulate realistic tracking data
    const statuses: MailTrackingInfo['status'][] = ['pending', 'in_transit', 'delivered', 'failed', 'returned'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const trackingData: MailTrackingInfo = {
      trackingNumber,
      status: randomStatus,
      attempts: Math.floor(Math.random() * 3) + 1,
      lastLocation: randomStatus === 'in_transit' ? 'USPS Distribution Center' : undefined
    };

    if (randomStatus === 'delivered') {
      trackingData.deliveryDate = new Date().toLocaleDateString();
      trackingData.signedBy = 'RECIPIENT';
    } else if (randomStatus === 'in_transit') {
      trackingData.estimatedDelivery = this.calculateEstimatedDelivery('certified');
    }

    return trackingData;
  }
} 