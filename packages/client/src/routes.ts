export enum AppRoute {
    Dashboard = 'Dashboard',
    WatchLive = 'Watch Live',
    Playback = 'Playback',
    Configure = 'Configure',
};

export namespace AppRoute {
    export const urls: Record<AppRoute, string> = {
        [AppRoute.Dashboard]: '/',
        [AppRoute.WatchLive]: '/watch',
        [AppRoute.Playback]: '/playback',
        [AppRoute.Configure]: '/config',
    }

    export const icons: Record<AppRoute, string> = {
        [AppRoute.Dashboard]: 'Home',
        [AppRoute.WatchLive]: 'Video',
        [AppRoute.Playback]: 'PlayerPlay',
        [AppRoute.Configure]: 'Settings',
    }
}


