import { Vector3, Vector2 } from 'three'
import { AnimationGraph } from '../../avatar/animations/AnimationGraph'
import { AvatarAnimations, AvatarStates } from '../../avatar/animations/Util'
import { AvatarAnimationComponent } from '../../avatar/components/AvatarAnimationComponent'
import { getComponent, hasComponent, addComponent } from '../../ecs/functions/ComponentFunctions'
import { LocalInputTagComponent } from '../../input/components/LocalInputTagComponent'
import { AutoPilotClickRequestComponent } from '../../navigation/component/AutoPilotClickRequestComponent'
import { AutoPilotComponent } from '../../navigation/component/AutoPilotComponent'
import { removeFollowComponent, createFollowComponent } from '../../navigation/component/FollowComponent'
import { stopAutopilot } from '../../navigation/functions/stopAutopilot'
import {
  subscribeToChatSystem,
  unsubscribeFromChatSystem,
  getSubscribedChatSystems,
  removeMessageSystem
} from '../../networking/utils/chatSystem'
import { getPlayerEntity, getPlayers } from '../../networking/utils/getUser'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { isNumber } from '../../../../common/src/utils/miscUtils'
import { AutoPilotOverrideComponent } from '../../navigation/component/AutoPilotOverrideComponent'
import { isBot } from './isBot'
import { Engine } from '../../ecs/classes/Engine'

//The values the commands that must have in the start
export const commandStarters = ['/', '//']

//Checks if a text (string) is a command
export function isCommand(text: string): boolean {
  for (let i = 0; i < commandStarters.length; i++) {
    if (text.startsWith(commandStarters[i])) return true
  }

  return false
}
//Get the count of the command init value
export function getStarterCount(text: string): number {
  for (let i = 0; i < commandStarters.length; i++) {
    if (text.startsWith(commandStarters[i])) return commandStarters[i].length
  }

  return 0
}

/**
 * Handles a command, the input is sent both from server and client, each one can handle it differently
 * The return value is boolean (true/false), if it returns true the caller function will terminate, otherwise it will continue
 * First it is called in the server and then in the client
 * The eid in the server is the UserId, while in the client is the EntityId
 * @author Alex Titonis
 */
export function handleCommand(cmd: string, eid: any, isServer: boolean, userId: any): boolean {
  //It checks for all messages, the default
  if (!isCommand(cmd)) return false

  //Remove the command starter, get the data (the base which is the command and the parameters if exist, parameters are separated by , (commas))
  cmd = cmd.substring(getStarterCount(cmd))
  let data = cmd.split(' ')
  let base = data[0]
  let params = data.length == 2 ? data[1].split(',') : ''

  //Handle the command according to the base
  switch (base) {
    case 'move': {
      if (params.length < 3) {
        console.log('invalid move command - params length (' + params.length + ') ' + params)
        return true
      }

      const x = parseFloat(params[0])
      const y = parseFloat(params[1])
      const z = parseFloat(params[2])

      if (x === undefined || y === undefined || z === undefined) {
        console.log('invalid move command - params: ' + params)
        return true
      }

      if (!isServer) {
        handleMoveCommand(x, y, z, eid)
      }

      if (!isServer) return true
      else return false
    }
    case 'metadata': {
      //This command is handled only in the client and only if the caller is a bot
      if (isServer) return false
      //if (!Engine.isBot && !isBot(window)) return true

      //The params must either be 1 or 2, if it is scene, then 1 other wise 2 - world, max distance
      if (params.length > 0) {
        if (params[0] === 'world' && params.length != 2) {
          console.log('invalid params, available params, scene or world,distance (float)')
          return true
        }
      } else return true

      handleMetadataCommand(params, eid)

      return true
    }
    case 'goTo': {
      if (isServer) return false
      //if(!Engine.isBot && !isBot(window)) return true

      if (params.length != 1) {
        console.log('invalid params, it should be /goTo landmark')
        return true
      }

      handleGoToCommand(params[0], eid)

      return true
    }
    case 'emote': {
      if (isServer) return false

      if (params.length !== 1) {
        console.log('invalid params, it should be /emote emote_name')
        return true
      }

      handleEmoteCommand(params[0], eid)

      return true
    }
    case 'subscribe': {
      if (isServer) return false

      if (params.length !== 1) {
        console.log('invalid params, it should be /subscribe chat_system (emotions_system, all)')
        return true
      }

      handleSubscribeToChatSystemCommand(params[0], userId)

      return true
    }
    case 'unsubscribe': {
      if (isServer) return false

      if (params.length !== 1) {
        console.log('invalid params, it should be /unsubscribe chat_system (emotions_system all)')
        return true
      }

      handleUnsubscribeFromChatSystemCommand(params[0], userId)

      return true
    }
    case 'getSubscribed': {
      if (isServer) return false

      handleGetSubscribedChatSystemsCommand(userId)

      return true
    }
    case 'face': {
      if (isServer) return false

      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleFaceCommand(params[0], eid)

      return true
    }
    case 'getPosition': {
      if (isServer) return false

      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleGetPositionCommand(params[0])

      return true
    }
    case 'getRotation': {
      if (isServer) return false

      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleGetRotationCommand(params[0])

      return true
    }
    case 'getScale': {
      if (isServer) return false

      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleGetScaleCommand(params[0])

      return true
    }
    case 'getTransform': {
      if (isServer) return false

      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleGetTransformCommand(params[0])

      return true
    }
    case 'follow': {
      if (isServer) return false

      if (params.length !== 1) {
        console.log('invalid params')
        return true
      }

      handleFollowCommand(params[0], eid)

      return true
    }
    case 'getChatHistory': {
      if (isServer) return false

      handleGetChatHistoryCommand()

      return true
    }
    case 'listAllusers': {
      if (isServer) return false

      handleListAllUsersCommand(userId)

      return true
    }
    default: {
      console.log('unknown command: ' + base + ' params: ' + (params === '' ? 'none' : params))
      if (!isServer) return true
      else return false
    }
  }
}

