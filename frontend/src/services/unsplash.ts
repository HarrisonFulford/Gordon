// Mock unsplash service - in real app this would use the actual Unsplash API
export async function unsplash_tool({ query }: { query: string }): Promise<string> {
  // Since we can't directly call the Unsplash API in this environment,
  // we'll return a placeholder that matches the expected image URLs
  const imageUrls = [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1574781330855-d0db3cd45b7e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556909114-5ba2a6211b3e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565895405-c9457565ab56?w=400&h=300&fit=crop'
  ];
  
  // Return a random image URL
  const randomIndex = Math.floor(Math.random() * imageUrls.length);
  return imageUrls[randomIndex];
}