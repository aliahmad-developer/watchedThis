// app/api/daily-recommendations/route.ts
import { NextResponse } from 'next/server';

interface MediaItem {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  media_type?: string;
}

// Simple in-memory cache
let dailyCache: {
  today: MediaItem | null;
  yesterday: MediaItem | null;
  twoDaysAgo: MediaItem | null;
  lastUpdated: string;
} = {
  today: null,
  yesterday: null,
  twoDaysAgo: null,
  lastUpdated: ''
};

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we need to refresh the cache
    if (dailyCache.lastUpdated !== today || !dailyCache.today) {
      console.log('🔄 Refreshing daily recommendations...');
      
      // Fetch new random media for today using your existing API
      const newMedia = await fetchRandomMedia();
      
      // Rotate the cache
      dailyCache.twoDaysAgo = dailyCache.yesterday;
      dailyCache.yesterday = dailyCache.today;
      dailyCache.today = newMedia;
      dailyCache.lastUpdated = today;
    }

    // Build recommendations array with fallbacks
    const recommendations = [
      dailyCache.today,
      dailyCache.yesterday || dailyCache.today,
      dailyCache.twoDaysAgo || dailyCache.yesterday || dailyCache.today
    ].filter(Boolean) as MediaItem[];

    return NextResponse.json({
      success: true,
      data: recommendations,
      lastUpdated: dailyCache.lastUpdated
    });

  } catch (error) {
    console.error('Error in daily recommendations:', error);
    
    // Fallback to whatever we have
    const fallback = [
      dailyCache.today,
      dailyCache.yesterday,
      dailyCache.twoDaysAgo
    ].filter(Boolean) as MediaItem[];

    if (fallback.length > 0) {
      return NextResponse.json({
        success: true,
        data: fallback,
        lastUpdated: dailyCache.lastUpdated,
        usingFallback: true
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load daily recommendations' 
      },
      { status: 500 }
    );
  }
}

// Use your existing randomCall API
async function fetchRandomMedia(): Promise<MediaItem> {
  try {
    // Since we're in the same app, we can call the internal API directly
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/randomCall`);

    if (!response.ok) {
      throw new Error(`Random call API responded with status: ${response.status}`);
    }

    const media = await response.json();
    return media;
  } catch (error) {
    console.error('Error fetching random media:', error);
    
    // Fallback mock data if API fails
    return {
      id: Math.floor(Math.random() * 1000),
      title: 'Featured Movie',
      overview: 'An exciting featured movie recommendation.',
      poster_path: null,
      backdrop_path: null,
      media_type: 'movie'
    };
  }
}