export interface WizardData {
  // Step 1: Price
  price: number | null;
  priceConfirmed: boolean;
  
  // Step 2: Quantity
  quantity: number;
  
  // Step 3: Options
  options: string;
  
  // Step 4: Payment
  currency: string;
  network?: string;
  
  // Step 5: Privacy Delivery
  city: string;
  country: string;
  region: string;
  
  // Step 6: Notes
  notes: string;

  // Step 7: Contact
  telegramUsername: string;
}

export interface WizardProps {
  initialUrl: string;
  initialData?: {
    title?: string;
    image?: string;
    price?: number;
    currency?: string;
  };
  onSubmit: (data: WizardData) => void;
  onCancel: () => void;
}

export interface StepProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  initialUrl?: string;
  initialData?: any;
}
