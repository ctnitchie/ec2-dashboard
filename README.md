A simple AWS EC2 dashboard for reviewing, starting, and stopping instances.

To install

1. Clone this repository.

        git clone https://github.com/ctnitchie/ec2-dashboard

2. Install dependencies and build the application.

        npm install

3. Create or find your AWS [access keys](http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSGettingStartedGuide/AWSCredentials.html).
4. Update `.awsrc` with your access key information.

        {
          "region": "us-east-2",
          "accessKeyId": "changeme",
          "secretAccessKey": "changeme"
        }

5. Launch the application with `npm run serve`.
6. Navigate to http://localhost:3000 to manage your instances.

If you want to run with a different `.awsrc` file, set the `AWS_CONFIG`
environment variable to the file location.

To run in sandbox mode, copy `.awsrc` to `.awsrc-dev` and run `npm start`. This
will watch for changes in the code and recompile on-the-fly. The `.awsrc-dev`
file is ignored by git.

To apply filters to the visible instances, set the `AWS_EC2_FILTERS` environment
variable to a file containing a JSON array of filters, as described in the
`Filters` option on the AWS (describeInstances)[http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeInstances-property]
method.
