const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const SEP = '[/\\\\]';

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 프로젝트 안의 폴더 — 그 폴더 자체와 그 아래 전부
function projectDir(relativePath) {
  const parts = path
    .resolve(__dirname, relativePath)
    .split(/[/\\]/)
    .map(escapeRegExp);
  return new RegExp(`^${parts.join(SEP)}(${SEP}.*)?$`);
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * `amplify/` and the AWS SDK/CDK packages under node_modules are
 * backend-build-time-only (never imported by the RN app bundle), but they
 * are huge (tens of thousands of files) and Metro's file crawler was
 * walking all of them on every start, causing multi-minute bundling and
 * JS heap OOM crashes. Excluding them keeps the watcher scoped to what the
 * app actually bundles. The Android build outputs (several GB after a
 * native build) are excluded for the same reason.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);
const {assetExts, sourceExts} = defaultConfig.resolver;

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    blockList: [
      projectDir('amplify'),
      projectDir('android/app/build'),
      projectDir('android/app/.cxx'),
      projectDir('android/build'),
      projectDir('android/.gradle'),
      /[/\\]node_modules[/\\]@aws-sdk[/\\].*/,
      /[/\\]node_modules[/\\]aws-cdk-lib[/\\].*/,
      /[/\\]node_modules[/\\]@aws-cdk[/\\].*/,
      /[/\\]node_modules[/\\]aws-cdk[/\\].*/,
      /[/\\]node_modules[/\\]@aws-amplify[/\\]backend.*/,
      // metro 기본값(exclusionList)에 있던 테스트 폴더 제외
      /[/\\]__tests__[/\\].*/,
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
