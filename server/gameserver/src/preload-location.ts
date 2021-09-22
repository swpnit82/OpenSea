import { WorldScene } from '@xrengine/engine/src/scene/functions/SceneLoading'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { Application } from '@xrengine/server-core/declarations'
import config from '@xrengine/server-core/src/appconfig'
import getLocalServerIp from '@xrengine/server-core/src/util/get-local-server-ip'

export default async function (locationName, app: Application) {
  await (app as any).isSetup
  let service, serviceId
  const locationResult = await app.service('location').find({
    query: {
      slugifiedName: locationName
    }
  })
  if (locationResult.total === 0) return
  const location = locationResult.data[0]
  const scene = await app.get('sequelizeClient').models.collection.findOne({
    query: {
      sid: location.sceneId
    }
  })
  if (scene == null) return
  const projectRegex = /\/([A-Za-z0-9]+)\/([a-f0-9-]+)$/
  const projectResult = await app.service('project').get(scene.sid)
  const projectUrl = projectResult.project_url
  const regexResult = projectUrl.match(projectRegex)
  if (regexResult) {
    service = regexResult[1]
    serviceId = regexResult[2]
  }
  const result = await app.service(service).get(serviceId)

  let entitiesLeft = -1
  let lastEntitiesLeft = -1
  const loadingInterval = setInterval(() => {
    if (entitiesLeft >= 0 && lastEntitiesLeft !== entitiesLeft) {
      lastEntitiesLeft = entitiesLeft
      console.log(entitiesLeft + ' entites left...')
    }
  }, 1000)

  await WorldScene.load(result, (left) => {
    entitiesLeft = left
  })

  clearInterval(loadingInterval)
  const agonesSDK = (app as any).agonesSDK
  const gsResult = await agonesSDK.getGameServer()
  const { status } = gsResult
  const localIp = await getLocalServerIp()
  const selfIpAddress = `${status.address as string}:${status.portsList[0].port as string}`
  const newInstance = {
    currentUsers: 0,
    sceneId: location.sid,
    ipAddress: config.gameserver.mode === 'local' ? `${localIp.ipAddress}:3031` : selfIpAddress,
    locationId: location.id
  } as any
  ;(app as any).isChannelInstance = false
  const instanceResult = await app.service('instance').create(newInstance)
  ;(app as any).instance = instanceResult

  if ((app as any).gsSubdomainNumber != null) {
    const gsSubProvision = await app.service('gameserver-subdomain-provision').find({
      query: {
        gs_number: (app as any).gsSubdomainNumber
      }
    })

    if (gsSubProvision.total > 0) {
      const provision = gsSubProvision.data[0]
      await app.service('gameserver-subdomain-provision').patch(provision.id, {
        instanceId: instanceResult.id
      })
    }
  }
  EngineEvents.instance.dispatchEvent({
    type: EngineEvents.EVENTS.ENABLE_SCENE,
    renderer: true,
    physics: true
  })
  console.log('Pre-loaded location', location.id)
}
