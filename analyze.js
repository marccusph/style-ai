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
    const { imageData, style, season, language } = req.body;

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

    // Determine language instruction
    let languageInstruction = '';
    if (language && language !== 'English') {
      languageInstruction = `IMPORTANT: Respond in ${language}. All text in the JSON (itemDescription, outfit names, vibe descriptions, tips) must be in ${language}. `;
    }

    // Build the prompt based on whether style/season are provided
    let promptText = languageInstruction;
    
    if (style && season) {
      promptText += `Analyze this fashion item and provide ${style} style outfit suggestions specifically for ${season} season. Create polished, detailed outfit combinations that perfectly blend ${style} aesthetics with ${season} weather and vibe.`;
    } else {
      promptText += `Analyze this fashion item and provide styling suggestions.`;
    }

    promptText += ` Return ONLY a JSON object (no markdown, no backticks) with this structure:
{
  "itemDescription": "brief description of the item and its color",
  "styleCategory": "${style || 'casual/formal/sporty/elegant'}",
  "colorPalette": ["color1", "color2", "color3"],
  "outfitSuggestions": [
    {
      "name": "Outfit name that reflects the ${style || 'style'} ${season ? 'and ' + season : ''} vibe",
      "items": {
        "tops": "detailed suggestion with specific colors, fabrics, and ${season || ''} appropriate pieces",
        "bottoms": "detailed suggestion with specific colors, styles, and ${season || ''} appropriate pieces",
        "accessories": "detailed accessories including shoes, bags, jewelry that complement the ${style || 'style'} ${season ? 'and work for ' + season : ''}"
      },
      "vibe": "description of the complete look and why it works for ${style || 'this style'} ${season ? 'in ' + season : ''}"
    },
    {
      "name": "Second outfit name with different approach to ${style || 'the style'} ${season ? 'for ' + season : ''}",
      "items": {
        "tops": "different detailed suggestion",
        "bottoms": "different detailed suggestion",
        "accessories": "different accessories"
      },
      "vibe": "description of this look"
    },
    {
      "name": "Third outfit - another variation",
      "items": {
        "tops": "another detailed suggestion",
        "bottoms": "another detailed suggestion",
        "accessories": "more accessories"
      },
      "vibe": "description"
    }
  ],
  "tips": ["${style || 'style'}-specific tip for ${season || 'this season'}", "tip about colors and combinations", "tip about layering or fabric choices ${season ? 'for ' + season : ''}"]
}`;

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
        max_tokens: 2000,
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
                text: promptText
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
