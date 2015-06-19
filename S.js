var spawner = require('ssh-spawner').createSpwaner({
  user: 'root',
  server: 'beta',
  envMode: 'cmd' // one of 'inline' 'cmd' or 'default'
});
spawner('ls', ['-al','/root'], {
  env: {
    FOO: 123
  },
  stdio: 'pipe'
})
