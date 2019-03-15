const Iot = require("@chrisns/iot-shorthand")
const iot = new Iot()
const connect = require('@williamshupe/owlet').connect

const { OWLET_USERNAME, OWLET_PASSWORD } = process.env

async function run() {
  const owlet = await connect(OWLET_USERNAME, OWLET_PASSWORD);

  const devices = await owlet.getDevices()
  devices.forEach(device =>
    iot.discovered({
      name: `owlet_${device.id}`,
      type: "owlet",
      attributes: {
        product: device.product.replace(/ /g, "_"),
        model: device.model,
        type: device.type
      }
    })
  )

  devices.forEach(device => {
    setInterval(() =>
      owlet.getProperties(device.id)
        .then(props => {
          if (props.isCharging || !props.isSockConnected) {
            props.oxygenLevel = null
            props.heartRate = null
          }
          iot.report(`owlet_${device.id}`, props)
        })
      , 30 * 1000)
  })
  // console.log(devices[0])
  // owlet.getProperties(deviceId)
  // .then(response => console.log(deviceId, response))
  // await owlet.turnBaseStationOn(deviceId);
  // await owlet.turnBaseStationOff(deviceId);
};
run()