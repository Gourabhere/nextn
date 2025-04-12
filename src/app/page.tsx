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

const DUMMY_IMAGE_URL = 'https://play-lh.googleusercontent.com/G58Uh-xhf1kmq_xVDNjNRxQHcQnv2wtxjQMvr7F-JM53KkN5E6fnS58vYhjIzbOwIM0';//'https://picsum.photos/512/384';

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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [fontSize, setFontSize] = useState<number>(24); // Default font size

  const {toast} = useToast();

  const {register, handleSubmit, formState: {errors}} = useForm();

  // Initialize speech synthesis and load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Try to find a child-friendly or female voice
      const preferredVoice = availableVoices.find(
        voice => 
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('girl') ||
          voice.name.toLowerCase().includes('child')
      ) || availableVoices[0];
      
      setSelectedVoice(preferredVoice);
    };

    // Load voices when they're ready
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices(); // Initial load attempt
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle read aloud state changes
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
    if (typeof window === 'undefined') return;

    if (!window.speechSynthesis) {
      toast({
        title: 'Speech Synthesis Not Available',
        description: 'Your browser does not support text-to-speech.',
        variant: 'destructive',
      });
      return;
    }

    // Stop current speech if any
    window.speechSynthesis.cancel();
    
    if (readAloud) {
      setReadAloud(false);
      return;
    }

    if (!pageText) {
      toast({
        title: 'No Text to Read',
        description: 'There is no text available to read.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const utterThis = new SpeechSynthesisUtterance(pageText);
      
      // Basic configuration
      utterThis.lang = 'en-US';
      utterThis.rate = 0.9;
      utterThis.pitch = 1.0;
      utterThis.volume = 1.0;

      // Try to set voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
      if (englishVoice) {
        utterThis.voice = englishVoice;
      }

      // Event handlers
      utterThis.onstart = () => {
        console.log('Started speaking');
        setReadAloud(true);
      };

      utterThis.onend = () => {
        console.log('Finished speaking');
        setReadAloud(false);
        setUtterance(null);
      };

      utterThis.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.log('Speech error:', event);
        setReadAloud(false);
        setUtterance(null);
        toast({
          title: 'Read Aloud Error',
          description: 'Failed to read the text. Please try again.',
          variant: 'destructive',
        });
      };

      // Speak
      window.speechSynthesis.speak(utterThis);
      setUtterance(utterThis);
      setReadAloud(true);

    } catch (error) {
      console.error('Speech synthesis error:', error);
      setReadAloud(false);
      toast({
        title: 'Read Aloud Error',
        description: 'Failed to initialize text-to-speech. Please try again.',
        variant: 'destructive',
      });
    }
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
        <h1 className="text-4xl font-bold cartoon-title rainbow-text bounce-hover">Rayesha&apos;s Nightly Tales</h1>
        <p className="text-md text-violet-600 font-comic">A new bedtime story, every night.</p>
      </header>

      {storyPages.length > 0 ? (
        <div className="container mx-auto px-4">
          <Card className="cartoon-card float">
            <CardHeader>
              <CardTitle className="text-2xl cartoon-title">{storyTitle}</CardTitle>
              <CardDescription className="text-violet-600 font-comic">Page {pageNumber + 1} of {storyPages.length}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <img src={storyImageUrl} alt={storyTitle} className="w-full rounded-2xl shadow-lg mb-4"/>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-violet-900 bg-opacity-70 rounded-b-2xl backdrop-blur-sm">
                  <p 
                    className="text-white font-comic text-center"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {pageText}
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-between items-center px-6 py-4 bg-violet-50 border-t border-violet-200 rounded-b-lg">
              <Button variant="outline" onClick={handlePreviousPage} disabled={pageNumber === 0} className="cartoon-button">
                Previous Page
              </Button>
              <div className="flex space-x-2">
                <Button onClick={handleGenerateVisual} disabled={isGenerating} className="cartoon-button">
                  {isGenerating ? 'Generating...' : 'Regenerate Visual'}
                </Button>
                <Button 
                  onClick={handleReadAloud} 
                  disabled={isGenerating || !pageText} 
                  className="cartoon-button flex items-center space-x-2"
                >
                  {readAloud ? (
                    <>
                      <span>Stop Reading</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Read Aloud</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </>
                  )}
                </Button>
                <Button onClick={increaseFontSize} disabled={isGenerating} className="cartoon-button">
                  A+
                </Button>
                <Button onClick={decreaseFontSize} disabled={isGenerating} className="cartoon-button">
                  A-
                </Button>
                <Button onClick={handleExportPdf} className="cartoon-button">Export to PDF</Button>
              </div>
              <Button onClick={handleNextPage} disabled={pageNumber === storyPages.length - 1} className="cartoon-button">
                Next Page
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="container mx-auto px-4">
          <Card className="cartoon-card float">
            <CardHeader>
              <CardTitle className="text-2xl cartoon-title">Customize Your Story</CardTitle>
              <CardDescription className="text-violet-600 font-comic">Enter details to generate a unique story.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-4">
                <div>
                  <Label htmlFor="childAge" className="text-violet-700 font-comic">Child&apos;s Age</Label>
                  <Input 
                    id="childAge" 
                    type="number" 
                    defaultValue={childAge}
                    className="cartoon-input"
                    {...register('childAge', {required: 'Age is required', min: 1, max: 10})}
                  />
                  {errors.childAge && <p className="text-red-500 font-comic">{errors.childAge.message?.toString()}</p>}
                </div>
                <div>
                  <Label htmlFor="storyTheme" className="text-violet-700 font-comic">Story Theme</Label>
                  <Textarea
                    id="storyTheme"
                    defaultValue={storyTheme}
                    className="cartoon-input resize-none"
                    {...register('storyTheme', {required: 'Theme is required'})}
                  />
                  {errors.storyTheme && <p className="text-red-500 font-comic">{errors.storyTheme.message?.toString()}</p>}
                </div>
                <Button type="submit" disabled={isGenerating} className="cartoon-button">
                  {isGenerating ? 'Generating...' : 'Generate Story'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="mt-4 cartoon-button">
                Open previous stories
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-violet-50">
              <SheetHeader>
                <SheetTitle className="cartoon-title">Previous Stories</SheetTitle>
                <SheetDescription className="font-comic text-violet-600">
                  These are the bedtime stories of the past.
                </SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <Button type="submit" className="cartoon-button">Save</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <footer className="text-center mt-8">
        <p className="text-sm text-violet-600 font-comic">
          &copy; {new Date().getFullYear()} Rayesha&apos;s Nightly Tales. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
