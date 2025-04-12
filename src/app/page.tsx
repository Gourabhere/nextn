'use client';

import {generateDailyStory} from '@/ai/flows/generate-daily-story';
import {generateStoryVisuals} from '@/ai/flows/generate-story-visuals';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger} from '@/components/ui/sheet';
import {Textarea} from '@/components/ui/textarea';
import {useToast} from '@/hooks/use-toast';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';

const DUMMY_IMAGE_URL = 'https://picsum.photos/512/384';

export default function Home() {
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyPages, setStoryPages] = useState<string[]>([]);
  const [storyImages, setStoryImages] = useState<string[]>([]);
  const [pageText, setPageText] = useState<string>('');
  const [storyImageUrl, setStoryImageUrl] = useState<string>(DUMMY_IMAGE_URL);
  const [childAge, setChildAge] = useState<number>(5);
  const [storyTheme, setStoryTheme] = useState<string>('Adventure');
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [readAloud, setReadAloud] = useState<boolean>(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [fontSize, setFontSize] = useState<number>(24); // Default font size

  const {toast} = useToast();

  const {register, handleSubmit, formState: {errors}} = useForm();

  useEffect(() => {
    if (readAloud && pageText) {
      handleReadAloud();
    }
    return () => {
      if (utterance) {
        window.speechSynthesis.cancel();
      }
    };
  }, [pageText, readAloud]);

  useEffect(() => {
    if (storyPages.length > 0) {
      setPageText(storyPages[pageNumber]);
      if (storyImages[pageNumber]) {
        setStoryImageUrl(storyImages[pageNumber]);
      } else {
        handleGenerateVisual();
      }
    }
  }, [pageNumber, storyPages]);

  const onSubmit = async (data: any) => {
    setChildAge(Number(data.childAge));
    setStoryTheme(data.storyTheme);
    await handleGenerateStory();
  };

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    try {
      const storyResult = await generateDailyStory({childAge, storyTheme});
      setStoryTitle(storyResult.title);

      // Split the story into sentences, limit to 10 pages
      const sentences = storyResult.story.split('.').map(s => s.trim()).filter(s => s.length > 0);
      const pages = sentences.slice(0, 10); // Take only the first 10 sentences
      setStoryPages(pages);
      setPageNumber(0);
      setPageText(pages[0]);
      setStoryImages([]); // Clear previous images
      
      // Generate images for all sentences upfront
      for (let i = 0; i < pages.length; i++) {
        const visualResult = await generateStoryVisuals({storyText: pages[i], style: 'cartoonish, playful'});
        setStoryImages(prev => [...prev, visualResult.imageUrl]);
      }
    } catch (error: any) {
      console.error('Story generation failed:', error);
      toast({
        title: 'Error generating story',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVisual = async () => {
    setIsGenerating(true);
    try {
      const visualResult = await generateStoryVisuals({storyText: pageText, style: 'cartoonish, playful'});
      setStoryImageUrl(visualResult.imageUrl);
      // Update the image in the array
      setStoryImages(prev => {
        const newImages = [...prev];
        newImages[pageNumber] = visualResult.imageUrl;
        return newImages;
      });
    } catch (error: any) {
      console.error('Visual generation failed:', error);
      toast({
        title: 'Error generating visual',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < storyPages.length - 1) {
      setPageNumber((prevPageNumber) => prevPageNumber + 1);
    }
  };

  const handlePreviousPage = () => {
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 0));
  };

  const handleReadAloud = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setReadAloud(false);
      return;
    }

    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance(pageText);
    utterThis.onend = () => {
      setReadAloud(false);
    };
    utterThis.onerror = () => {
      setReadAloud(false);
    };
    synth.speak(utterThis);
    setUtterance(utterThis);
    setReadAloud(true);
  };

  const handleExportPdf = () => {
    toast({
      title: 'Export to PDF',
      description: 'This feature is not implemented yet.',
    });
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 4, 48));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 4, 16));
  };

  return (
    <div className="flex flex-col min-h-screen bg-lavender-50 py-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-violet-700">Rayesha&apos;s Nightly Tales</h1>
        <p className="text-md text-gray-600">A new bedtime story, every night.</p>
      </header>

      {storyPages.length > 0 ? (
        <div className="container mx-auto px-4">
          <Card className="shadow-lg rounded-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-800">{storyTitle}</CardTitle>
              <CardDescription className="text-gray-500">Page {pageNumber + 1} of {storyPages.length}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <img src={storyImageUrl} alt={storyTitle} className="w-full rounded-md mb-4"/>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50">
                  <p 
                    className="text-white font-comic text-center"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {pageText}
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
              <Button variant="outline" onClick={handlePreviousPage} disabled={pageNumber === 0}>
                Previous Page
              </Button>
              <div className="flex space-x-2">
                <Button onClick={handleGenerateVisual} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Regenerate Visual'}
                </Button>
                <Button onClick={handleReadAloud} disabled={isGenerating}>
                  {readAloud ? 'Stop Reading' : 'Read Aloud'}
                </Button>
                <Button onClick={increaseFontSize} disabled={isGenerating}>
                  A+
                </Button>
                <Button onClick={decreaseFontSize} disabled={isGenerating}>
                  A-
                </Button>
                <Button onClick={handleExportPdf}>Export to PDF</Button>
              </div>
              <Button onClick={handleNextPage} disabled={pageNumber === storyPages.length - 1}>
                Next Page
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="container mx-auto px-4">
          <Card className="shadow-lg rounded-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-800">Customize Your Story</CardTitle>
              <CardDescription className="text-gray-500">Enter details to generate a unique story.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-4">
                <div>
                  <Label htmlFor="childAge">Child&apos;s Age</Label>
                  <Input id="childAge" type="number" defaultValue={childAge}
                         {...register('childAge', {required: 'Age is required', min: 1, max: 10})}/>
                  {errors.childAge && <p className="text-red-500">{errors.childAge.message?.toString()}</p>}
                </div>
                <div>
                  <Label htmlFor="storyTheme">Story Theme</Label>
                  <Textarea
                    id="storyTheme"
                    defaultValue={storyTheme}
                    {...register('storyTheme', {required: 'Theme is required'})}
                    className="resize-none"/>
                  {errors.storyTheme && <p className="text-red-500">{errors.storyTheme.message?.toString()}</p>}
                </div>
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate Story'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="mt-4">
                Open previous stories
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-teal-50">
              <SheetHeader>
                <SheetTitle>Previous Stories</SheetTitle>
                <SheetDescription>
                  These are the bedtime stories of the past.
                </SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <Button type="submit">Save</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <footer className="text-center mt-8">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Rayesha&apos;s Nightly Tales. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
