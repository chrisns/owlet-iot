const Iot = require("@chrisns/iot-shorthand")
const iot = new Iot()
const connect = require('@williamshupe/owlet').connect

const { OWLET_USERNAME, OWLET_PASSWORD, INTERVAL = 30 } = process.env;

(async () => {
  const owlet = await connect(OWLET_USERNAME, OWLET_PASSWORD)

  const devices = await owlet.getDevices()

  const event_handler = device_id => payload => {
    if (payload.isBaseStationOn === true)
      owlet.turnBaseStationOn(device_id)
    else if (payload.isBaseStationOn === false)
      owlet.turnBaseStationOff(device_id)
  }

  await devices.forEach(async device =>
    iot.discovered({
      name: `owlet_${device.id}`,
      type: "owlet",
      attributes: {
        product: device.product.replace(/ /g, "_"),
        model: device.model,
        type: device.type
      }
    }, event_handler(device.id))
  )

  devices.forEach(device =>
    setInterval(() =>
      owlet.getProperties(device.id)
        .then(props => {
          if (props.isCharging || !props.isSockConnected) {
            props.oxygenLevel = null
            props.heartRate = null
          }
          return iot.report(`owlet_${device.id}`, props)
        }),
      INTERVAL * 1000)
  )
})()