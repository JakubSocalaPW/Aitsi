interface Window {
  fbAsyncInit: () => void;
  FB: {
    init(params: { appId: string; cookie: boolean; xfbml: boolean; version: string }): void;
    login(callback: (response: { authResponse?: { accessToken: string } }) => void, params?: { scope: string }): void;
    logout(callback?: () => void): void;
  };
  google: {
    accounts: {
      id: {
        initialize(config: { client_id: string; callback: (response: { credential: string }) => void }): void;
        prompt(): void;
        renderButton(element: HTMLElement, config: { theme?: string; size?: string; text?: string; width?: number; shape?: string }): void;
      };
    };
  };
}