import config from '../../appconfig'

export function mapSceneData(scene: any, projectId: string): any {
  if (!scene) {
    return null
  }
  const selectedSceneData = {
    ...scene,
    sceneId: scene?.sid,
    project_id: projectId,
    url: `${config.server.hub.endpoint}/scene/${scene.slug as string}`,
    model_url: scene?.model_owned_file?.url,
    screenshot_url: scene?.screenshot_owned_file?.url
  }
  delete selectedSceneData.model_owned_file
  delete selectedSceneData.screenshot_owned_file
  delete selectedSceneData.scene_owned_file
  return selectedSceneData
}
export function defaultProjectImport(models: any): any[] {
  const includedEntities = [
    {
      model: models.static_resource,
      as: 'thumbnail_owned_file',
      attributes: ['url']
    }
  ]
  return includedEntities
}

export function readJSONFromBlobStore(storage, key): any {
  return new Promise((resolve, reject) => {
    const chunks = []
    storage
      .createReadStream({
        key
      })
      .on('data', (data: any) => {
        chunks.push(data.toString())
      })
      .on('end', () => {
        try {
          const json = JSON.parse(chunks.join(''))
          resolve(json)
        } catch (error) {
          console.log('Failed to parse JSON', error, chunks)
          reject()
        }
      })
      .on('error', reject)
  })
}

export function mapProjectDetailData(project: any): any {
  const _proj = {
    name: project.name,
    parent_scene: mapSceneData(project?.parent_scene_listing || project?.parent_scene, project.sid),
    project_id: project.sid,
    project_url: project?.url,
    scene: mapSceneData(project.scene, project.sid),
    thumbnailUrl: project?.thumbnail_owned_file?.url,
    ownedFileIds: project?.ownedFileIds
  }
  return _proj
}

export function mapProjectTemplateDetailData(projectTemplate: any): any {
  const selectedSceneData = {
    ...projectTemplate,
    sceneId: null,
    project_id: projectTemplate.sid,
    url: null,
    model_url: null,
    screenshot_url: projectTemplate?.thumbnail_file?.url
  }

  const _proj = {
    name: projectTemplate.name,
    parent_scene: null,
    project_id: projectTemplate.sid,
    project_url: null,
    scenes: [selectedSceneData],
    thumbnailUrl: projectTemplate?.thumbnail_file?.url
  }
  return _proj
}
