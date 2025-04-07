
// Constants
const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"; // Replace with your actual Google Client ID
const API_KEY = "YOUR_GOOGLE_API_KEY"; // Replace with your actual Google API Key
const SCOPES = "https://www.googleapis.com/auth/calendar";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

// Generate the redirect URI based on the current origin
const REDIRECT_URI = `${window.location.origin}/calendar`;

/**
 * Google Calendar Service to handle authentication and API calls
 */
export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private gapiInitialized = false;
  private gisInitialized = false;

  constructor() {
    // This is a singleton
    if (GoogleCalendarService.instance) {
      return GoogleCalendarService.instance;
    }
    GoogleCalendarService.instance = this;
  }

  /**
   * Initialize the Google API client
   */
  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("Initializing Google Calendar Service...");
      
      // Check if gapi is defined
      if (typeof window.gapi === 'undefined' || !window.gapi) {
        this.loadScript('https://apis.google.com/js/api.js')
          .then(() => this.initGapi())
          .then(() => {
            if (typeof window.google === 'undefined' || !window.google || !window.google.accounts) {
              return this.loadScript('https://accounts.google.com/gsi/client');
            }
          })
          .then(() => this.initTokenClient())
          .then(() => {
            console.log("Google Calendar Service initialized");
            resolve();
          })
          .catch(error => {
            console.error("Failed to initialize Google Calendar Service", error);
            reject(error);
          });
      } else {
        this.initGapi()
          .then(() => this.initTokenClient())
          .then(() => {
            console.log("Google Calendar Service initialized from cached scripts");
            resolve();
          })
          .catch(reject);
      }
    });
  }

  /**
   * Initialize the Google API client
   */
  private async initGapi(): Promise<void> {
    if (this.gapiInitialized) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      if (!window.gapi || !window.gapi.load) {
        reject(new Error("Google API client not loaded"));
        return;
      }

      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
          });
          this.gapiInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Initialize the Google Identity Services client
   */
  private async initTokenClient(): Promise<void> {
    if (this.gisInitialized) return Promise.resolve();
    
    return new Promise((resolve) => {
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        console.error("Google Identity Services not loaded");
        resolve(); // Resolve anyway to avoid hanging
        return;
      }

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: () => {
          this.gisInitialized = true;
          resolve();
        },
        error_callback: (error) => {
          console.error("Token client error", error);
          resolve(); // Resolve anyway to avoid hanging
        }
      });
      
      // If the callback doesn't fire for some reason, resolve anyway after a timeout
      setTimeout(() => {
        if (!this.gisInitialized) {
          console.warn("Token client initialization timed out, but proceeding");
          this.gisInitialized = true;
          resolve();
        }
      }, 5000);
    });
  }

  /**
   * Load a script dynamically
   */
  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (error) => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Check if the user is signed in
   */
  public isSignedIn(): boolean {
    return localStorage.getItem('google_access_token') !== null;
  }

  /**
   * Sign in with Google
   */
  public async signIn(): Promise<void> {
    if (!this.tokenClient) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      try {
        if (!this.tokenClient) {
          reject(new Error("Token client not initialized"));
          return;
        }

        this.tokenClient.requestAccessToken({
          prompt: 'consent',
          hint: localStorage.getItem('google_user_email') || undefined
        });
        
        // The token is handled in the callback, just resolve here
        const checkToken = setInterval(() => {
          if (this.isSignedIn()) {
            clearInterval(checkToken);
            resolve();
          }
        }, 500);
        
        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(checkToken);
          if (!this.isSignedIn()) {
            reject(new Error("Sign in timed out"));
          }
        }, 120000);
      } catch (error) {
        console.error("Error signing in with Google", error);
        reject(error);
      }
    });
  }

  /**
   * Sign out from Google
   */
  public signOut(): void {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    localStorage.removeItem('google_user_email');
    
    // Revoke the token if possible
    if (window.gapi && window.gapi.client && window.gapi.client.getToken) {
      const token = window.gapi.client.getToken();
      if (token !== null && window.google && window.google.accounts && window.google.accounts.oauth2) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
          window.gapi.client.setToken(null);
        });
      }
    }
  }

  /**
   * Create an event in Google Calendar
   */
  public async createEvent(event: {
    title: string;
    description: string;
    startTime: Date;
    endTime?: Date;
  }): Promise<{ id: string, htmlLink: string }> {
    await this.ensureAuth();
    
    // Create end time if not provided (1 hour after start)
    const endTime = event.endTime || new Date(event.startTime.getTime() + 60 * 60 * 1000);
    
    // Format the event for Google Calendar API
    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    // Create the event
    try {
      if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
        throw new Error("Google Calendar API not initialized");
      }

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent
      });
      
      return {
        id: response.result.id,
        htmlLink: response.result.htmlLink
      };
    } catch (error) {
      console.error("Error creating event in Google Calendar", error);
      throw error;
    }
  }

  /**
   * Sync multiple events to Google Calendar
   */
  public async syncEvents(events: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
  }>): Promise<Array<{ 
    localEventId: string;
    googleEventId: string;
    htmlLink: string;
  }>> {
    await this.ensureAuth();
    
    console.log(`Syncing ${events.length} events to Google Calendar`);
    
    // Process events in batches to avoid rate limiting
    const batchSize = 10;
    const syncedEvents = [];
    const failedEvents = [];
    
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      
      // Create promises for each event in the batch
      const promises = batch.map(async (event) => {
        try {
          const startTime = new Date(event.date);
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
          
          const result = await this.createEvent({
            title: event.title,
            description: event.description,
            startTime,
            endTime
          });
          
          return {
            localEventId: event.id,
            googleEventId: result.id,
            htmlLink: result.htmlLink
          };
        } catch (error) {
          console.error(`Error syncing event ${event.id}`, error);
          failedEvents.push({
            localEventId: event.id,
            error: error instanceof Error ? error.message : String(error)
          });
          return null;
        }
      });
      
      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      
      // Filter out null results (failed events)
      syncedEvents.push(...results.filter(Boolean));
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < events.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Successfully synced ${syncedEvents.length} events`);
    if (failedEvents.length > 0) {
      console.error(`Failed to sync ${failedEvents.length} events`, failedEvents);
    }
    
    return syncedEvents;
  }

  /**
   * Ensure the user is authenticated
   */
  private async ensureAuth(): Promise<void> {
    // Initialize if needed
    if (!this.gapiInitialized || !this.gisInitialized) {
      await this.init();
    }
    
    // Check if the token is expired
    const expiryTime = localStorage.getItem('google_token_expiry');
    const isExpired = !expiryTime || new Date().getTime() > parseInt(expiryTime);
    
    // Refresh the token if expired
    if (isExpired && this.tokenClient) {
      return new Promise((resolve, reject) => {
        if (!this.tokenClient) {
          reject(new Error("Token client not initialized"));
          return;
        }

        this.tokenClient.requestAccessToken({
          prompt: '',
          hint: localStorage.getItem('google_user_email') || undefined,
          callback: (response) => {
            if (response.error) {
              reject(new Error(`Error refreshing token: ${response.error}`));
              return;
            }
            
            // Token response is automatically handled by the tokenClient
            resolve();
          }
        });
      });
    }
  }

  /**
   * Set the access token from a token response
   */
  public handleTokenResponse(response: google.accounts.oauth2.TokenResponse): void {
    // Calculate expiry time and store token in localStorage
    const expiryTime = new Date().getTime() + ((response.expires_in || 3600) * 1000);
    localStorage.setItem('google_access_token', response.access_token);
    localStorage.setItem('google_token_expiry', expiryTime.toString());
    
    // Store user email if available
    if (window.gapi && window.gapi.client && window.gapi.client.getToken && window.gapi.client.people) {
      window.gapi.client.people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses'
      }).then(resp => {
        const email = resp.result.emailAddresses?.[0]?.value;
        if (email) {
          localStorage.setItem('google_user_email', email);
        }
      }).catch(err => {
        console.error('Error fetching user info', err);
      });
    }
  }
}

// Export a singleton instance
export const googleCalendarService = new GoogleCalendarService();
