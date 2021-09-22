import * as authentication from '@feathersjs/authentication'
import attachOwnerIdInQuery from '../../hooks/set-loggedin-user-in-query'
import * as commonHooks from 'feathers-hooks-common'

const { authenticate } = authentication.hooks

export default {
  before: {
    all: [authenticate('jwt')],
    find: [commonHooks.iff(commonHooks.isProvider('external'), attachOwnerIdInQuery('userId') as any)],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
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
