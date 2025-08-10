interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

export async function enhanceProductDescription(description: string, productName: string, category: string): Promise<string> {
  try {
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const prompt = `You are a professional product description writer for an e-commerce construction materials website. 

Please enhance and rewrite the following product description to make it more appealing, informative, and SEO-friendly:

Product Name: ${productName}
Category: ${category}
Current Description: ${description}

Requirements:
- Make it engaging and professional
- Include key features and benefits
- Use construction industry terminology appropriately
- Keep it concise but informative (2-3 sentences)
- Focus on quality, durability, and practical applications
- Make it suitable for both contractors and individual buyers

Enhanced Description:`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Gemini API Error:', errorData)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data: GeminiResponse = await response.json()
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text.trim()
    }
    
    throw new Error('Invalid response format from Gemini API')
  } catch (error) {
    console.error('Error enhancing description:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to enhance description: ${error.message}`)
    }
    throw new Error('Failed to enhance description. Please try again.')
  }
}
