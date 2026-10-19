"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Đã xảy ra lỗi</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {process.env.NODE_ENV === "development" ? error.message : "Vui lòng thử lại sau."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mx-auto rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Thử lại
      </button>
    </div>
  );
}
