import React from 'react';
import {ec2Service, eventBus} from './services';
import autobind from 'react-autobind';
import moment from 'moment';

export default class InstanceInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      state: props.record.state,
      launched: props.record.launched,
      expanded: false
    };
    autobind(this);
  }

  getName() {
    if (this.props.record.tags.Name) {
      return this.props.record.tags.Name + " (" + this.props.record.id + ")";
    } else {
      return this.props.record.id;
    }
  }

  getLastLaunched() {
    return moment(this.state.launched).format('MMMM Do, YYYY h:mm:ss a');
  }

  onInstanceStateChange(data) {
    this.setState({state: data.state, launched: data.launched});
  }

  expand() {
    this.setState({expanded: true});
  }

  collapse() {
    this.setState({expanded: false});
  }

  componentDidMount() {
    eventBus.on('instanceStateChanged.' + this.props.record.id, this.onInstanceStateChange);
    eventBus.on('expandAll', this.expand);
    eventBus.on('collapseAll', this.collapse);
    switch(this.state.state) {
      case 'pending':
        ec2Service.requestNotification('start', [this.props.record.id]);
        break;
      case 'stopping':
        ec2Service.requestNotification('stop', [this.props.record.id]);
        break;
    }
  }

  componentWillUnmount() {
    eventBus.removeListener('instanceStateChanged.' + this.props.record.id, this.onInstanceStateChange);
    eventBus.removeListener('expandAll', this.expand);
    eventBus.removeListener('collapseAll', this.collapse);
  }

  doStart() {
    if (confirm("Are you sure you want to start the instance \"" + this.getName() + "\"?")) {
      ec2Service.startInstances([this.props.record.id]);
      this.setState({state: 'startRequested'});
    }
  }

  doStop() {
    if (confirm("Are you sure you want to stop the instance \"" + this.getName() + "\"?")) {
      ec2Service.stopInstances([this.props.record.id]);
      this.setState({state: 'stopRequested'});
    }
  }

  toggle(evt) {
    this.setState({expanded: !this.state.expanded});
    evt.preventDefault();
    return false;
  }

  render() {
    let className = "instanceInfo col-sm-6 col-sm-offset-3 col-xs-12 " + this.state.state;

    let buttonNode = '';
    switch(this.state.state) {
      case 'stopped':
        buttonNode = (
          <button className="btn btn-success btn-xs" onClick={this.doStart}>
            <span className="glyphicon glyphicon-play"></span>
            &nbsp;Start
          </button>
        );
        break;
      case 'running':
        buttonNode = (
          <button className="btn btn-danger btn-xs" onClick={this.doStop}>
            <span className="glyphicon glyphicon-stop"></span>
            &nbsp;Stop
          </button>
        );
        break;
      default:
        buttonNode = <span className="spinner"/>;
        break;
    }

    let publicIp = this.props.record.publicIp;
    let pubIdNode = '';
    if (publicIp) {
      let href = "http://" + this.props.record.publicIp;
      pubIdNode = <li><b>Public IP:</b>&nbsp;<a href={href} target="_blank">{this.props.record.publicIp}</a></li>;
    }

    let tagNodes = [];
    Object.keys(this.props.record.tags).forEach((tag) => {
      tagNodes.push(<li key={tag} className="tag"><b>{tag}:</b>&nbsp;{this.props.record.tags[tag]}</li>);
    });

    let togglerClass = "glyphicon glyphicon-triangle-" + (this.state.expanded ? 'bottom' : 'right');
    let listClass = 'instanceDetails ' + (this.state.expanded ? 'expanded' : 'collapsed');

    let securityGroupList = [];
    this.props.record.securityGroups.forEach(grp => {
      securityGroupList.push(<li key={grp}>{grp}</li>);
    });

    return (
      <div className={className}>
        <div className="row">
          <div className="col-sm-9 col-xs-12">
            <div className="instanceName">
              <a href="#" onClick={this.toggle}>
                <span className={togglerClass}/>
                &nbsp;
                {this.getName()}
              </a>
            </div>
            <ul className={listClass}>
              <li><b>Last launched:</b>&nbsp;{this.getLastLaunched()}</li>
              <li><b>Instance type:</b>&nbsp;{this.props.record.type}</li>
              <li><b>Private IP:</b>&nbsp;{this.props.record.privateIp}</li>
              <li><b>Security Groups:</b><ul>{securityGroupList}</ul></li>
              {pubIdNode}
              {tagNodes}
            </ul>
          </div>
          <div className="col-sm-3 col-xs-12 text-right instanceActions">
            {this.state.state}
            &nbsp;
            {buttonNode}
          </div>
        </div>
      </div>
    );
  }
}