//Create fake input on the map (like left click) with the coordinates written and implement the auto pilot click request component to the player
function handleMoveCommand(x: number, y: number, z: number, eid: any) {
  goTo(new Vector3(x, y, z), eid)
  /*let linput = getComponent(eid, LocalInputTagComponent)
  if (linput === undefined) linput = addComponent(eid, LocalInputTagComponent, {})
  addComponent(eid, AutoPilotClickRequestComponent, { coords: new Vector2(x, z) })*/
}

function handleMetadataCommand(params: any, eid: any) {
  if (params[0] === 'scene') {
    console.log('scene_metadata|' + Engine.defaultWorld.sceneMetadata)
  } else {
    const position = getComponent(eid, TransformComponent).position
    const maxDistance: number = parseFloat(params[1])
    let vector: Vector3
    let distance: number = 0

    for (let i in Engine.defaultWorld.worldMetadata) {
      vector = getMetadataPosition(Engine.defaultWorld.worldMetadata[i])

      distance = position.distanceTo(vector)
      if (distance > maxDistance) continue
      else console.log('metadata|' + vector.x + ',' + vector.y + ',' + vector.z + '|' + i)
    }
  }
}

function handleGoToCommand(landmark: string, eid: any) {
  const position = getComponent(eid, TransformComponent).position
  let nearest: Vector3 = undefined
  let distance: number = Number.MAX_SAFE_INTEGER
  let cDistance: number = 0
  let vector: Vector3

  for (let i in Engine.defaultWorld.worldMetadata) {
    if (i === landmark) {
      vector = getMetadataPosition(Engine.defaultWorld.worldMetadata[i])
      cDistance = position.distanceTo(vector)

      if (cDistance < distance) {
        distance = cDistance
        nearest = vector
      }
    }
  }

  console.log('goTo: ' + landmark + ' nearest: ' + JSON.stringify(nearest))
  if (nearest !== undefined) {
    goTo(nearest, eid)
  }
}

function handleEmoteCommand(emote: string, eid: any) {
  switch (emote) {
    case 'dance1':
      runAnimation(eid, AvatarStates.LOOPABLE_EMOTE, { animationName: AvatarAnimations.DANCING_1 })
      break
    case 'dance2':
      runAnimation(eid, AvatarStates.LOOPABLE_EMOTE, { animationName: AvatarAnimations.DANCING_2 })
      break
    case 'dance3':
      runAnimation(eid, AvatarStates.LOOPABLE_EMOTE, { animationName: AvatarAnimations.DANCING_3 })
      break
    case 'dance4':
      runAnimation(eid, AvatarStates.LOOPABLE_EMOTE, { animationName: AvatarAnimations.DANCING_4 })
      break
    case 'clap':
      runAnimation(eid, AvatarStates.EMOTE, { animationName: AvatarAnimations.CLAP })
      break
    case 'cry':
      runAnimation(eid, AvatarStates.EMOTE, { animationName: AvatarAnimations.CRY })
      break
    case 'laugh':
      runAnimation(eid, AvatarStates.EMOTE, { animationName: AvatarAnimations.LAUGH })
      break
    case 'sad':
      runAnimation(eid, AvatarStates.EMOTE, { animationName: AvatarAnimations.CRY })
      break
    case 'kiss':
      runAnimation(eid, AvatarStates.EMOTE, { animationName: AvatarAnimations.KISS })
      break
    case 'wave':
      runAnimation(eid, AvatarStates.EMOTE, { animationName: AvatarAnimations.WAVE })
      break
    default:
      console.log(
        'emote: ' + emote + ' not found, available: dance1, dance2, dance3, dance4, clap, cry, laugh, sad, kiss, wave'
      )
  }
}
function handleSubscribeToChatSystemCommand(system: string, userId: any) {
  subscribeToChatSystem(userId, system)
}
function handleUnsubscribeFromChatSystemCommand(system: string, userId: any) {
  unsubscribeFromChatSystem(userId, system)
}
async function handleGetSubscribedChatSystemsCommand(userId: any) {
  const systems: string[] = getSubscribedChatSystems(userId)
  console.log(systems)
}

