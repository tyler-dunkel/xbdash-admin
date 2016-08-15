module.exports = {
  servers: {
    one: {
      host: '104.131.31.64',
      username: 'root',
      // pem:
      password:"xbdAdmComp!071516"
      // or leave blank for authenticate from ssh-agent
    }
  },

  meteor: {
    name: 'xbdashadmin',
    path: '/Users/DP/Development/xboxdash_admin',
    servers: {
      one: {}
    },
    buildOptions: {
      serverOnly: true,
    },
    env: {
      ROOT_URL: 'http://localhost',
      MONGO_URL: 'mongodb://localhost/meteor'
    },

    dockerImage: 'abernix/meteord:base',
    deployCheckWaitTime: 60
  },

  mongo: {
    oplog: true,
    port: 27017,
    servers: {
      one: {},
    },
  },
};
