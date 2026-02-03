export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment');
      return res.status(500).json({ 
        error: 'ANTHROPIC_API_KEY not configured. Please add it to your Vercel environment variables.' 
      });
    }

    console.log('API Key found, calling Anthropic...');

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageData
                }
              },
              {
                type: "text",
                text: `Analyze this fashion item and provide styling suggestions. Return ONLY a JSON object (no markdown, no backticks) with this structure:
{
  "itemDescription": "brief description of the item and its color",
  "styleCategory": "casual/formal/sporty/elegant",
  "colorPalette": ["color1", "color2", "color3"],
  "outfitSuggestions": [
    {
      "name": "Outfit name",
      "items": {
        "tops": "suggestion with colors",
        "bottoms": "suggestion with colors",
        "accessories": "suggestion"
      },
      "vibe": "description of the look",
      "searchTerms": {
        "zara": "zara search term",
        "mango": "mango search term",
        "parfois": "parfois search term"
      }
    },
    {
      "name": "Another outfit name",
      "items": {
        "tops": "different suggestion with colors",
        "bottoms": "different suggestion with colors",
        "accessories": "different suggestion"
      },
      "vibe": "description of this look",
      "searchTerms": {
        "zara": "zara search term",
        "mango": "mango search term",
        "parfois": "parfois search term"
      }
    }
  ],
  "tips": ["tip1", "tip2", "tip3"]
}`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({
        error: `Anthropic API error: ${response.status} - ${errorText}`
      });
    }

    const data = await response.json();
    const textContent = data.content.find(item => item.type === 'text')?.text || '';
    
    // Clean and parse the response
    const cleanText = textContent.trim();
    const parsed = JSON.parse(cleanText);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Error in analyze route:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}
