'ues strict';

module.exports = {
  write: true,
  prefix: '^',
  devprefix: '^',
  exclude: [
    'test/fixtures',
  ],
  devdep: [
    'mm',
    'autod',
    'egg-bin',
    'egg-ci',
    'eslint',
    'eslint-config-egg',
    'contributors',
  ],
  keep: [
    "protobufjs",
  ],
  semver: [],
};
