
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get access token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    // Get events and redirectUri from request body
    const { events, redirectUri } = await req.json();
    if (!events || !Array.isArray(events) || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing events data or redirectUri' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${events.length} events for Google Calendar sync with redirectUri: ${redirectUri}`);

    // Sync events to Google Calendar
    const syncedEvents = [];
    const errorEvents = [];
    
    for (const event of events) {
      try {
        // Format the event for Google Calendar API
        const startTime = new Date(event.date);
        // Default end time is 1 hour after start time
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        
        const googleEvent = {
          summary: event.title,
          description: event.description || "",
          start: {
            dateTime: startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        };
        
        // Create event in Google Calendar
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error creating event in Google Calendar:', errorData);
          errorEvents.push({
            localEventId: event.id,
            error: errorData
          });
          continue;
        }
        
        const data = await response.json();
        syncedEvents.push({
          localEventId: event.id,
          googleEventId: data.id,
          htmlLink: data.htmlLink
        });
      } catch (error) {
        console.error('Error processing event:', error);
        errorEvents.push({
          localEventId: event.id,
          error: error.message
        });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        syncedEvents,
        errorEvents,
        totalSynced: syncedEvents.length,
        totalErrors: errorEvents.length
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Google Calendar Sync Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
