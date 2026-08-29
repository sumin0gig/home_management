const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const projectAmplifyDir = path.resolve(__dirname, 'amplify').replace(/\\/g, '/');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * `amplify/` and the AWS SDK/CDK packages under node_modules are
 * backend-build-time-only (never imported by the RN app bundle), but they
 * are huge (tens of thousands of files) and Metro's file crawler was
 * walking all of them on every start, causing multi-minute bundling and
 * JS heap OOM crashes. Excluding them keeps the watcher scoped to what the
 * app actually bundles.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: exclusionList([
      new RegExp(`^${projectAmplifyDir}/.*`),
      /node_modules\/@aws-sdk\/.*/,
      /node_modules\/aws-cdk-lib\/.*/,
      /node_modules\/@aws-cdk\/.*/,
      /node_modules\/aws-cdk\/.*/,
      /node_modules\/@aws-amplify\/backend.*/,
    ]),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
