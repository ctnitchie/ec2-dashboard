FROM node:6-slim

ADD . /ec2dashboard
RUN cd /ec2dashboard && \
    npm install && \
    npm run prepublish && \
    npm prune --production

EXPOSE 3000
# Map the .awsrc file in via volume
ENV AWS_CONFIG=/.awsrc
WORKDIR /ec2dashboard
CMD ["/usr/local/bin/npm", "run", "serve"]
