import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

const TELEGRAM_WIDGET_URL = "https://telegram.org/js/telegram-widget.js?22";

function getBotUsername() {
  return (
    process.env.TELEGRAM_BOT_USERNAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
    ""
  ).trim();
}

export default function TelegramFallbackPage() {
  const botUsername = getBotUsername();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center px-6">
          <Link href="/login" className="inline-flex items-center gap-2">
            <Image
              src="/logowhite.svg"
              alt="Whatnot Market"
              width={96}
              height={32}
              className="h-7 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-56px)] items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold">Telegram Fallback Login</h1>
            <p className="text-sm text-zinc-400">
              Use this fallback when the Telegram popup flow gets stuck.
            </p>
          </div>

          {botUsername ? (
            <div className="flex justify-center">
              <Script
                async
                src={TELEGRAM_WIDGET_URL}
                data-telegram-login={botUsername}
                data-size="large"
                data-request-access="write"
                data-userpic="false"
                data-auth-url="/api/auth/external/telegram/callback"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              Telegram fallback is not configured: missing{" "}
              <code>TELEGRAM_BOT_USERNAME</code>.
            </div>
          )}

          <div className="text-center text-xs text-zinc-500">
            <p>
              If Telegram asks for phone confirmation, approve from the Telegram app and you will
              be redirected back automatically.
            </p>
            <Link className="mt-3 inline-block text-zinc-300 underline" href="/login">
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
