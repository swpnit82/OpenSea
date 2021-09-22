import { Engine } from '../../ecs/classes/Engine'
import { System } from '../../ecs/classes/System'
import { World } from '../../ecs/classes/World'
import { sendXRInputData } from '../functions/xrBotHookFunctions'

export default async function BotHookSystem(world: World): Promise<System> {
  return () => {
    if (Engine.isBot && Boolean(Engine.xrSession)) {
      sendXRInputData()
    }
  }
}
