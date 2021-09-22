import { DataTypes, Sequelize } from 'sequelize'
import { Application } from '../../../declarations'

export default (app: Application): any => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const Server = sequelizeClient.define(
    'server',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true
      },
      hostName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      serverEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      serverMode: {
        type: DataTypes.STRING,
        allowNull: true
      },
      port: {
        type: DataTypes.STRING,
        allowNull: true
      },
      clientHost: {
        type: DataTypes.STRING,
        allowNull: true
      },
      rootDirectory: {
        type: DataTypes.STRING,
        allowNull: true
      },
      publicDirectory: {
        type: DataTypes.STRING,
        allowNull: true
      },
      nodeModulesDirectory: {
        type: DataTypes.STRING,
        allowNull: true
      },
      localStorageProvider: {
        type: DataTypes.STRING,
        allowNull: true
      },
      performDryRun: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      storageProvider: {
        type: DataTypes.STRING,
        allowNull: true
      },
      gaTrackingId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      hubEndpoint: {
        type: DataTypes.STRING,
        allowNull: true
      },
      paginate: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 10
      },
      url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      certPath: {
        type: DataTypes.STRING,
        allowNull: true
      },
      keyPath: {
        type: DataTypes.STRING,
        allowNull: true
      },
      local: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      releaseName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      defaultContentPackURL: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      hooks: {
        beforeCount(options: any): void {
          options.raw = true
        }
      }
    }
  )
  ;(Server as any).associate = (models: any): void => {
    ;(Server as any).belongsTo(models.user, { foreignKey: 'userId', allowNull: true })
  }

  return Server
}
