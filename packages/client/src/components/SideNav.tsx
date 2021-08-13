import { IComponentAsProps, INavButtonProps, INavLink, INavLinkGroup, Nav } from '@fluentui/react';
import {
    NavLink, useLocation
} from "react-router-dom";
import { AppRoute } from '../routes';

const CustomLink = (props: IComponentAsProps<INavButtonProps>) => {
    const url = props.link!.url;
    const isExact = props.link!.exact === true;
    const DefaultRender = props.defaultRender;

    const Nested = (navLinkProps: any) => {
        const nestedProps = {
            ...props,
            href: navLinkProps.href,
        };
        return <DefaultRender {...nestedProps}/>;
    };

    return <NavLink exact={isExact} to={url} component={Nested}/>;
};

const navLinkForRoute = (r: AppRoute, exact?: boolean): INavLink => ({
    name: r,
    url: AppRoute.urls[r],
    key: AppRoute.urls[r], 
    icon: AppRoute.icons[r],
    exact,
});

const navLinkGroups: INavLinkGroup[] = [{
    links: [
        navLinkForRoute(AppRoute.Dashboard, true),
        navLinkForRoute(AppRoute.WatchLive),
        navLinkForRoute(AppRoute.Playback),
        navLinkForRoute(AppRoute.FeedSetup),
        navLinkForRoute(AppRoute.Settings),
    ]
}];

export const SideNav = () => {
    return <nav className="side-nav">
        <Nav
            selectedKey={useLocation().pathname}
            groups={navLinkGroups}
            linkAs={CustomLink}
        />
    </nav>;
};
