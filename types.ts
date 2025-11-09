export interface BookPage {
  id: string;
  imageUrl: string;
  generatedText: string;
}

// FIX: Added PageInput interface to resolve import error in PageInputForm.tsx
export interface PageInput {
  id: string;
  userText: string;
  image?: File;
  imageUrl?: string;
}
