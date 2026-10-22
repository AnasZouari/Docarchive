interface PageStateProps {
    loading?: boolean;
    message?: string;
    retry?: () => void;
  }
  
  export default function PageState({
    loading,
    message,
    retry,
  }: PageStateProps) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center"
        role={loading ? 'status' : 'alert'}
      >
        {loading ? (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-slate-500">
              Loading your library…
            </p>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-slate-900">
              Your library is temporarily unavailable
            </h2>
  
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              {message}
            </p>
  
            <button
              onClick={retry}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </>
        )}
      </div>
    );
  }