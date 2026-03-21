import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white selection:bg-yellow-200">
            <div className="max-w-md w-full text-center relative">
                <h1 className="text-9xl font-extrabold tracking-tighter text-slate-100 absolute -top-16 left-1/2 -translate-x-1/2 -z-10 select-none">
                    404
                </h1>

                <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4 mt-8">
                    Page not found
                </h2>

                <p className="text-lg text-slate-500 mb-8 font-medium">
                    Sorry, we couldn't find the page or profile you're looking for. It might have been deleted or the link is incorrect.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center px-8 py-3 bg-yellow-400 hover:bg-black hover:text-white text-black font-bold rounded-xl transition-all duration-300"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
