
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
    
    // Get events from request body
    const { events } = await req.json();
    if (!events || !Array.isArray(events)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing events data' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sync events to Google Calendar
    const syncedEvents = [];
    
    for (const event of events) {
      // Format the event for Google Calendar API
      const googleEvent = {
        summary: event.title,
        description: event.description || "",
        start: {
          dateTime: new Date(event.date).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(new Date(event.date).getTime() + 60 * 60 * 1000).toISOString(), // Add 1 hour by default
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
        continue;
      }
      
      const data = await response.json();
      syncedEvents.push({
        localEventId: event.id,
        googleEventId: data.id,
      });
    }
    
    return new Response(
      JSON.stringify({ syncedEvents }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
