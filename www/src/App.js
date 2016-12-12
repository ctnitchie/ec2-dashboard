import React from 'react';
import {ec2Service, eventBus} from './services';
import InstanceInfo from './InstanceInfo';
import autobind from 'react-autobind';
import _ from 'lodash';

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      instances: [],
      unfilteredInstances: [],
      filterText: '',
      showRunning: true,
      showStopped: true,
      loadPending: true
    };
    autobind(this);
  }

  async componentDidMount() {
    let instances;
    try {
      instances = await ec2Service.listInstances();
      instances = instances.sort((a, b) => {
        let aName = a.tags.Name || a.id;
        let bName = b.tags.Name || b.id;
        return aName < bName ? -1 : 1;
      });

    } catch (e) {
      alert('Error loading instances.');
      console.log(e);
    }

    this.setState({unfilteredInstances: instances, instances: instances, loadPending: false});
  }

  onFilterChanged(event) {
    this.filterInstances({filterText: event.target.value});
  }

  filterInstances(newConfig) {
    let newState = Object.assign(
      _.pick(this.state, 'filterText', 'showRunning', 'showStopped'),
      newConfig
    );
    let instances = this.state.unfilteredInstances;
    let test = newState.filterText.toLowerCase();
    newState.instances = this.state.unfilteredInstances.filter((instance) => {
      if (!newState.showRunning && (instance.state === 'running' || instance.state === 'pending')) {
        return false;
      }
      if (!newState.showStopped && (instance.state === 'stopped' || instance.state === 'stopping')) {
        return false;
      }
      if (test) {
        let name = instance.tags.Name || instance.id;
        name += " " + instance.id;
        instance.securityGroups.forEach(grp => name += " " + grp);
        Object.values(instance.tags).forEach(v => name += " " + v);
        return name.toLowerCase().indexOf(test) !== -1;
      }
      return true;
    });
    this.setState(newState);
  }

  expandAll(event) {
    eventBus.emit('expandAll');
    event.preventDefault();
    return false;
  }

  collapseAll(event) {
    eventBus.emit('collapseAll');
    event.preventDefault();
    return false;
  }

  toggleShowStopped() {
    this.filterInstances({showStopped: !this.state.showStopped});
  }

  toggleShowRunning() {
    this.filterInstances({showRunning: !this.state.showRunning});
  }

  render() {
    let instanceList;
    if (this.state.instances.length) {
      instanceList = [];
      this.state.instances.forEach(instance => {
        instanceList.push(<InstanceInfo key={instance.id} record={instance}/>);
      });

    } else if (this.state.loadPending) {
      instanceList = <p className="col-sm-offset-3"><span className="spinner"/>&nbsp;Loading...</p>;

    } else {
      instanceList = <p className="col-sm-offset-3"><b>No instances found.</b></p>;
    }

    return (
      <div className="container">
        <div className="row">
          <div className="col-xs-12">
            <h1>EC2 Instance Status Dashboard</h1>
            <hr/>
            <div className="row">
              <div className="col-xs-12 col-sm-6 col-sm-offset-3">
                <div className="form-group">
                  <label htmlFor="filterInput">Search:</label>
                  <input type="text" className="form-control" id="filterInput"
                    value={this.state.filterText}
                    onChange={this.onFilterChanged}
                    disabled={this.state.loadPending}/>
                </div>
                <div className="text-center">
                  <label>
                    <input type="checkbox" checked={this.state.showRunning}
                      disabled={this.state.loadPending}
                      onChange={this.toggleShowRunning}/>
                    {' Include running instances'}
                  </label>
                  {' '}
                  <label>
                    <input type="checkbox" checked={this.state.showStopped}
                      disabled={this.state.loadPending}
                      onChange={this.toggleShowStopped}/>
                    {' Include stopped instances'}
                  </label>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xs-12 col-sm-6 col-sm-offset-3 expandCollapseButtons">
                <a href="#" onClick={this.expandAll}>Expand All</a>
                &nbsp;|&nbsp;
                <a href="#" onClick={this.collapseAll}>Collapse All</a>
              </div>
            </div>
            <div className="row">
              {instanceList}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
