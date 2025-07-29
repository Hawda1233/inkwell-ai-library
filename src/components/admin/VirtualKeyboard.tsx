import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Keyboard, Type } from "lucide-react";

interface VirtualKeyboardProps {
  language: 'mr' | 'hi';
  onInsert: (text: string) => void;
  onClose: () => void;
}

const marathiKeys = [
  ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ'],
  ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'],
  ['ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न'],
  ['प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श'],
  ['ष', 'स', 'ह', 'ळ', 'क्ष', 'ज्ञ', 'ं', 'ः', '।', '॥']
];

const hindiKeys = [
  ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ'],
  ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'],
  ['ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न'],
  ['प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श'],
  ['ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ', 'ं', 'ः', '।', '॥']
];

// Simple transliteration mappings
const marathiTransliteration: { [key: string]: string } = {
  'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ii': 'ई', 'u': 'उ', 'uu': 'ऊ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  'ka': 'क', 'kha': 'ख', 'ga': 'ग', 'gha': 'घ', 'nga': 'ङ',
  'cha': 'च', 'chha': 'छ', 'ja': 'ज', 'jha': 'झ', 'nja': 'ञ',
  'Ta': 'ट', 'Tha': 'ठ', 'Da': 'ड', 'Dha': 'ढ', 'Na': 'ण',
  'ta': 'त', 'tha': 'थ', 'da': 'द', 'dha': 'ध', 'na': 'न',
  'pa': 'प', 'pha': 'फ', 'ba': 'ब', 'bha': 'भ', 'ma': 'म',
  'ya': 'य', 'ra': 'र', 'la': 'ल', 'va': 'व',
  'sha': 'श', 'shha': 'ष', 'sa': 'स', 'ha': 'ह', 'La': 'ळ'
};

const hindiTransliteration: { [key: string]: string } = {
  'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ii': 'ई', 'u': 'उ', 'uu': 'ऊ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  'ka': 'क', 'kha': 'ख', 'ga': 'ग', 'gha': 'घ', 'nga': 'ङ',
  'cha': 'च', 'chha': 'छ', 'ja': 'ज', 'jha': 'झ', 'nja': 'ञ',
  'Ta': 'ट', 'Tha': 'ठ', 'Da': 'ड', 'Dha': 'ढ', 'Na': 'ण',
  'ta': 'त', 'tha': 'थ', 'da': 'द', 'dha': 'ध', 'na': 'न',
  'pa': 'प', 'pha': 'फ', 'ba': 'ब', 'bha': 'भ', 'ma': 'म',
  'ya': 'य', 'ra': 'र', 'la': 'ल', 'va': 'व',
  'sha': 'श', 'shha': 'ष', 'sa': 'स', 'ha': 'ह'
};

export const VirtualKeyboard = ({ language, onInsert, onClose }: VirtualKeyboardProps) => {
  const [transliterationInput, setTransliterationInput] = useState('');
  
  const keys = language === 'mr' ? marathiKeys : hindiKeys;
  const transliterationMap = language === 'mr' ? marathiTransliteration : hindiTransliteration;
  
  const handleTransliterate = () => {
    const words = transliterationInput.split(' ');
    const transliterated = words.map(word => {
      return transliterationMap[word.toLowerCase()] || word;
    }).join(' ');
    
    onInsert(transliterated);
    setTransliterationInput('');
  };

  const handleKeyPress = (key: string) => {
    onInsert(key);
  };

  return (
    <Card className="p-4 mt-2 border-2 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4" />
          <span className="font-medium">
            {language === 'mr' ? 'मराठी व्हर्च्युअल कीबोर्ड' : 'हिंदी वर्चुअल कीबोर्ड'}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="virtual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="virtual" className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Virtual Keys
          </TabsTrigger>
          <TabsTrigger value="transliterate" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Transliterate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="virtual" className="space-y-2">
          <div className="space-y-2">
            {keys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {row.map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => handleKeyPress(key)}
                    className="min-w-[40px] h-8 text-sm"
                  >
                    {key}
                  </Button>
                ))}
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onInsert(' ')}
              className="px-8"
            >
              Space
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onInsert('')}
              className="px-4"
            >
              ⌫
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="transliterate" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type in English (e.g., "ka", "kha", "ga"):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={transliterationInput}
                onChange={(e) => setTransliterationInput(e.target.value)}
                placeholder="Type: ka, kha, ga, etc."
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTransliterate();
                  }
                }}
              />
              <Button onClick={handleTransliterate} size="sm">
                Convert
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <p><strong>Examples:</strong></p>
            <p>ka → क, kha → ख, ga → ग, cha → च, ma → म</p>
            <p>Type words separated by spaces for multiple characters</p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};