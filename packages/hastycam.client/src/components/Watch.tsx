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
            activeFeeds: {},
        };
    }

    componentDidMount() {
        fetch('http://localhost:4000/feed/list')
            .then(response => response.json())
            .then(feeds => {
                this.setState({
                    activeFeeds: feeds.reduce((map: Record<string, boolean>, name: string) => {
                        map[name] = true;
                        return map;
                    }, {})
                })
                this.props.setFeeds!(feeds);
            });
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
                {this.props.feeds.map(f => <label>
                    <input type="checkbox" checked={this.state.activeFeeds[f]} onChange={e => this.toggleActiveFeed(f, e.target.checked)} /> {f}
                </label>)}
                <hr/>
                {this.props.feeds.map(f => {
                    if (this.state.activeFeeds[f]) {
                        return <img style={{ width: '30vw' }} src={`http://localhost:4000/feed/view/${encodeURIComponent(f)}`}/>
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