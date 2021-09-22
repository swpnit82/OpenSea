import { Material, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, Vector3 } from 'three'
import { CameraLayers } from '../../camera/constants/CameraLayers'
import { Engine } from '../../ecs/classes/Engine'
import { defineQuery, getComponent } from '../../ecs/functions/ComponentFunctions'
import { beforeMaterialCompile } from '../../scene/classes/BPCEMShader'
import { Object3DComponent } from '../components/Object3DComponent'
import { PersistTagComponent } from '../components/PersistTagComponent'
import { ShadowComponent } from '../components/ShadowComponent'
import { VisibleComponent } from '../components/VisibleComponent'
import { UpdatableComponent } from '../components/UpdatableComponent'
import { Updatable } from '../interfaces/Updatable'
import { World } from '../../ecs/classes/World'
import { System } from '../../ecs/classes/System'
import { generateMeshBVH } from '../functions/bvhWorkerPool'

/**
 * @author Josh Field <github.com/HexaField>
 */

// TODO: refactor this to be named something more generic like ObjectSystem, add object-object interactions (physics & non physics)
// GameManagerSystem already has physics interaction behaviors, these could be made generic and not game dependent

type BPCEMProps = {
  bakeScale: Vector3
  bakePositionOffset: Vector3
}

export class SceneOptions {
  static instance: SceneOptions
  bpcemOptions: BPCEMProps = {
    bakeScale: new Vector3(1, 1, 1),
    bakePositionOffset: new Vector3()
  }
  envMapIntensity = 1
  boxProjection = false
}

const sceneObjectQuery = defineQuery([Object3DComponent])
const persistQuery = defineQuery([Object3DComponent, PersistTagComponent])
const visibleQuery = defineQuery([Object3DComponent, VisibleComponent])
const updatableQuery = defineQuery([Object3DComponent, UpdatableComponent])

export default async function SceneObjectSystem(world: World): Promise<System> {
  SceneOptions.instance = new SceneOptions()

  return () => {
    for (const entity of sceneObjectQuery.enter()) {
      const object3DComponent = getComponent(entity, Object3DComponent)
      const shadowComponent = getComponent(entity, ShadowComponent)

      ;(object3DComponent.value as any).entity = entity

      // Add to scene
      if (!Engine.scene.children.includes(object3DComponent.value)) {
        Engine.scene.add(object3DComponent.value)
      } else {
        console.warn('[Object3DComponent]: Scene object has been added manually.', object3DComponent.value)
      }

      // Set default layer
      object3DComponent.value.layers.set(CameraLayers.Scene)

      // Apply material stuff
      object3DComponent.value.traverse((obj: Mesh) => {
        const material = obj.material as Material
        if (typeof material !== 'undefined') material.dithering = true

        if (shadowComponent) {
          obj.receiveShadow = shadowComponent.receiveShadow
          obj.castShadow = shadowComponent.castShadow
        }

        if (Engine.simpleMaterials) {
          // || Engine.isHMD) {
          if (obj.material instanceof MeshStandardMaterial) {
            const prevMaterial = obj.material
            obj.material = new MeshPhongMaterial()
            MeshBasicMaterial.prototype.copy.call(obj.material, prevMaterial)
          }
        } else {
          const material = obj.material as Material
          if (typeof material !== 'undefined') {
            // BPCEM
            if (SceneOptions.instance.boxProjection)
              material.onBeforeCompile = beforeMaterialCompile(
                SceneOptions.instance.bpcemOptions.bakeScale,
                SceneOptions.instance.bpcemOptions.bakePositionOffset
              )
            ;(material as any).envMapIntensity = SceneOptions.instance.envMapIntensity
            if (obj.receiveShadow) {
              Engine.csm?.setupMaterial(obj)
            }
          }
        }
      })

      // Generate BVH
      object3DComponent.value.traverse((obj: Mesh) => {
        if (!obj.isMesh) {
          return
        }
        generateMeshBVH(obj)
      })
    }

    for (const entity of sceneObjectQuery.exit()) {
      const object3DComponent = getComponent(entity, Object3DComponent, true)

      // Remove from scene
      if (object3DComponent && Engine.scene.children.includes(object3DComponent.value)) {
        Engine.scene.remove(object3DComponent.value)
      } else {
        console.warn('[Object3DComponent]: Scene object has been removed manually.')
      }
    }

    // Enable second camera layer for persistant entities for fun portal effects
    for (const entity of persistQuery.enter()) {
      const object3DComponent = getComponent(entity, Object3DComponent)
      object3DComponent?.value?.traverse((obj) => {
        obj.layers.enable(CameraLayers.Portal)
      })
    }

    for (const entity of visibleQuery.enter()) {
      const obj = getComponent(entity, Object3DComponent)
      const visibleComponent = getComponent(entity, VisibleComponent)
      obj.value.visible = visibleComponent.value
    }

    for (const entity of updatableQuery()) {
      const obj = getComponent(entity, Object3DComponent)
      ;(obj.value as unknown as Updatable).update(world.fixedDelta)
    }
  }
}
