
// Type definitions for Google API Client
interface Window {
  gapi: any;
  google: {
    accounts: {
      oauth2: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (tokenResponse: google.accounts.oauth2.TokenResponse) => void;
          error_callback?: (error: any) => void;
        }) => google.accounts.oauth2.TokenClient;
        revoke: (token: string, callback: () => void) => void;
      }
    };
  };
}

namespace google.accounts.oauth2 {
  interface TokenClient {
    requestAccessToken: (options: {
      prompt?: string;
      hint?: string;
      callback?: (response: TokenResponse) => void;
    }) => void;
  }

  interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    error?: string;
    error_description?: string;
  }
}

// Declare the gapi namespace
declare namespace gapi {
  let client: {
    init: (args: {
      apiKey: string;
      discoveryDocs: string[];
    }) => Promise<void>;
    getToken: () => { access_token: string } | null;
    setToken: (token: { access_token: string } | null) => void;
    calendar: {
      events: {
        insert: (args: { calendarId: string; resource: any }) => Promise<{
          result: {
            id: string;
            htmlLink: string;
          }
        }>;
      };
    };
    load: (api: string, callback: () => void) => void;
    people?: {
      people: {
        get: (params: {
          resourceName: string;
          personFields: string;
        }) => Promise<{
          result: {
            emailAddresses?: Array<{
              value: string;
            }>;
          }
        }>;
      }
    };
  };
}
