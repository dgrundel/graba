import React from 'react';
import { connect } from 'react-redux';
import { setFeeds } from '../store/reducers/configReducer';
import { RootState } from '../store/store';
 

interface Props {
    feeds: string[];
    setFeeds?: (feeds: string[]) => void;
}

interface State {
    activeFeeds: Record<string, boolean>;
}

class Component extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            activeFeeds: props.feeds.reduce((map: Record<string, boolean>, name: string) => {
                map[name] = true;
                return map;
            }, {}),
        };
    }

    toggleActiveFeed(name: string, isActive: boolean) {
        this.setState(prev => ({
            activeFeeds: {
                ...prev.activeFeeds,
                [name]: isActive,
            }
        }));
    }

    render() {
        return (
            <div>
                <hr/>
                {this.props.feeds.map(name => <label>
                    <input type="checkbox" checked={this.state.activeFeeds[name]} onChange={e => this.toggleActiveFeed(name, e.target.checked)} /> {name}
                </label>)}
                <hr/>
                {this.props.feeds.map(name => {
                    if (this.state.activeFeeds[name]) {
                        return <img style={{ width: '30vw' }} alt={name} src={`http://localhost:4000/feed/view/${encodeURIComponent(name)}`}/>
                    } else {
                        return undefined;
                    }
                })}
            </div>
        );
    }
}

const mapStateToProps = (state: RootState): Props => {
    return {
        feeds: state.config.feeds
    }
};

const mapDispatchToProps = {
    setFeeds,
};

export const Watch = connect(mapStateToProps, mapDispatchToProps)(Component);