import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ChefHat, Clock, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { motion } from 'motion/react';
import { gordonAPI, Recipe } from '../services/api';

const mockRecipes: Recipe[] = [
  {
    id: 'beef-stir-fry',
    name: 'Classic Beef Stir Fry',
    description: 'A delicious and quick beef stir fry with fresh vegetables and savory sauce.',
    cookTime: 25,
    servings: 4,
    difficulty: 'Medium',
    category: 'Asian',
    ingredients: ['Beef strips', 'Bell peppers', 'Onions', 'Soy sauce', 'Garlic', 'Ginger'],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
  },
  {
    id: 'chicken-pasta',
    name: 'Creamy Chicken Pasta',
    description: 'Rich and creamy pasta with tender chicken and herbs.',
    cookTime: 30,
    servings: 6,
    difficulty: 'Easy',
    category: 'Italian',
    ingredients: ['Chicken breast', 'Pasta', 'Heavy cream', 'Parmesan', 'Garlic', 'Herbs'],
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop'
  },
  {
    id: 'salmon-teriyaki',
    name: 'Teriyaki Glazed Salmon',
    description: 'Perfectly glazed salmon with steamed vegetables and rice.',
    cookTime: 20,
    servings: 2,
    difficulty: 'Medium',
    category: 'Japanese',
    ingredients: ['Salmon fillets', 'Teriyaki sauce', 'Rice', 'Broccoli', 'Carrots'],
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop'
  },
  {
    id: 'veggie-curry',
    name: 'Vegetable Curry',
    description: 'Aromatic vegetable curry with coconut milk and spices.',
    cookTime: 35,
    servings: 4,
    difficulty: 'Easy',
    category: 'Indian',
    ingredients: ['Mixed vegetables', 'Coconut milk', 'Curry spices', 'Onions', 'Tomatoes'],
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop'
  }
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export function RecipeSelection() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setError(null);
      setGeneratedRecipes([]); // Clear previous recipes
      setIsGenerating(true); // Set loading state immediately
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Generate recipes from image
      setIsGenerating(true);
      try {
        const result = await gordonAPI.generateRecipes(file);
        setGeneratedRecipes(result.recipes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate recipes');
        setGeneratedRecipes([]);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleStartCooking = () => {
    if (selectedRecipe) {
      // Store recipe data for the session (including timeline)
      sessionStorage.setItem('selectedRecipe', JSON.stringify(selectedRecipe));
      // Navigate to live session with the selected recipe
      navigate(`/session/${selectedRecipe.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <motion.div 
        className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="font-bold">Gordon - AI Cooking Assistant</h1>
                <p className="text-sm text-muted-foreground">Select your recipe to start cooking</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="container mx-auto p-4">
        {/* Top section: Image upload */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Ingredients Photo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center relative">
                  {isGenerating && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-sm font-medium">Analyzing...</p>
                      </div>
                    </div>
                  )}
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="Uploaded ingredients" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground">
                        Great! We've analyzed your ingredients.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Upload a photo of your ingredients</p>
                        <p className="text-xs text-muted-foreground">
                          We'll suggest recipes based on what you have
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isGenerating}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom section: Recipe selection */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-center mb-6">Choose Your Recipe</h2>
          </motion.div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
            {/* Loading state */}
            {isGenerating && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Generating Recipes...</h3>
                <p className="text-sm text-muted-foreground">
                  Analyzing your ingredients with AI
                </p>
              </div>
            )}

            {/* Error state */}
            {error && !isGenerating && (
              <div className="col-span-full text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setError(null);
      setGeneratedRecipes([]); // Clear previous recipes
      setIsGenerating(true); // Set loading state immediately
                    if (selectedImage) {
                      handleImageUpload({ target: { files: [selectedImage] } } as any);
                    }
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* No recipes state */}
            {!isGenerating && !error && generatedRecipes.length === 0 && selectedImage && (
              <div className="col-span-full text-center py-12">
                <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Recipes Found</h3>
                <p className="text-sm text-muted-foreground">
                  Try uploading a different image with more visible ingredients
                </p>
              </div>
            )}

            {/* Generated recipes */}
            {!isGenerating && generatedRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              >
                <Card 
                  key={recipe.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedRecipe?.id === recipe.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold text-lg">{recipe.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {recipe.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {recipe.cookTime}m
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {recipe.servings}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {recipe.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-2">Key ingredients:</p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients.slice(0, 4).map((ingredient, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                          {recipe.ingredients.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{recipe.ingredients.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Start cooking button */}
          {selectedRecipe && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center mt-8"
            >
              <Button
                size="lg"
                onClick={handleStartCooking}
                className="flex items-center gap-2"
              >
                <ChefHat className="w-5 h-5" />
                Start Cooking {selectedRecipe.name}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </div>

        {/* Helper text */}
        <motion.div 
          className="mt-12 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <p>
            Select a recipe to start your guided cooking session with real-time instructions
          </p>
        </motion.div>
      </div>
    </div>
  );
} 