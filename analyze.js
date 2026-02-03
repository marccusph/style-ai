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
    let languageCode = 'English';
    
    if (language && language !== 'English') {
      languageCode = language;
      if (language === 'Portuguese (Portugal)') {
        languageInstruction = `YOU MUST RESPOND ENTIRELY IN EUROPEAN PORTUGUESE (pt-PT). Every single word in the JSON response must be in Portuguese from Portugal. `;
      } else if (language === 'Portuguese (Brazil)') {
        languageInstruction = `YOU MUST RESPOND ENTIRELY IN BRAZILIAN PORTUGUESE (pt-BR). Every single word in the JSON response must be in Brazilian Portuguese. `;
      } else if (language === 'French') {
        languageInstruction = `YOU MUST RESPOND ENTIRELY IN FRENCH. Every single word in the JSON response must be in French. `;
      } else if (language === 'Italian') {
        languageInstruction = `YOU MUST RESPOND ENTIRELY IN ITALIAN. Every single word in the JSON response must be in Italian. `;
      } else if (language === 'German') {
        languageInstruction = `YOU MUST RESPOND ENTIRELY IN GERMAN. Every single word in the JSON response must be in German. `;
      }
    }

    // Build the prompt based on whether style/season are provided
    let promptText = languageInstruction;
    
    if (style && season) {
      promptText += `Analyze this fashion item and provide ${style} style outfit suggestions specifically for ${season} season. Create polished, detailed outfit combinations that perfectly blend ${style} aesthetics with ${season} weather and vibe. `;
    } else {
      promptText += `Analyze this fashion item and provide styling suggestions. `;
    }

    promptText += `Return ONLY a JSON object (no markdown, no backticks, no preamble). ${languageInstruction ? 'Remember: ALL TEXT MUST BE IN ' + languageCode.toUpperCase() + '. ' : ''}The JSON structure:
{
  "itemDescription": "brief description in ${languageCode}",
  "styleCategory": "${style || 'the style category'}",
  "colorPalette": ["color1", "color2", "color3"],
  "outfitSuggestions": [
    {
      "name": "Outfit name in ${languageCode}",
      "items": {
        "tops": "detailed suggestion in ${languageCode} with specific colors, fabrics${season ? ', and ' + season + ' appropriate pieces' : ''}",
        "bottoms": "detailed suggestion in ${languageCode} with specific colors and styles${season ? ' for ' + season : ''}",
        "accessories": "detailed accessories in ${languageCode} including shoes, bags, jewelry"
      },
      "vibe": "complete description in ${languageCode} of why this look works"
    },
    {
      "name": "Second outfit name in ${languageCode}",
      "items": {
        "tops": "different detailed suggestion in ${languageCode}",
        "bottoms": "different detailed suggestion in ${languageCode}",
        "accessories": "different accessories in ${languageCode}"
      },
      "vibe": "description in ${languageCode}"
    },
    {
      "name": "Third outfit name in ${languageCode}",
      "items": {
        "tops": "another detailed suggestion in ${languageCode}",
        "bottoms": "another detailed suggestion in ${languageCode}",
        "accessories": "more accessories in ${languageCode}"
      },
      "vibe": "description in ${languageCode}"
    }
  ],
  "tips": ["tip 1 in ${languageCode}", "tip 2 in ${languageCode}", "tip 3 in ${languageCode}"]
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
