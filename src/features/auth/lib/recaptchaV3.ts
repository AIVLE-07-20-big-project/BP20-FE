import { RECAPTCHA_SITE_KEY } from "../../../shared/config/runtimeEnv";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SCRIPT_ID = "Market Poke-recaptcha-v3";
let scriptLoadingPromise: Promise<void> | null = null;
let activeCaptchaViews = 0;

function syncBadgeVisibility() {
  const badge = document.querySelector<HTMLElement>(".grecaptcha-badge");
  if (badge) {
    badge.style.visibility = activeCaptchaViews > 0 ? "visible" : "hidden";
  }
}

function loadRecaptchaScript(): Promise<void> {
  if (window.grecaptcha) {
    return Promise.resolve();
  }
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");

    const handleLoad = () => resolve();
    const handleError = () => {
      scriptLoadingPromise = null;
      reject(new Error("Google reCAPTCHA 스크립트를 불러오지 못했습니다."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      script.id = SCRIPT_ID;
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}&hl=ko`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return scriptLoadingPromise;
}

export async function initializeRecaptcha(): Promise<void> {
  if (!RECAPTCHA_SITE_KEY) {
    return;
  }

  await loadRecaptchaScript();
  syncBadgeVisibility();
}

export function activateRecaptchaBadge(): () => void {
  if (!RECAPTCHA_SITE_KEY) {
    return () => undefined;
  }

  activeCaptchaViews += 1;
  syncBadgeVisibility();

  return () => {
    activeCaptchaViews = Math.max(0, activeCaptchaViews - 1);
    syncBadgeVisibility();
  };
}

export async function executeRecaptcha(action: string): Promise<string | null> {
  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  await loadRecaptchaScript();
  const recaptcha = window.grecaptcha;
  if (!recaptcha) {
    throw new Error("Google reCAPTCHA를 초기화하지 못했습니다.");
  }

  return new Promise<string>((resolve, reject) => {
    recaptcha.ready(() => {
      recaptcha.execute(RECAPTCHA_SITE_KEY, { action })
        .then((token) => {
          syncBadgeVisibility();
          resolve(token);
        })
        .catch(reject);
    });
  });
}
