#!/usr/bin/env python3
"""
Gordon Ramsay Quote Generator
Generates cooking quotes in Gordon Ramsay's style for timeline steps.
"""

import json
import time
from typing import List, Dict, Any
import cohere
from backend.config import COHERE_API_KEY, COHERE_MODEL


class GordonQuoteGenerator:
    """Generates Gordon Ramsay-style quotes for cooking steps."""
    
    def __init__(self):
        if not COHERE_API_KEY or COHERE_API_KEY == 'your_cohere_api_key_here':
            raise ValueError("Cohere API key not configured. Please set COHERE_API_KEY in .env file")
        
        self.client = cohere.Client(COHERE_API_KEY)
        self.v2_client = self.client.v2
        
        self.gordon_prompt = """You are Gordon Ramsay. Generate cooking quotes in his signature style for the given cooking steps.

GORDON RAMSAY STYLE RULES:
- Use his signature phrases: "Right!", "Come on!", "Beautiful!", "Perfect!", "Bloody hell!"
- Be encouraging but direct: "Let's go!", "That's it!", "Keep going!"
- Use cooking terminology: "sear", "sauté", "mise en place", "seasoning"
- Be motivational: "You've got this!", "That's the way!"
- Keep it concise and punchy (1-2 sentences max)
- Match the energy to the step type (prep = focused, cook = energetic, end = celebratory)

Return ONLY JSON in this EXACT format (no extra text):
{
  "quotes": [
    {
      "stepId": "step-1",
      "timestamp": 30,
      "quote": "Right! Let's get this mise en place sorted. Prep work is everything, come on!"
    },
    {
      "stepId": "step-2", 
      "timestamp": 300,
      "quote": "Beautiful! Now we're cooking. Heat that pan up, let's go!"
    },
    {
      "stepId": "step-final",
      "timestamp": 1500,
      "quote": "Perfect! That's how you finish a dish. Bloody beautiful work!"
    }
  ]
}

CRITICAL RULES:
1. First step quote should be at timestamp 30 (30 seconds in)
2. All other quotes should match their step's tStart timestamp
3. Include one quote for the final step (end of session)
4. Keep quotes short and punchy (1-2 sentences)
5. Use Gordon's signature style and phrases
6. Match the energy to the step type and context"""

    def generate_quotes_for_timeline(self, timeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate Gordon Ramsay quotes for a cooking timeline."""
        if not timeline:
            return []
        
        # Create context for the prompt
        steps_context = []
        for step in timeline:
            steps_context.append(f"Step {step['id']}: {step['text']} (Type: {step['type']}, Start: {step['tStart']}s)")
        
        context = "\n".join(steps_context)
        
        # Create the full prompt
        full_prompt = f"{self.gordon_prompt}\n\nCOOKING STEPS:\n{context}\n\nGenerate quotes for these steps:"
        
        try:
            response = self.v2_client.chat(
                model=COHERE_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": full_prompt
                    }
                ],
                max_tokens=500,
                temperature=0.8
            )
            
            # Parse response
            response_text = response.message.content[0].text.strip()
            
            # Extract JSON from response
            try:
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    result = json.loads(json_str)
                    return result.get('quotes', [])
                else:
                    return []
            except json.JSONDecodeError:
                return []
                
        except Exception as e:
            print(f"Error generating Gordon quotes: {e}")
            return []

    def save_quotes_to_file(self, quotes: List[Dict[str, Any]], filename: str = "quotes.txt"):
        """Save quotes to a text file."""
        try:
            with open(filename, 'w') as f:
                f.write("GORDON RAMSAY COOKING QUOTES\n")
                f.write("=" * 40 + "\n\n")
                
                for quote in quotes:
                    f.write(f"Step: {quote['stepId']}\n")
                    f.write(f"Time: {quote['timestamp']}s\n")
                    f.write(f"Quote: \"{quote['quote']}\"\n")
                    f.write("-" * 30 + "\n\n")
            
            print(f"✅ Gordon quotes saved to {filename}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving quotes: {e}")
            return False


# Global instance
_gordon_generator = None

def get_gordon_generator():
    """Get or create the global Gordon quote generator."""
    global _gordon_generator
    if _gordon_generator is None:
        _gordon_generator = GordonQuoteGenerator()
    return _gordon_generator


def generate_gordon_quotes_for_session(timeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate Gordon Ramsay quotes for a cooking session timeline."""
    generator = get_gordon_generator()
    quotes = generator.generate_quotes_for_timeline(timeline)
    generator.save_quotes_to_file(quotes)
    return quotes


if __name__ == "__main__":
    # Test with sample timeline
    sample_timeline = [
        {
            "id": "step-1",
            "tStart": 0,
            "tEnd": 300,
            "type": "instruction",
            "text": "Dice the onions into 1/4 inch pieces and mince the garlic",
            "category": "prep"
        },
        {
            "id": "step-2",
            "tStart": 300,
            "tEnd": 600,
            "type": "instruction",
            "text": "Heat olive oil in a large skillet over medium-high heat",
            "category": "cook"
        },
        {
            "id": "step-final",
            "tStart": 600,
            "tEnd": 900,
            "type": "end",
            "text": "Season with salt and pepper, then plate the dish",
            "category": "finish"
        }
    ]
    
    quotes = generate_gordon_quotes_for_session(sample_timeline)
    print(f"Generated {len(quotes)} Gordon quotes!")
