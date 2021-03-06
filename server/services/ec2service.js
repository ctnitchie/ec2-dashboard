import fs from 'fs';
import AWS from 'aws-sdk';
import EventEmitter from 'events';

const ec2 = new AWS.EC2(getConfig());
const FILTERS = getFilters();

function getConfig() {
  let file = process.env.AWS_CONFIG || '.awsrc';
  return JSON.parse(fs.readFileSync(file, 'UTF-8'));
}

function getFilters() {
  if (process.env.AWS_EC2_FILTERS) {
    try {
      return JSON.parse(fs.readFileSync(process.env.AWS_EC2_FILTERS, 'UTF-8'));

    } catch (e) {
      console.log("Error loading filter file \"" + process.env.AWS_EC2_FILTERS + "\"");
      console.log(e);
      return [];
    }
  } else {
    return [];
  }
}

function simplifyEc2Info(instance) {
  let info = {
    id: instance.InstanceId,
    state: instance.State.Name,
    type: instance.InstanceType,
    launched: instance.LaunchTime,
    privateIp: instance.PrivateIpAddress,
    publicIp: instance.PublicIpAddress,
    securityGroups: [],
    tags: {}
  };
  instance.Tags.forEach(tag => {
    info.tags[tag.Key] = tag.Value;
  });
  instance.SecurityGroups.forEach(grp => {
    info.securityGroups.push(grp.GroupName);
  });
  return info;
}

function startStopHandler(ids, mode = 'start') {
  let methodName, responseKey, awaitStatus;
  switch(mode) {
    case 'stop':
      [methodName, responseKey, awaitStatus] = ['stopInstances', 'StoppingInstances', 'instanceStopped'];
      break;
    default:
      [methodName, responseKey, awaitStatus] = ['startInstances', 'StartingInstances', 'instanceRunning'];
  }
  return new Promise((resolve, reject) => {
    if (!ids || !ids.length) {
      reject(new Error('No IDs specified'));
    }
    if (typeof ids === 'string') {
      ids = [ids];
    }
    ec2[methodName]({InstanceIds: ids}, (err, data) => {
      if (err) return reject(err);
      let resp = {};
      data[responseKey].forEach(instance => {
        resp[instance.InstanceId] = instance.CurrentState.Name;
        ec2Service.emit('instanceStateChanged', {
          id: instance.InstanceId,
          state: instance.CurrentState.Name
        });
        ec2Service.requestNotification(awaitStatus, [instance.InstanceId]);
      });

      resolve(resp);
    });
  });
}

const methods = {
  listInstances(ids = []) {
    return new Promise((resolve, reject) => {
      let req = {};
      if (ids && ids.length) {
        req.InstanceIds = ids;
      } else if (FILTERS && FILTERS.length) {
        req.Filters = FILTERS;
      } else {
        req.MaxResults = 1000;
      }
      ec2.describeInstances(req, (err, data) => {
        if (err) return reject(err);
        // Massage the verbose data returned from EC2.
        let response = [];
        data.Reservations.forEach(reservation => {
          reservation.Instances.forEach(instance => {
            let struct = simplifyEc2Info(instance);
            response.push(struct);
          });
        });
        resolve(response);
      });
    });
  },

  // Returns a map if instance ID to new state.
  startInstances(ids) {
    return startStopHandler(ids, 'start');
  },

  stopInstances(ids) {
    return startStopHandler(ids, 'stop');
  },

  // type = instanceRunning || instanceStopped
  requestNotification(type, ids) {
    let req = {};
    if (ids && ids.length) {
      req.InstanceIds = ids;
    }
    switch(type) {
      case 'start':
      case 'instanceRunning':
        type = 'instanceRunning';
        break;
      case 'stop':
      case 'instanceStopped':
        type = 'instanceStopped';
        break;
      default:
        throw new Error('Invalid notification type; must be "start" or "stop"');
    }
    ec2.waitFor(type, req, (err, data) => {
      if (err) return console.log(err);
      data.Reservations.forEach(reservation => {
        reservation.Instances.forEach(instance => {
          ec2Service.emit('instanceStateChanged', simplifyEc2Info(instance));
        });
      });
    });
  }
};
const ec2Service = Object.assign(new EventEmitter(), methods);

export {ec2Service};
export default ec2Service;
