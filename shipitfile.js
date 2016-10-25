//TODO: https://gist.github.com/jbraithwaite/938d88e8f9bffdfce77e

module.exports = function (shipit) {
    require('shipit-deploy')(shipit);
    require('shipit-pm2')(shipit);

    const deployTo = '/home/ubuntu/wolfy-engine';
    const deployToCurrent = `${deployTo}/current`;

    shipit.initConfig({
        default: {
            workspace: '/Users/ricardocanastro/shipit-workspace/wolfy-engine',
            deployTo,
            repositoryUrl: 'https://github.com/canastro/wolfy-engine.git',
            ignores: ['.git', 'node_modules'],
            keepReleases: 5,
            deleteOnRollback: false,
            key: '/Users/ricardocanastro/aws/wolfy-key.pem',
            shallowClone: true
        },
        staging: {
            servers: 'ubuntu@ec2-52-31-60-109.eu-west-1.compute.amazonaws.com'
        }
    });

    // Listen to the on published event.
    shipit.on('published', function(){
        shipit.start('post-publish');
    });

    shipit.task('post-publish', ['clear-nodemodules', 'npm-install', 'pm2-save']);

    // npm install
    // ----------------------------------------------------------------
    shipit.blTask('clear-nodemodules', function(){
        return shipit.remote(`cd ${deployToCurrent} && rm -rf node_modules`);
    });

    shipit.blTask('npm-install', function(){
        return shipit.remote(`cd ${deployToCurrent} && npm install`);
    });

    // pm2 commands
    // ----------------------------------------------------------------
    shipit.task('pm2-save', function () {
        return shipit.remote('pm2 save');
    });

    // seed commands
    // ----------------------------------------------------------------
    shipit.task('seed-prices', function () {
        return shipit.remote(`cd ${deployToCurrent} && ./seed/index.js price -i 30 -p 20 -r`);
    });
};
