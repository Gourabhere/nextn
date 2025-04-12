'use server';
/**
 * @fileOverview A daily story generation AI agent.
 *
 * - generateDailyStory - A function that handles the story generation process.
 * - GenerateDailyStoryInput - The input type for the generateDailyStory function.
 * - GenerateDailyStoryOutput - The return type for the generateDailyStory function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateDailyStoryInputSchema = z.object({
  childAge: z.number().describe('The age of the child the story is for.'),
  storyTheme: z.string().describe('The theme of the story.'),
});
export type GenerateDailyStoryInput = z.infer<typeof GenerateDailyStoryInputSchema>;

const GenerateDailyStoryOutputSchema = z.object({
  title: z.string().describe('The title of the story.'),
  story: z.string().describe('The generated story.'),
});
export type GenerateDailyStoryOutput = z.infer<typeof GenerateDailyStoryOutputSchema>;

export async function generateDailyStory(input: GenerateDailyStoryInput): Promise<GenerateDailyStoryOutput> {
  return generateDailyStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyStoryPrompt',
  input: {
    schema: z.object({
      childAge: z.number().describe('The age of the child the story is for.'),
      storyTheme: z.string().describe('The theme of the story.'),
    }),
  },
  output: {
    schema: z.object({
      title: z.string().describe('The title of the story.'),
      story: z.string().describe('The generated story.'),
    }),
  },
  prompt: `You are a skilled children's story writer tasked with crafting a unique, age-appropriate bedtime story for a child. Create a story with simple, clear vocabulary, an engaging and cohesive plot, positive themes, and a length suitable for bedtime reading. The story should consist of exactly 10 sentences to ensure a complete yet concise narrative.

Age: {{{childAge}}}

Theme: {{{storyTheme}}}

IMPORTANT REQUIREMENTS:
1. The story MUST be centered around the theme "{{{storyTheme}}}" - this theme should drive the entire narrative
2. Create ORIGINAL characters and settings specific to this theme
3. Use age-appropriate language for a {{{childAge}}}-year-old child
4. The story must be EXACTLY 10 sentences long
5. Each sentence should advance the plot in a meaningful way
6. Include descriptive language that brings the story to life
7. End with a satisfying conclusion that ties to the theme

For example:
- If theme is "Space Adventure": Create a unique story about exploring new planets or meeting friendly aliens
- If theme is "Friendship": Develop a story about making new friends or helping others
- If theme is "Magic": Craft a tale about discovering magical powers or enchanted objects
- If theme is "Animals": Tell a story about unique animal characters or wildlife adventures

Make the story ENGAGING and MEMORABLE, avoiding generic plots. Each generated story should feel fresh and different from others.

Respond with:
1. A creative, theme-appropriate title
2. A 10-sentence story that follows all requirements above`,
});

const generateDailyStoryFlow = ai.defineFlow<
  typeof GenerateDailyStoryInputSchema,
  typeof GenerateDailyStoryOutputSchema
>({
  name: 'generateDailyStoryFlow',
  inputSchema: GenerateDailyStoryInputSchema,
  outputSchema: GenerateDailyStoryOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
