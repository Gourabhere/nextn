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
  prompt: `You are a children's story writer. You will generate a unique, age-appropriate story for a child. The story should have simple vocabulary, an engaging plot, positive themes, and appropriate length for bedtime.

Age: {{{childAge}}}
Theme: {{{storyTheme}}}

Write a story with the above criteria and respond with a title and the story.`,
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
