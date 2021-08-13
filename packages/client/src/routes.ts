export enum AppRoute {
    Dashboard = 'Dashboard',
    WatchLive = 'Live View',
    Playback = 'Playback',
    FeedSetup = 'Feed Config',
    Settings = 'Settings',
};

export namespace AppRoute {
    export const urls: Record<AppRoute, string> = {
        [AppRoute.Dashboard]: '/',
        [AppRoute.WatchLive]: '/watch',
        [AppRoute.Playback]: '/playback',
        [AppRoute.FeedSetup]: '/feeds',
        [AppRoute.Settings]: '/settings',
    }

    export const icons: Record<AppRoute, string> = {
        [AppRoute.Dashboard]: 'Home',
        [AppRoute.WatchLive]: 'Video',
        [AppRoute.Playback]: 'PlayerPlay',
        [AppRoute.FeedSetup]: 'SettingsAutomation',
        [AppRoute.Settings]: 'AdjustmentsHorizontal',
    }
}


