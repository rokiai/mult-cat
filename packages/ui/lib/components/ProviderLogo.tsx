import type { CSSProperties } from 'react';

type TranslationProviderLogoId = 'microsoft' | 'google' | 'yandex' | 'tencent' | 'openai';

type Props = {
  provider: TranslationProviderLogoId | string;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

const ProviderLogo = ({ provider, size = 18, className, style }: Props) => {
  const common = {
    width: size,
    height: size,
    className,
    style: { display: 'block', flexShrink: 0, ...style },
    'aria-hidden': true as const,
  };

  switch (provider) {
    case 'google':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      );

    case 'microsoft':
      return (
        <svg {...common} viewBox="0 0 23 23">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#7FBA00" d="M12 1h10v10H12z" />
          <path fill="#00A4EF" d="M1 12h10v10H1z" />
          <path fill="#FFB900" d="M12 12h10v10H12z" />
        </svg>
      );

    case 'yandex':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#FC3F1D" />
          <text
            x="12"
            y="16.5"
            textAnchor="middle"
            fill="#fff"
            fontSize="13"
            fontWeight="700"
            fontFamily="Arial, Helvetica, sans-serif">
            Я
          </text>
        </svg>
      );

    case 'tencent':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#0052D9" />
          <text
            x="12"
            y="16.2"
            textAnchor="middle"
            fill="#fff"
            fontSize="11"
            fontWeight="700"
            fontFamily="PingFang SC, Microsoft YaHei, sans-serif">
            译
          </text>
        </svg>
      );

    case 'openai':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#10A37F" />
          <path
            fill="#fff"
            d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.911 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.182a5.985 5.985 0 0 0-3.332 2.38 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .511 4.91 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.989 5.989 0 0 0 3.331-2.38 6.046 6.046 0 0 0-.742-7.093zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.142-.081 4.778-2.758a.795.795 0 0 0 .393-.681v-6.737l2.02 1.169a.071.071 0 0 1 .038.052v5.582a4.504 4.504 0 0 1-4.495 4.494zm-9.661-4.126a4.471 4.471 0 0 1-.535-3.014l.142.085 4.783 2.758a.771.771 0 0 0 .781 0l5.843-3.368v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.499 4.499 0 0 1-6.141-1.646zM2.341 7.896a4.485 4.485 0 0 1 2.365-1.973V11.6a.766.766 0 0 0 .388.676l5.814 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.0 14.013a4.504 4.504 0 0 1-1.659-6.117zm16.596 3.856-5.833-3.387 2.015-1.164a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.104v-5.677a.79.79 0 0 0-.407-.667zm2.011-3.023-.142-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.499 4.499 0 0 1 6.68 4.66zM8.307 12.863l-2.02-1.164a.08.08 0 0 1-.038-.052V6.06a4.499 4.499 0 0 1 7.376-3.454l-.142.081-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
          />
        </svg>
      );

    default:
      return (
        <svg {...common} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="4" fill="#64748b" />
          <path stroke="#fff" strokeWidth="2" strokeLinecap="round" d="M7 12h10M12 7v10" />
        </svg>
      );
  }
};

export { ProviderLogo };
export type { TranslationProviderLogoId };
