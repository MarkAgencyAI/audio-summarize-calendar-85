
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