function handleFaceCommand(face: string, eid: any) {
  if (face === undefined || face === '') return

  const faces = face.split(' ')
  if (faces.length == 0) return
  let time: number = 0
  if (faces.length > 1) {
    if (isNumber(faces[faces.length - 1])) {
      time = parseFloat(faces[faces.length - 1])
      faces.splice(faces.length - 1, 1)
    }
  }

  const _faces = []
  for (let i = 0; i < faces.length; i += 2) {
    const faceData = faces[i]
    const facePerc = faces[i + 1]
    _faces[faceData] = facePerc
  }

  //handle face
}

function handleGetPositionCommand(player: string) {
  if (player === undefined || player === '') return

  const eid: number = getPlayerEntity(player)
  if (eid === undefined) {
    console.log('undefiend eid')
    return
  }

  const transform = getComponent(eid, TransformComponent)
  if (transform === undefined) {
    console.log('undefined')
    return
  }

  console.log(player + ' position: ' + JSON.stringify(transform.position))
}

function handleGetRotationCommand(player: string) {
  if (player === undefined || player === '') return

  const eid = getPlayerEntity(player)
  if (eid === undefined) return

  const transform = getComponent(eid, TransformComponent)
  if (transform === undefined) return

  console.log(player + ' rotation: ' + JSON.stringify(transform.rotation))
}

function handleGetScaleCommand(player: string) {
  if (player === undefined || player === '') return

  const eid = getPlayerEntity(player)
  if (eid === undefined) return

  const transform = getComponent(eid, TransformComponent)
  if (transform === undefined) return

  console.log(player + ' scale: ' + JSON.stringify(transform.scale))
}

function handleGetTransformCommand(player: string) {
  if (player === undefined || player === '') return

  const eid = getPlayerEntity(player)
  if (eid === undefined) return

  const transform = getComponent(eid, TransformComponent)
  if (transform === undefined) return

  console.log(player + ' transform: ' + JSON.stringify(transform))
}
function handleFollowCommand(param: string, eid: number) {
  if (param === 'stop') {
    removeFollowComponent(eid)
  } else {
    const targetEid = getPlayerEntity(param)
    console.log('follow target eid: ' + targetEid)
    if (targetEid === undefined || eid === targetEid) return
    createFollowComponent(eid, targetEid)
  }
}

function handleGetChatHistoryCommand() {
  const chatState = globalThis.store.getState().get('chat')
  const channelState = chatState.get('channels')
  const channels = channelState.get('channels')
  const activeChannelMatch = [...channels].find(([, channel]) => channel.channelType === 'instance')
  if (activeChannelMatch && activeChannelMatch.length > 0) {
    const activeChannel = activeChannelMatch[1]
    if (activeChannel === undefined) return
    const messages = activeChannel.messages
    if (messages === undefined) return

    for (let i = 0; i < messages.length; i++) messages[i].text = removeMessageSystem(messages[i].text)

    console.log('messages|' + JSON.stringify(messages))
  } else {
    console.warn("Couldn't get chat state")
  }
}

function handleListAllUsersCommand(userId) {
  console.log('listallusers, local id: ' + userId)
  if (userId === undefined) return

  const players: string[] = getPlayers(userId, true)
  if (players === undefined) return

  console.log('players|' + players)
}

function runAnimation(eid: any, emote: string, emoteParams: any) {
  const aac = getComponent(eid, AvatarAnimationComponent)

  if (!aac.animationGraph.validateTransition(aac.currentState, aac.animationGraph.states[emote])) {
    console.warn('immediate transition to [%s] is not available from current state [%s]', emote, aac.currentState.name)
  }

  if (!hasComponent(eid, AutoPilotComponent)) AnimationGraph.forceUpdateAnimationState(eid, emote, emoteParams)
  else {
    stopAutopilot(eid)
    let interval = setInterval(() => {
      if (aac.animationGraph.validateTransition(aac.currentState, aac.animationGraph.states[emote])) {
        clearInterval(interval)
        AnimationGraph.forceUpdateAnimationState(eid, emote, emoteParams)
      }
    }, 50)
  }
}

function getMetadataPosition(_pos: string): Vector3 {
  if (_pos === undefined || _pos === '') return new Vector3(0, 0, 0)

  const _data = _pos.split(',')
  if (_data.length != 3) return new Vector3(0, 0, 0)

  const x = parseFloat(_data[0])
  const y = parseFloat(_data[1])
  const z = parseFloat(_data[2])

  return new Vector3(x, y, z)
}

export function goTo(pos: Vector3, eid: number) {
  //console.log('goto: ' + JSON.stringify(pos))
  let linput = getComponent(eid, LocalInputTagComponent)
  if (linput === undefined) linput = addComponent(eid, LocalInputTagComponent, {})
  addComponent(eid, AutoPilotOverrideComponent, {
    overrideCoords: true,
    overridePosition: pos
  })
  addComponent(eid, AutoPilotClickRequestComponent, {
    coords: new Vector2(0, 0)
  })
}
