import React from 'react';
import { connect } from 'react-redux';
import { setFeeds } from '../store/reducers/configReducer';
import { RootState } from '../store/store';
 

interface Props {
    feeds: string[];
    setFeeds?: (feeds: string[]) => void;
}

class Component extends React.Component<Props, {}> {

    constructor(props: Props) {
        super(props);
    }

    componentDidMount() {
        fetch('http://localhost:4000/feed/list')
            .then(response => response.json())
            .then(feeds => this.props.setFeeds!(feeds));
    }

    render() {
        return (
            <div>
                {this.props.feeds.map(f => {
                    return <img style={{ width: '30vw' }} src={`http://localhost:4000/feed/view/${f}`}/>
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