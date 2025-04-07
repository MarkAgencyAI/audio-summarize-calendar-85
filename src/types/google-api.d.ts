
// Type definitions for Google API Client
interface Window {
  gapi: {
    load: (
      apiName: string,
      callback: () => void
    ) => void;
    client: {
      init: (config: {
        apiKey: string;
        clientId: string;
        scope: string;
        discoveryDocs: string[];
      }) => Promise<void>;
      newBatch: () => {
        add: (
          request: any,
          options: { id: string }
        ) => void;
        execute: () => Promise<any>;
      };
      calendar: {
        events: {
          insert: (params: {
            calendarId: string;
            resource: any;
          }) => any;
          list: (params: {
            calendarId: string;
            timeMin: string;
            timeMax: string;
            maxResults: number;
          }) => Promise<any>;
        };
      };
    };
    auth2: {
      getAuthInstance: () => {
        isSignedIn: {
          get: () => boolean;
          listen: (callback: (isSignedIn: boolean) => void) => void;
        };
        signIn: () => Promise<any>;
        signOut: () => Promise<any>;
        currentUser: {
          get: () => {
            getBasicProfile: () => {
              getName: () => string;
              getEmail: () => string;
              getId: () => string;
            };
          };
        };
      };
    };
  };
}
