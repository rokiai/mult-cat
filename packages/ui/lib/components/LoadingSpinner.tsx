interface ILoadingSpinnerProps {
  size?: number;
}

const STYLE_ID = 'mc-loading-spinner-style';

const ensureStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .mc-loading {
      box-sizing: border-box;
      display: flex;
      min-height: 100vh;
      width: 100%;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(120% 70% at 10% -10%, rgba(123, 97, 255, 0.1), transparent 50%),
        radial-gradient(90% 60% at 100% 0%, rgba(91, 141, 255, 0.08), transparent 45%),
        linear-gradient(180deg, #f7f8fc 0%, #f0f2f7 100%);
    }

    .mc-loading__mark {
      position: relative;
      display: grid;
      place-items: center;
    }

    .mc-loading__ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: #7b61ff;
      border-right-color: rgba(123, 97, 255, 0.35);
      animation: mc-spin 0.9s cubic-bezier(0.5, 0.15, 0.35, 0.85) infinite;
    }

    .mc-loading__ring--outer {
      inset: -6px;
      border-width: 2px;
      border-top-color: #5b8dff;
      border-right-color: rgba(91, 141, 255, 0.25);
      animation-duration: 1.35s;
      animation-direction: reverse;
      opacity: 0.85;
    }

    .mc-loading__core {
      width: 38%;
      height: 38%;
      border-radius: 50%;
      background: linear-gradient(135deg, #7b61ff, #5b8dff);
      box-shadow: 0 6px 18px rgba(123, 97, 255, 0.35);
      animation: mc-pulse 1.2s ease-in-out infinite;
    }

    @keyframes mc-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes mc-pulse {
      0%, 100% { transform: scale(0.92); opacity: 0.85; }
      50% { transform: scale(1); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .mc-loading__ring,
      .mc-loading__ring--outer,
      .mc-loading__core {
        animation: none;
      }
    }
  `;
  document.head.appendChild(style);
};

export const LoadingSpinner = ({ size = 44 }: ILoadingSpinnerProps) => {
  ensureStyles();

  return (
    <div className="mc-loading" role="status" aria-label="Loading">
      <div className="mc-loading__mark" style={{ width: size, height: size }}>
        <span className="mc-loading__ring mc-loading__ring--outer" />
        <span className="mc-loading__ring" />
        <span className="mc-loading__core" />
      </div>
    </div>
  );
};
