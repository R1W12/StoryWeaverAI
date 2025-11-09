import { GoogleGenAI, Modality, Type } from "@google/genai";
import { BookPage } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const segmentStory = async (story: string, ai: GoogleGenAI): Promise<string[]> => {
  // FIX: Updated prompt to be more concise for JSON output. The model is guided by the responseSchema.
  const prompt = `You are a book editor. Read the following story and divide it into 5-7 balanced pages for a children's storybook. Each page should contain one or two paragraphs. Story: """${story}"""`;
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        // FIX: Added responseSchema to ensure consistent JSON output format.
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    pages: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                            description: "The text content for a single page of the book."
                        },
                        description: "An array of strings, where each string is the text for one page of the storybook."
                    }
                },
                required: ['pages']
            }
        }
    });

    const resultText = response.text.trim();
    const result = JSON.parse(resultText);
    if (!result.pages || !Array.isArray(result.pages)) {
        throw new Error("Invalid format for story segmentation.");
    }
    return result.pages;
  } catch(error) {
    console.error("Story segmentation failed:", error);
    throw new Error("Failed to split the story into pages.");
  }
}

const generateImageForPage = async (pageText: string, characterImages: {mimeType: string, data: string}[], ai: GoogleGenAI): Promise<string> => {
    const prompt = `Create a whimsical, beautiful, children's storybook-style illustration for the following scene. The characters and art style should be inspired by the provided reference images. Scene: "${pageText}"`;

    const imageParts = characterImages.map(img => ({
        inlineData: {
            mimeType: img.mimeType,
            data: img.data,
        }
    }));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: prompt },
                    ...imageParts
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image was generated for the page.");
    } catch (error) {
        console.error("Image generation failed:", error);
        throw new Error("Failed to generate an illustration for a page.");
    }
}

export const generateBookFromStory = async (
    story: string,
    characterFiles: File[],
    updateLoadingMessage: (message: string) => void
): Promise<BookPage[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    updateLoadingMessage("Preparing your character art...");
    const base64CharacterImages = await Promise.all(
        characterFiles.map(async file => ({
            mimeType: file.type,
            data: await fileToBase64(file)
        }))
    );
    
    updateLoadingMessage("Splitting your story into pages...");
    const pageTexts = await segmentStory(story, ai);

    const bookPages: BookPage[] = [];
    for (let i = 0; i < pageTexts.length; i++) {
        updateLoadingMessage(`Generating illustration for page ${i + 1} of ${pageTexts.length}...`);
        const pageText = pageTexts[i];
        const imageUrl = await generateImageForPage(pageText, base64CharacterImages, ai);
        bookPages.push({
            id: `page-${Date.now()}-${i}`,
            imageUrl: imageUrl,
            generatedText: pageText,
        });
    }

    updateLoadingMessage("Assembling your book...");
    return bookPages;
}