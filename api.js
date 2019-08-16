const bodyParser = require('body-parser');
const path = require('path')
const fs = require('fs')
const mqtt = require('mqtt')
const InterfaceUtils = require('ttbd-interface-utils')
const interface_utils = new InterfaceUtils()

const name = 'gibson'
var settingsPath = null

var stats = {
  initialized: false,
  status: 'nok',
  validateAction: 'none',
  users: []
}

function init(app, apiToExpose, persistenceDir) {
    settingsPath = path.join(persistenceDir, name)
    try {
        fs.mkdirSync(settingsPath, { recursive: true })
    } catch(e){}
    settingsPath = path.join(settingsPath, 'settings.json')
    syncStats()

    app.use(apiToExpose, bodyParser.json());
    app.get(apiToExpose, function(req, res){
        syncStats()
        res.json(stats)
    });

    app.post(apiToExpose, function(req, res){
        res.json({message: "Ok"})
    });

    app.post(`${apiToExpose}/sync`, function(req, res){
        let tsaID = req.body.id
        let tsaName =  req.body.name
        let userOrGroupName = req.body.userOrGroupName
        let pairingDate = new Date().toISOString()
        let pairingMsg = {
            tsaID: tsaID,
            tsaName: tsaName,
            userOrGroupName: userOrGroupName,
            pairingDate: pairingDate
        }

        try {
            let client  = mqtt.connect('mqtt://mosquitto:1883')
            let interval = null;

            client.subscribe(`TSA/pairing/${tsaID}`, function (err) {
                if (err) {
                    console.error(err)
                }

                client.on('message', function (topic, message) {
                    clearInterval(interval)
                    stats.users.push(userOrGroupName)
                    syncStats(true)
                    res.json({message: "Ok"})
                    client.end()
                })

                interval = setInterval(function() {
                    client.publish(`TSA/pairing`, JSON.stringify(pairingMsg))
                }, 5000)
            })
        } catch(e) {
            console.error(e)
        }
    });
}

function syncStats(update){
  if(!settingsPath){
    return
  }
  var statsFromFile
  try {
    statsFromFile = JSON.parse(fs.readFileSync(settingsPath))
    if(update === true){
      stats = Object.assign({}, statsFromFile, stats)
    } else {
      stats = Object.assign({}, stats, statsFromFile)
    }
  } catch(e){
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(stats, null, 4), { encoding: 'utf8'})
    } catch(e){}
  }
  if(stats.initialized === false || update === true){
    stats.initialized = true
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(stats, null, 4), { encoding: 'utf8'})
    } catch(e){}
  }
}

function getStats(){
  return stats
}

module.exports = {
  init: init,
  getStats: getStats,
  syncStats: syncStats,
  order: 25,
  canIgnore: true
}
