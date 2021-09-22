import { Id, NullableId, Params, ServiceMethods } from '@feathersjs/feathers'
import Paginated from '../../types/PageObject'
import { Application } from '../../../declarations'
import StorageProvider from '../../media/storageprovider/storageprovider'
import { assembleScene, getAxiosConfig, populateAvatar, populateScene, uploadAvatar } from './content-pack-helper'
import config from '../../appconfig'
import axios from 'axios'

interface Data {}

interface ServiceOptions {}
const storageProvider = new StorageProvider()
const packRegex = /content-pack\/([a-zA-Z0-9_-]+)\/manifest.json/
const thumbnailRegex = /([a-zA-Z0-9_-]+).jpeg/

const getManifestKey = (packName: string) => `content-pack/${packName}/manifest.json`
const getWorldFileKey = (packName: string, name: string) => `content-pack/${packName}/world/${name}.world`
const getWorldFileUrl = (packName: string, uuid: string) =>
  `https://${storageProvider.provider.cacheDomain}/content-pack/${packName}/world/${uuid}.world`
const getThumbnailKey = (packName: string, url: string) => {
  const uuidRegexExec = thumbnailRegex.exec(url)
  return `content-pack/${packName}/img/${uuidRegexExec[1]}.jpeg`
}
const getThumbnailUrl = (packName: string, url: string) => {
  const uuidRegexExec = thumbnailRegex.exec(url)
  return `https://${storageProvider.provider.cacheDomain}/content-pack/${packName}/img/${uuidRegexExec[1]}.jpeg`
}
const getAvatarUrl = (packName: string, avatar: any) =>
  `https://${storageProvider.provider.cacheDomain}/content-pack/${packName}/${avatar.key}`
const getAvatarThumbnailUrl = (packName: string, thumbnail: any) =>
  `https://${storageProvider.provider.cacheDomain}/content-pack/${packName}/${thumbnail.key}`

/**
 * A class for Upload Media service
 *
 * @author Vyacheslav Solovjov
 */
