interface TelegramWebApp {
  expand: () => void;
  close: () => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  isExpanded: boolean;
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
      [key: string]: any;
    };
    auth_date: number;
    hash: string;
    [key: string]: any;
  };
  viewport: {
    height: number;
    width: number;
    isStable: boolean;
  };
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    setParams: (params: { text?: string; color?: string; textColor?: string; [key: string]: any }) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    enable: () => void;
    disable: () => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    isVisible: boolean;
  };
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    [key: string]: string | undefined;
  };
  onEvent(eventName: string, callback: (...args: any[]) => void): void;
  offEvent(eventName: string, callback: (...args: any[]) => void): void;
  [key: string]: any;
}

interface Telegram {
  WebApp: TelegramWebApp;
  [key: string]: any;
}

declare global {
  interface Window {
    Telegram?: Telegram;
  }
}

export {}; 