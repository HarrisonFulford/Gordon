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
        
        self.gordon_prompt = """You are Gordon Ramsay generating SPECIFIC cooking quotes for the given cooking steps. Each quote must be DIRECTLY related to the actual cooking action being performed.

GORDON RAMSAY STYLE RULES:
- Use his signature phrases: "Right!", "Come on!", "Beautiful!", "Perfect!", "Bloody hell!"
- Be encouraging but direct: "Let's go!", "That's it!", "Keep going!"
- Use cooking terminology: "sear", "sauté", "mise en place", "seasoning"
- Be motivational: "You've got this!", "That's the way!"
- Keep it concise and punchy (1-2 sentences max)
- Match the energy to the step type (prep = focused, cook = energetic, end = celebratory)

CRITICAL REQUIREMENTS:
1. Each quote MUST reference the SPECIFIC cooking action in that step
2. Use the EXACT ingredients/techniques mentioned in each step
3. NO generic quotes - every quote must be unique to its step
4. Reference cooking times, temperatures, or techniques when mentioned
5. Build on the previous step's progress when appropriate

Return ONLY JSON in this EXACT format (no extra text):
{
  "quotes": [
    {
      "stepId": "step-1",
      "timestamp": 30,
      "quote": "[Quote specifically about the prep action mentioned in step-1]"
    },
    {
      "stepId": "step-2", 
      "timestamp": 300,
      "quote": "[Quote specifically about the cooking technique in step-2]"
    }
  ]
}

EXAMPLE TRANSFORMATIONS:
- Step: "Dice the onions into 1/4 inch pieces" → "Right! Nice even dice on those onions. Quarter-inch pieces, that's perfect!"
- Step: "Sear the chicken breast for 4 minutes per side" → "Beautiful! Listen to that sizzle. Four minutes each side, don't touch it!"
- Step: "Add garlic and cook until fragrant" → "Perfect! Now the garlic goes in. Thirty seconds until fragrant, come on!"

CRITICAL RULES:
1. First step quote should be at timestamp 30 (30 seconds in)
2. All other quotes should match their step's tStart timestamp
3. Include one quote for the final step (end of session)
4. Each quote must be SPECIFIC to its step's cooking action
5. Use Gordon's signature style but make it relevant
6. NO repetitive or generic motivational quotes"""

    def generate_quotes_for_timeline(self, timeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate Gordon Ramsay quotes for a cooking timeline."""
        if not timeline:
            return []
        
        # Create detailed context for the prompt
        steps_context = []
        for i, step in enumerate(timeline):
            step_number = i + 1
            step_type = step.get('type', 'instruction')
            step_category = step.get('category', 'general')
            step_text = step.get('text', '')
            start_time = step.get('tStart', 0)
            end_time = step.get('tEnd', start_time + 300)
            duration = end_time - start_time
            
            context_line = f"Step {step_number} ({step['id']}): \"{step_text}\""
            context_line += f" | Type: {step_type} | Category: {step_category}"
            context_line += f" | Time: {start_time}s-{end_time}s ({duration//60}min {duration%60}s duration)"
            
            steps_context.append(context_line)
        
        context = "\n".join(steps_context)
        
        # Create the full prompt with detailed instructions
        full_prompt = f"""{self.gordon_prompt}

COOKING TIMELINE DETAILS:
{context}

QUOTE GENERATION INSTRUCTIONS:
- Create a unique quote for each step that directly references the cooking action
- Use specific ingredients, techniques, or timings mentioned in each step
- Make each quote feel like Gordon is watching and coaching that exact moment
- Vary the language and approach for each step to avoid repetition
- For prep steps: Focus on technique and precision
- For cooking steps: Focus on heat, timing, and sensory cues
- For final steps: Focus on presentation and completion
- IMPORTANT: Each quote must be distinctly different - no repeated phrases or structures

Generate quotes for these specific cooking steps:"""
        
        try:
            response = self.v2_client.chat(
                model=COHERE_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": full_prompt
                    }
                ],
                max_tokens=800,  # Increased for more detailed responses
                temperature=0.6  # Balanced creativity and consistency
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