export class ContentPack implements ServiceMethods<Data> {
  app: Application
  options: ServiceOptions

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options
    this.app = app
  }

  async setup() {}

  async find(params?: Params): Promise<any[] | Paginated<any>> {
    const result = await new Promise((resolve, reject) => {
      storageProvider
        .listObjects('content-pack')
        .then((data) => {
          resolve(data)
        })
        .catch((err) => {
          console.error(err)
          reject(err)
        })
    })
    const manifests = (result as any).Contents.filter((result) => packRegex.exec(result.Key) != null)
    return Promise.all(
      manifests.map(async (manifest) => {
        const manifestResult = (await new Promise((resolve, reject) => {
          storageProvider
            .getObject(manifest.Key)
            .then((data) => {
              resolve(data)
            })
            .catch((err) => {
              console.error(err)
              reject(err)
            })
        })) as any
        return {
          name: packRegex.exec(manifest.Key)[1],
          url: `https://${storageProvider.provider.cacheDomain}/${manifest.Key}`,
          data: JSON.parse(manifestResult.Body.toString())
        }
      })
    )
  }

  async get(id: Id, params?: Params): Promise<Data> {
    return {}
  }

  async create(data: Data, params?: Params): Promise<Data> {
    if (Array.isArray(data)) {
      return await Promise.all(data.map((current) => this.create(current, params)))
    }

    let uploadPromises = []
    const { scenes, contentPack, avatars } = data as any
    await storageProvider.checkObjectExistence(getManifestKey(contentPack))
    const body = {
      version: 1,
      avatars: [],
      scenes: []
    }
    const promises = []
    if (scenes != null) {
      for (const scene of scenes) {
        promises.push(
          new Promise(async (resolve) => {
            const thumbnailFind = await this.app.service('static-resource').find({
              query: {
                sid: scene.sid
              }
            })

            const assembleResponse = assembleScene(scene, contentPack)
            const worldFile = assembleResponse.worldFile
            uploadPromises = assembleResponse.uploadPromises
            if (typeof worldFile.metadata === 'string') worldFile.metadata = JSON.parse(worldFile.metadata)
            const worldFileKey = getWorldFileKey(contentPack, worldFile.metadata.name)
            let thumbnailLink
            if (thumbnailFind.total > 0) {
              const thumbnail = thumbnailFind.data[0]
              const url = thumbnail.url
              const thumbnailDownload = await axios.get(url, getAxiosConfig())
              await storageProvider.putObject({
                ACL: 'public-read',
                Body: thumbnailDownload.data,
                ContentType: 'jpeg',
                Key: getThumbnailKey(contentPack, url)
              })
              thumbnailLink = getThumbnailUrl(contentPack, url)
            }
            await storageProvider.putObject({
              ACL: 'public-read',
              Body: Buffer.from(JSON.stringify(worldFile)),
              ContentType: 'application/json',
              Key: worldFileKey
            })
            const newScene = {
              sid: scene.sid,
              name: scene.name,
              worldFile: getWorldFileUrl(contentPack, worldFile.metadata.name)
            }
            if (thumbnailLink != null) (newScene as any).thumbnail = thumbnailLink
            body.scenes.push(newScene)
            resolve(true)
          })
        )
      }
    } else if (avatars != null) {
      for (const avatarItem of avatars) {
        promises.push(
          new Promise(async (resolve) => {
            const { avatar, thumbnail } = avatarItem
            await uploadAvatar(avatar, thumbnail, contentPack)
            const newAvatar = {
              name: avatar.name,
              avatar: getAvatarUrl(contentPack, avatar),
              thumbnail: getAvatarThumbnailUrl(contentPack, thumbnail)
            }
            body.avatars.push(newAvatar)
            resolve(true)
          })
        )
      }
    }

    await Promise.all(promises)
    await storageProvider.putObject({
      ACL: 'public-read',
      Body: Buffer.from(JSON.stringify(body)),
      ContentType: 'application/json',
      Key: getManifestKey(contentPack)
    })
    await Promise.all(uploadPromises)
    return data
  }

  async update(id: NullableId, data: Data, params?: Params): Promise<Data> {
    const manifestUrl = (data as any).manifestUrl
    const manifestResult = await axios.get(manifestUrl, getAxiosConfig('json'))
    const { avatars, scenes } = manifestResult.data
    const promises = []
    for (const index in scenes) {
      const scene = scenes[index]
      const sceneResult = await axios.get(scene.worldFile, getAxiosConfig('json'))
      promises.push(populateScene(scene.sid, sceneResult.data, manifestUrl, this.app, scene.thumbnail))
    }
    for (const index in avatars) promises.push(populateAvatar(avatars[index], this.app))
    await Promise.all(promises)
    return data
  }

  async patch(id: NullableId, data: Data, params?: Params): Promise<Data> {
    let uploadPromises = []
    const { scenes, contentPack, avatars } = data as any
    let pack = await storageProvider.getObject(getManifestKey(contentPack))
    const body = JSON.parse((pack as any).Body.toString())
    const invalidationItems = [`/content-pack/${contentPack}/manifest.json`]
    const promises = []
    if (scenes != null) {
      for (const scene of scenes) {
        promises.push(
          new Promise(async (resolve) => {
            const thumbnailFind = await this.app.service('static-resource').find({
              query: {
                sid: scene.sid
              }
            })

            const assembleResponse = assembleScene(scene, contentPack)
            const worldFile = assembleResponse.worldFile
            uploadPromises = assembleResponse.uploadPromises
            if (typeof worldFile.metadata === 'string') worldFile.metadata = JSON.parse(worldFile.metadata)
            const worldFileKey = getWorldFileKey(contentPack, worldFile.metadata.name)
            invalidationItems.push(`/${worldFileKey}`)
            let thumbnailLink
            if (thumbnailFind.total > 0) {
              const thumbnail = thumbnailFind.data[0]
              const url = thumbnail.url
              const thumbnailDownload = await axios.get(url, getAxiosConfig())
              const thumbnailKey = getThumbnailKey(contentPack, url)
              await storageProvider.putObject({
                ACL: 'public-read',
                Body: thumbnailDownload.data,
                ContentType: 'jpeg',
                Key: thumbnailKey
              })
              thumbnailLink = getThumbnailUrl(contentPack, url)
              invalidationItems.push(`/${thumbnailKey}`)
            }
            await storageProvider.putObject({
              ACL: 'public-read',
              Body: Buffer.from(JSON.stringify(worldFile)),
              ContentType: 'application/json',
              Key: worldFileKey
            })
            body.scenes = body.scenes.filter((existingScene) => existingScene.sid !== scene.sid)
            const newScene = {
              sid: scene.sid,
              name: scene.name,
              worldFile: getWorldFileUrl(contentPack, worldFile.metadata.name)
            }
            if (thumbnailLink != null) (newScene as any).thumbnail = thumbnailLink
            body.scenes.push(newScene)
            resolve(true)
          })
        )
      }
    } else if (avatars != null) {
      for (const avatarItem of avatars) {
        promises.push(
          new Promise(async (resolve) => {
            const { avatar, thumbnail } = avatarItem
            await uploadAvatar(avatar, thumbnail, contentPack)
            body.avatars = body.avatars.filter((existingAvatar) => existingAvatar.name !== avatar.name)
            const newAvatar = {
              name: avatar.name,
              avatar: getAvatarUrl(contentPack, avatar),
              thumbnail: getAvatarThumbnailUrl(contentPack, thumbnail)
            }
            invalidationItems.push(`/content-pack/${contentPack}/avatars/${avatar.name}.*`)
            body.avatars.push(newAvatar)
            resolve(true)
          })
        )
      }
    }

    await Promise.all(promises)
    if (body.version) body.version++
    else body.version = 1
    await storageProvider.putObject({
      ACL: 'public-read',
      Body: Buffer.from(JSON.stringify(body)),
      ContentType: 'application/json',
      Key: getManifestKey(contentPack)
    })
    await Promise.all(uploadPromises)
    if (config.server.storageProvider === 'aws') await storageProvider.createInvalidation(invalidationItems)
    return data
  }

  async remove(id: NullableId, params?: Params): Promise<Data> {
    return { id }
  }
}
