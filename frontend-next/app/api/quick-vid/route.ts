import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../utils/supabaseServerClient';

// Configure runtime for long-running requests
export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes

export async function POST(request: NextRequest) {
  let description = '';
  
  try {
    // Get user authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    description = body.description;
    const projectId = body.projectId;
    const projectData = body.projectData;

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Create initial video generation record
    const { data: videoRecord, error: insertError } = await supabase
      .from('video_generations')
      .insert({
        user_id: user.id,
        description: description.trim(),
        status: 'generating',
        project_id: projectId || null,
        project_data: projectData || null
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create video record' },
        { status: 500 }
      );
    }

    // Prepare the request body
    const requestBody = {
      description: description.trim(),
      projectId: projectId || null,
      projectData: projectData || null
    };
    
    // Call the n8n webhook - this will run the complete workflow including the 60s wait
    let n8nResponse;
    try {
      n8nResponse = await fetch('https://n8n.srv1086917.hstgr.cloud/webhook/text-to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        // Set timeout to 2 minutes to allow for 60s processing + buffer
        signal: AbortSignal.timeout(120000)
      });
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'TimeoutError') {
        return NextResponse.json(
          { error: 'Video generation timed out. Please try again.' },
          { status: 408 }
        );
      }
      
      return NextResponse.json(
        { error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      return NextResponse.json(
        { error: `Failed to generate video. Server returned ${n8nResponse.status}: ${errorText}` },
        { status: n8nResponse.status }
      );
    }

    // Get response text and parse as JSON
    const responseText = await n8nResponse.text();

    let data;
    try {
      data = JSON.parse(responseText);

      // Handle new response format with multiple videos
      if (data.success && data.status === 'done' && data.mergedVideo) {
        // Video generation completed successfully - update the record with new structure
        const { error: updateError } = await supabase
          .from('video_generations')
          .update({
            video_url: data.mergedVideo, // Keep video_url for backward compatibility
            video_info: data.videoInfo || null,
            status: 'completed',
            completed_at: new Date().toISOString(),
            // New fields for multi-video support
            session_id: data.sessionId || null,
            total_scenes: data.totalScenes || 0,
            scene_videos: data.sceneVideos || [],
            merged_video: data.mergedVideo || null,
            youtube_video: data.youTubeVideo || null
          })
          .eq('id', videoRecord.id);

        if (updateError) {
          console.error('Error updating video record:', updateError);
          // Silently handle update error - video was generated successfully
        }
      } else if (data.status === 'error' || data.success === false) {
        // Update record with error status
        await supabase
          .from('video_generations')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', videoRecord.id);

        return NextResponse.json(
          { error: data.message || 'Video generation failed' },
          { status: 400 }
        );
      } else {
        // Update record with error status
        await supabase
          .from('video_generations')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', videoRecord.id);

        return NextResponse.json(
          { error: 'Unexpected response from video generation service' },
          { status: 500 }
        );
      }
    } catch (jsonError) {
      // Update record with error status
      await supabase
        .from('video_generations')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', videoRecord.id);

      return NextResponse.json(
        { error: 'Invalid response from video generation service' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: data.sessionId,
      status: data.status,
      totalScenes: data.totalScenes,
      sceneVideos: data.sceneVideos,
      mergedVideo: data.mergedVideo,
      youTubeVideo: data.youTubeVideo,
      message: data.message,
      data: data,
    });

  } catch (error) {
    // Try to update any existing video record with error status
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('video_generations')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('status', 'generating')
          .order('created_at', { ascending: false })
          .limit(1);
      }
    } catch (dbError) {
      // Silently handle database error during cleanup
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
