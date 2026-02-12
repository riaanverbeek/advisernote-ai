import { NextRequest, NextResponse } from 'next/server';
import { checkSubscriptionStatus, getUserFromRequest } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    // Check user subscription
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { isActive } = await checkSubscriptionStatus(user.id);
    
    if (!isActive) {
      return NextResponse.json(
        { error: 'Active subscription required to generate summaries' },
        { status: 403 }
      );
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes text concisely and clearly. Provide a summary that captures the main points.',
          },
          {
            role: 'user',
            content: `Please summarize the following text:\n\n${text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'Summarization failed' },
        { status: response.status }
      );
    }

    const result = await response.json();
    const summary = result.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json(
        { error: 'No summary generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
