import { IComponentAsProps, INavButtonProps, INavLink, INavLinkGroup, Nav } from '@fluentui/react';
import {
    NavLink, useLocation
} from "react-router-dom";

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

export const SideNav = () => {
    const links: INavLink[] = [{
        name: 'Home',
        url: '/',
        icon: 'Home',
        exact: true,
    },{
        name: 'Watch',
        url: '/watch',
        icon: 'PlayerPlay',
    },{
        name: 'Settings',
        url: '/config',
        icon: 'Settings',
    }].map(link => ({
        ...link, 
        key: link.url 
    }));
    const navLinkGroups: INavLinkGroup[] = [{
        links
    }];

    return (
        <nav className="side-nav">
            <Nav
                selectedKey={useLocation().pathname}
                groups={navLinkGroups}
                linkAs={CustomLink}
            />
        </nav>
    );
};
