import { HookContext } from '@feathersjs/feathers'
import { hooks } from '@feathersjs/authentication'
import dauria from 'dauria'
import removeOwnedFile from '../../hooks/remove-owned-file'
import replaceThumbnailLink from '../../hooks/replace-thumbnail-link'
import attachOwnerIdInQuery from '../../hooks/set-loggedin-user-in-query'
import collectAnalytics from '../../hooks/collect-analytics'

const { authenticate } = hooks

export default {
  before: {
    all: [],
    find: [collectAnalytics()],
    get: [],
    create: [
      authenticate('jwt'),
      (context: HookContext): HookContext => {
        if (!context.data.uri && context.params.file) {
          const file = context.params.file
          const uri = dauria.getBase64DataURI(file.buffer, file.mimetype)
          console.log('uri is', uri)
          const url = dauria.getBase64DataURI(file.buffer, file.mimetype)
          const mimeType = context.data.mimeType ?? file.mimetype
          console.log('mimeType is', file.mimetype)
          const name = context.data.name ?? file.name
          context.data = { uri: uri, mimeType: mimeType, name: name }
        }
        return context
      }
    ],
    update: [authenticate('jwt')],
    patch: [authenticate('jwt'), replaceThumbnailLink()],
    remove: [authenticate('jwt'), attachOwnerIdInQuery('userId'), removeOwnedFile()]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
} as any
