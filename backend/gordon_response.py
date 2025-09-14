#!/usr/bin/env python3
"""
Gordon Ramsay Response Generator
Generates Gordon Ramsay-style responses to user speech during cooking sessions.
"""

import json
import time
from typing import Dict, Any, Optional
import cohere
from backend.config import COHERE_API_KEY, COHERE_MODEL


class GordonResponseGenerator:
    """Generates Gordon Ramsay-style responses to user speech."""
    
    def __init__(self):
        if not COHERE_API_KEY or COHERE_API_KEY == 'your_cohere_api_key_here':
            raise ValueError("Cohere API key not configured. Please set COHERE_API_KEY in .env file")
        
        self.client = cohere.Client(COHERE_API_KEY)
        self.v2_client = self.client.v2
        
        self.gordon_response_prompt = """You are Gordon Ramsay responding to someone cooking in your kitchen. 

GORDON RAMSAY PERSONALITY:
- Passionate, energetic, and direct
- Uses signature phrases: "Right!", "Come on!", "Beautiful!", "Perfect!", "Bloody hell!"
- Encouraging but honest: "You've got this!", "That's it!", "Keep going!"
- Uses cooking terminology naturally
- Responds to questions with expertise and enthusiasm
- Can be critical but always constructive
- Shows genuine care for good cooking

RESPONSE RULES:
1. Respond as if you're right there coaching them in person
2. Keep responses conversational and natural (1-3 sentences)
3. Match the energy to what they're saying
4. If they ask cooking questions, give specific helpful advice
5. If they're struggling, be encouraging but direct
6. If they're doing well, celebrate with them
7. Use Gordon's signature expressions naturally
8. Stay in character - you're Gordon Ramsay in the kitchen

Examples:
- User: "I think I'm burning the onions" → "Right, turn that heat down! Don't panic, just keep stirring. You can save them, come on!"
- User: "How long should I cook this?" → "Listen to the sizzle! When it sounds right, it is right. Trust your instincts!"
- User: "This smells amazing" → "Beautiful! That's what I'm talking about. You're getting it now!"

Respond naturally as Gordon would in the moment."""

    def generate_response(self, user_speech: str, cooking_context: Optional[str] = None) -> Optional[str]:
        """Generate a Gordon Ramsay response to user speech."""
        if not user_speech.strip():
            return None
        
        try:
            # Create context-aware prompt
            context_info = ""
            if cooking_context:
                context_info = f"\n\nCOOKING CONTEXT: {cooking_context}"
            
            full_prompt = f"{self.gordon_response_prompt}{context_info}\n\nUser just said: \"{user_speech}\"\n\nGordon responds:"
            
            response = self.v2_client.chat(
                model=COHERE_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": full_prompt
                    }
                ],
                max_tokens=150,  # Keep responses concise
                temperature=0.7  # Some personality but stay consistent
            )
            
            # Extract response text
            response_text = response.message.content[0].text.strip()
            
            # Clean up any quotes or formatting
            if response_text.startswith('"') and response_text.endswith('"'):
                response_text = response_text[1:-1]
            
            return response_text
            
        except Exception as e:
            print(f"Error generating Gordon response: {e}")
            return None


# Global instance
_gordon_response_generator = None

def get_gordon_response_generator():
    """Get or create the global Gordon response generator."""
    global _gordon_response_generator
    if _gordon_response_generator is None:
        _gordon_response_generator = GordonResponseGenerator()
    return _gordon_response_generator


def generate_gordon_response(user_speech: str, cooking_context: Optional[str] = None) -> Optional[str]:
    """Generate a Gordon Ramsay response to user speech."""
    generator = get_gordon_response_generator()
    return generator.generate_response(user_speech, cooking_context)


if __name__ == "__main__":
    # Test the response generator
    test_speeches = [
        "I think I'm burning the onions",
        "How long should I cook this?",
        "This smells amazing",
        "I'm not sure if this is right",
        "Should I add more salt?"
    ]
    
    generator = get_gordon_response_generator()
    
    print("🧪 Testing Gordon Response Generator")
    print("=" * 50)
    
    for speech in test_speeches:
        print(f"\n👤 User: \"{speech}\"")
        response = generator.generate_response(speech)
        if response:
            print(f"🍳 Gordon: \"{response}\"")
        else:
            print("❌ No response generated")
    
    print("\n✅ Gordon Response Generator test completed!") 