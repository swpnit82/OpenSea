import addUUID from '../../hooks/add-uuid'
import addUploadPath from '../../hooks/add-upload-path'
import * as authentication from '@feathersjs/authentication'

import addUriToFile from '../../hooks/add-uri-to-file'
import reformatUploadResult from '../../hooks/reformat-upload-result'
import makeS3FilesPublic from '../../hooks/make-s3-files-public'
import uploadThumbnail from '../../hooks/upload-thumbnail'
import setLoggedInUser from '../../hooks/set-loggedin-user-in-body'
import createResource from '../../hooks/create-static-resource'
import * as commonHooks from 'feathers-hooks-common'

// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks

export default {
  before: {
    all: [],
    find: [commonHooks.disallow()],
    get: [],
    create: [
      commonHooks.iff(commonHooks.isProvider('external'), authenticate('jwt') as any, setLoggedInUser('userId') as any),
      addUUID(),
      addUploadPath(),
      addUriToFile(),
      makeS3FilesPublic()
    ],
    update: [commonHooks.disallow()],
    patch: [commonHooks.disallow()],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [reformatUploadResult(), createResource(), uploadThumbnail()],
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
