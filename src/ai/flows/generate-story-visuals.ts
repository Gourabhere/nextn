// src/ai/flows/generate-story-visuals.ts
'use server';
/**
 * @fileOverview Generates cartoonish and playful illustrations for each page of a story.
 *
 * - generateStoryVisuals - A function that handles the story visuals generation.
 * - GenerateStoryVisualsInput - The input type for the generateStoryVisuals function.
 * - GenerateStoryVisualsOutput - The return type for the generateStoryVisuals function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateStoryVisualsInputSchema = z.object({
  storyText: z.string().describe('The text content of the story page.'),
  style: z.string().default('cartoonish, playful').describe('The art style for the illustration.'),
});
export type GenerateStoryVisualsInput = z.infer<typeof GenerateStoryVisualsInputSchema>;

const GenerateStoryVisualsOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated image.'),
});
export type GenerateStoryVisualsOutput = z.infer<typeof GenerateStoryVisualsOutputSchema>;

export async function generateStoryVisuals(input: GenerateStoryVisualsInput): Promise<GenerateStoryVisualsOutput> {
  return generateStoryVisualsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryVisualsPrompt',
  input: {
    schema: z.object({
      storyText: z.string().describe('The text content of the story page.'),
      style: z.string().describe('The art style for the illustration.'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('The URL of the generated image.'),
    }),
  },
  prompt: `You are a children's book illustrator. Based on the story text, generate a URL for an image that depicts the scene.

Story Text: {{{storyText}}}
Art Style: {{{style}}}

Return the URL of the generated image. The image should be cartoonish and playful.`,
});

const generateStoryVisualsFlow = ai.defineFlow<
  typeof GenerateStoryVisualsInputSchema,
  typeof GenerateStoryVisualsOutputSchema
>({
  name: 'generateStoryVisualsFlow',
  inputSchema: GenerateStoryVisualsInputSchema,
  outputSchema: GenerateStoryVisualsOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
