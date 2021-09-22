import config from './appconfig'
import seeder from './util/seeder'
import { Sequelize } from 'sequelize'
import { setTimeout } from 'timers'
import { Application } from '../declarations'
import seederConfig from './seeder-config'

const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_.~#?&//=]*)$/

export default (app: Application): void => {
  try {
    const { performDryRun } = config.server
    let { forceRefresh } = config.db

    console.log('Starting app')

    const sequelize = new Sequelize({
      ...config.db,
      logging: forceRefresh ? console.log : false,
      define: {
        freezeTableName: true
      }
    })
    const oldSetup = app.setup

    app.set('sequelizeClient', sequelize)

    // eslint-disable-next-line  @typescript-eslint/ban-ts-comment
    // @ts-ignore
    app.setup = function (...args: any): Application {
      let promiseResolve, promiseReject
      ;(app as any).isSetup = new Promise((resolve, reject) => {
        promiseResolve = resolve
        promiseReject = reject
      })
      sequelize
        .query('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
          return sequelize.query("SHOW TABLES LIKE 'user';")
        })
        .then(([results]) => {
          if (results.length === 0) {
            console.log('User table does not exist.')
            console.log('Detected unseeded database. Forcing Refresh.')
            forceRefresh = true
          }
        })
        .then(() => {
          // Sync to the database
          for (const model of Object.keys(sequelize.models)) {
            if (forceRefresh) console.log('creating associations for =>', sequelize.models[model])
            if (typeof (sequelize.models[model] as any).associate === 'function') {
              ;(sequelize.models[model] as any).associate(sequelize.models)
            }
          }
          return sequelize
            .sync({ force: forceRefresh })
            .then(() => {
              return (app as any)
                .configure(
                  seeder({
                    delete: forceRefresh,
                    disabled: !forceRefresh,
                    services: seederConfig
                  })
                )
                .seed()
                .then(() => {
                  console.log('Server Ready')
                  return Promise.resolve()
                })
                .catch((err) => {
                  console.log('Feathers seeding error')
                  console.log(err)
                  promiseReject()
                  throw err
                })

              if (performDryRun) {
                setTimeout(() => process.exit(0), 5000)
              }
            })
            .catch((err) => {
              console.log('Sequelize setup error')
              console.log(err)
              promiseReject()
              throw err
            })
        })
        .then((sync) => {
          app.set('sequelizeSync', sync)
          return sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
        })
        .then(async () => {
          if (forceRefresh === true && urlRegex.test(config.server.defaultContentPackURL)) {
            try {
              await app.service('content-pack').update(null, {
                manifestUrl: config.server.defaultContentPackURL
              })
            } catch (err) {
              console.log('Error downloading initial content pack')
              console.error(err)
            }
            promiseResolve()
            return Promise.resolve()
          } else {
            promiseResolve()
            return Promise.resolve()
          }
        })
        .catch((err) => {
          console.log('Sequelize sync error')
          console.log(err)
          promiseReject()
          throw err
        })
      return oldSetup.apply(this, args)
    }
  } catch (err) {
    console.log('Error in app/sequelize.ts')
    console.log(err)
  }
}
