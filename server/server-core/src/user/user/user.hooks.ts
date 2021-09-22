import * as authentication from '@feathersjs/authentication'
import addAssociations from '../../hooks/add-associations'
import { HookContext } from '@feathersjs/feathers'
import logger from '../../logger'
import getFreeInviteCode from '../../util/get-free-invite-code'
import addScopeToUser from '../../hooks/add-scope-to-user'

const { authenticate } = authentication.hooks

/**
 * This module used to declare and identify database relation
 * which will be used later in user service
 */

export default {
  before: {
    all: [authenticate('jwt')],
    find: [
      addAssociations({
        models: [
          {
            model: 'identity-provider'
          },
          // {
          //   model: 'subscription'
          // },
          {
            model: 'location-admin'
          },
          {
            model: 'location-ban'
          },
          {
            model: 'user-settings'
          },
          {
            model: 'instance'
          },
          {
            model: 'scope'
          }
        ]
      })
    ],
    get: [
      addAssociations({
        models: [
          {
            model: 'identity-provider'
          },
          // {
          //   model: 'subscription'
          // },
          {
            model: 'location-admin'
          },
          {
            model: 'location-ban'
          },
          {
            model: 'user-settings'
          },
          {
            model: 'scope'
          }
        ]
      })
    ],
    create: [],
    update: [],
    patch: [
      addAssociations({
        models: [
          {
            model: 'identity-provider'
          },
          // {
          //   model: 'subscription'
          // },
          {
            model: 'location-admin'
          },
          {
            model: 'location-ban'
          },
          {
            model: 'user-settings'
          },
          {
            model: 'scope'
          }
        ]
      }),
      addScopeToUser()
    ],
    remove: []
  },

  after: {
    all: [],
    find: [
      // async (context: HookContext): Promise<HookContext> => {
      //   try {
      //     const { app, result } = context
      //
      //     result.data.forEach(async (item) => {
      //       if (item.subscriptions && item.subscriptions.length > 0) {
      //         await Promise.all(
      //           item.subscriptions.map(async (subscription: any) => {
      //             subscription.dataValues.subscriptionType = await context.app
      //               .service('subscription-type')
      //               .get(subscription.plan)
      //           })
      //         )
      //       }
      //
      //       // const userAvatarResult = await app.service('static-resource').find({
      //       //   query: {
      //       //     staticResourceType: 'user-thumbnail',
      //       //     userId: item.id
      //       //   }
      //       // });
      //       //
      //       // if (userAvatarResult.total > 0 && item.dataValues) {
      //       //   item.dataValues.avatarUrl = userAvatarResult.data[0].url;
      //       // }
      //     })
      //     return context
      //   } catch (err) {
      //     logger.error('USER AFTER FIND ERROR')
      //     logger.error(err)
      //   }
      // }
    ],
    get: [
      // async (context: HookContext): Promise<HookContext> => {
      //   try {
      //     if (context.result.subscriptions && context.result.subscriptions.length > 0) {
      //       await Promise.all(
      //         context.result.subscriptions.map(async (subscription: any) => {
      //           subscription.dataValues.subscriptionType = await context.app
      //             .service('subscription-type')
      //             .get(subscription.plan)
      //         })
      //       )
      //     }
      //
      //     // const { id, app, result } = context;
      //     //
      //     // const userAvatarResult = await app.service('static-resource').find({
      //     //   query: {
      //     //     staticResourceType: 'user-thumbnail',
      //     //     userId: id
      //     //   }
      //     // });
      //     // if (userAvatarResult.total > 0) {
      //     //   result.dataValues.avatarUrl = userAvatarResult.data[0].url;
      //     // }
      //
      //     return context
      //   } catch (err) {
      //     logger.error('USER AFTER GET ERROR')
      //     logger.error(err)
      //   }
      // }
    ],
    create: [
      async (context: HookContext): Promise<HookContext> => {
        try {
          await context.app.service('user-settings').create({
            userId: context.result.id
          })

          context.arguments[0]?.scopeType?.forEach((el) => {
            context.app.service('scope').create({
              type: el.type,
              userId: context.result.id
            })
          })

          const app = context.app
          let result = context.result
          if (Array.isArray(result)) result = result[0]
          if (result?.userRole !== 'guest' && result?.inviteCode == null) {
            const code = await getFreeInviteCode(app)

            await app.service('user').patch(result.id, {
              inviteCode: code
            })
          }
          return context
        } catch (err) {
          logger.error('USER AFTER CREATE ERROR')
          logger.error(err)
        }
      }
    ],
    update: [],
    patch: [
      async (context: HookContext): Promise<HookContext> => {
        try {
          const app = context.app
          let result = context.result
          if (Array.isArray(result)) result = result[0]
          if (result && result.userRole !== 'guest' && result.inviteCode == null) {
            const code = await getFreeInviteCode(app)
            await app.service('user').patch(result.id, {
              inviteCode: code
            })
          }
        } catch (err) {
          logger.error('USER AFTER PATCH ERROR')
          logger.error(err)
        }
        return context
      }
    ],
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
