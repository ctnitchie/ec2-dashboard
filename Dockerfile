FROM node:6-slim

ADD . /ec2dashboard
RUN cd /ec2dashboard && \
    npm install && \
    npm run prepublish && \
    npm prune --production

EXPOSE 3000

# Map the .awsrc file in via volume
ENV AWS_CONFIG=/.awsrc

# Map a filter file to this location via volume
ENV AWS_EC2_FILTERS=/ec2dashboard/filters.json

WORKDIR /ec2dashboard
CMD ["/usr/local/bin/npm", "run", "serve"]
