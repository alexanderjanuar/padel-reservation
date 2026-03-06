export default function AppLogo() {
    return (
        <div className="ml-1 flex items-center gap-3">
            <div className="flex aspect-square size-10 shrink-0 items-center justify-center overflow-hidden">
                <img
                    src="/images/logo-removebg-preview.png"
                    alt="Aubry Padel Logo"
                    className="h-full w-full object-contain"
                />
            </div>
            <div className="grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate text-lg font-bold tracking-tight text-slate-900">
                    Aubry Padel
                </span>
            </div>
        </div>
    );
}
