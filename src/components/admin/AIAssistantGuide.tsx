import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, BookOpen, Dumbbell, Heart, HelpCircle, Wand2 } from 'lucide-react';

export default function AIAssistantGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Content Assistant Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Wand2 className="h-4 w-4" />
            <AlertDescription>
              The AI Assistant uses OpenAI's GPT-4 to help you create engaging, professional course content
              tailored to your aura awareness curriculum.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex gap-3">
              <BookOpen className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Generate Lessons</h3>
                <p className="text-sm text-muted-foreground">
                  Create comprehensive lesson content with opening meditations, core teachings, practice exercises,
                  and integration reflections. Perfect for structured daily content.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Example prompt:</strong> "Understanding the layers of the aura and their significance"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Dumbbell className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Create Exercises</h3>
                <p className="text-sm text-muted-foreground">
                  Generate 3 practice exercises with clear instructions, duration guidelines, and integration tips.
                  Great for somatic practices and energy work.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Example prompt:</strong> "Grounding techniques for energy protection"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Heart className="h-6 w-6 text-pink-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Write Meditation Scripts</h3>
                <p className="text-sm text-muted-foreground">
                  Create calming, evocative guided meditation scripts (5-7 minutes) with gentle language,
                  pauses, and sensory awareness guidance.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Example prompt:</strong> "Connecting with your aura and sensing its boundaries"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <HelpCircle className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Generate Quiz Questions</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically create 5 quiz questions (multiple choice and reflection) based on your current
                  lesson content. Tests comprehension and encourages deeper exploration.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Wand2 className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Format Content</h3>
                <p className="text-sm text-muted-foreground">
                  Improve the formatting and readability of your existing content. Makes text more engaging
                  and easier to follow.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Pro Tips:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Be specific with your prompts for better results</li>
              <li>• You can edit the generated content before using it</li>
              <li>• Use "Format Content" to polish rough drafts</li>
              <li>• Generate quiz questions after finalizing lesson content</li>
              <li>• The AI understands the spiritual and somatic nature of your course</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}