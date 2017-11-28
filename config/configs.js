
function configDb (configExtra) {

  const config = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    hostname: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    loggin: s => debug(s)
  }
  
  function extend (obj, values) {
    const clone = Object.assign({}, obj)
    return Object.assign(clone, values)
  }

  if (configExtra) {
    return extend(config, configExtra)
  }

  return config
}


module.exports = {
  configDb
}