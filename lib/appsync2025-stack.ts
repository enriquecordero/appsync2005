import * as cdk from "aws-cdk-lib";
import {
  GraphqlApi,
  AuthorizationType,
  FieldLogLevel,
  SchemaFile,
  Visibility,
  IntrospectionConfig,
} from "aws-cdk-lib/aws-appsync";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class Appsync2025Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CloudWatch Log Group para AppSync
    const appsyncLogGroup = new logs.LogGroup(this, "AppSyncLogGroup", {
      logGroupName: "/aws/appsync/apis/cdk-appsync-api",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new GraphqlApi(this, "Api", {
      // ========== CONFIGURACIÓN BÁSICA ==========
      name: "cdk-appsync-api",
      schema: SchemaFile.fromAsset("graphql/schema.graphql"),

      // ========== CONFIGURACIÓN DE AUTORIZACIÓN ==========
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365)),
            description: "CDK created API Key para desarrollo",
            name: "Appsync2025Key",
          },
        },
        // Métodos de autorización adicionales
        additionalAuthorizationModes: [
          {
            authorizationType: AuthorizationType.IAM,
          },
          // Descomenta para usar Cognito User Pool:
          // {
          //   authorizationType: AuthorizationType.USER_POOL,
          //   userPoolConfig: {
          //     userPool: userPool, // Tu User Pool
          //     appIdClientRegex: 'myAppId',
          //     defaultAction: UserPoolDefaultAction.ALLOW
          //   }
          // },
        ],
      },

      // ========== CONFIGURACIÓN DE LOGGING ==========
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL, // ALL, ERROR, NONE
        excludeVerboseContent: false, // Incluir contenido detallado en logs
      },

      // ========== CONFIGURACIÓN DE TRACING ==========
      xrayEnabled: true, // AWS X-Ray tracing habilitado

      // ========== CONFIGURACIÓN DE VISIBILIDAD ==========
      visibility: Visibility.GLOBAL, // GLOBAL (público) o PRIVATE

      // ========== CONFIGURACIÓN DE INTROSPECCIÓN ==========
      introspectionConfig: IntrospectionConfig.ENABLED, // Habilita introspección

      // ========== CONFIGURACIÓN DE DOMINIO PERSONALIZADO ==========
      // Descomenta y configura para dominio personalizado:
      // domainName: {
      //   certificate: certificate, // Certificado ACM
      //   domainName: 'api.tudominio.com'
      // }
    });

    // ========== CONFIGURACIÓN DE BASE DE DATOS ==========

    /**
     * Tabla DynamoDB para almacenar la información de los libros
     *
     * Configuración:
     * - Partition Key: 'id' (String) - Identificador único del libro
     * - Billing Mode: Pay-per-request (ideal para cargas variables)
     * - Removal Policy: DESTROY (solo para desarrollo/testing)
     */
    const bookTable = new dynamodb.Table(this, "BooksTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "Books",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // ⚠️ Solo para desarrollo
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Facturación on-demand

      // Configuración adicional para producción
      pointInTimeRecovery: false, // Habilitar en producción
      deletionProtection: false, // Habilitar en producción
    });

    // Agregar tags a la tabla usando CDK Tags
    cdk.Tags.of(bookTable).add("Environment", "development");
    cdk.Tags.of(bookTable).add("Service", "appsync-books-api");

    // ========== CONFIGURACIÓN DE DATA SOURCES Y RESOLVERS ==========

    /**
     * Función Lambda para resolver la query ListBooks
     *
     * Características:
     * - Runtime: Node.js 20.x (versión LTS más reciente)
     * - Memoria: 512 MB (optimizada para procesamiento de datos)
     * - Timeout: 30 segundos (suficiente para consultas complejas)
     * - Bundling: esbuild para optimización de código
     */
    const listBooksLambda = new NodejsFunction(this, "ListBooksFunction", {
      // Configuración del archivo fuente
      entry: "lambda/listBooks.ts",
      handler: "handler",

      // Configuración del runtime
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      architecture: cdk.aws_lambda.Architecture.ARM_64, // Mejor rendimiento/precio

      // Configuración de recursos
      memorySize: 512, // Memoria optimizada para procesamiento de datos
      timeout: cdk.Duration.seconds(30), // Timeout generoso para consultas

      // Configuración de bundling y optimización
      bundling: {
        minify: true, // Minimizar código para menor tamaño
        sourceMap: true, // Source maps para debugging
        target: "es2022", // Target moderno para mejor rendimiento
        format: cdk.aws_lambda_nodejs.OutputFormat.ESM, // ESM modules
        mainFields: ["module", "main"], // Priorizar módulos ES
        externalModules: ["@aws-sdk/*"], // AWS SDK v3 ya incluido en runtime
      },

      // Variables de entorno
      environment: {
        BOOKS_TABLE: bookTable.tableName,
        NODE_ENV: "production",
        LOG_LEVEL: "info",
        REGION: this.region,
      },

      // Configuración de logging y monitoreo
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: cdk.aws_lambda.Tracing.ACTIVE, // X-Ray tracing

      // Descripción para documentación
      description:
        "Lambda function para resolver la query ListBooks en AppSync GraphQL API",
    });

    // Permisos para que la Lambda pueda leer de la tabla DynamoDB
    bookTable.grantReadData(listBooksLambda);

    /**
     * Data Source Lambda para conectar AppSync con la función Lambda
     *
     * Este data source permite que AppSync invoque la función Lambda
     * y reciba las respuestas para resolver las queries GraphQL
     */
    const listBooksDataSource = api.addLambdaDataSource(
      "ListBooksDataSource",
      listBooksLambda,
      {
        name: "ListBooksLambdaDataSource",
        description: "Lambda Data Source para obtener la lista de libros",
      }
    );

    /**
     * Resolver para la query ListBooks
     *
     * Conecta el campo ListBooks del tipo Query con la función Lambda
     * El resolver maneja la transformación entre GraphQL y Lambda
     */
    listBooksDataSource.createResolver("ListBooksResolver", {
      typeName: "Query",
      fieldName: "ListBooks", // Debe coincidir exactamente con el schema GraphQL

      // Opcional: Templates de mapeo para transformación de datos
      // requestMappingTemplate: MappingTemplate.lambdaRequest(),
      // responseMappingTemplate: MappingTemplate.lambdaResult(),
    });

    // Otorgar permisos adicionales a la Lambda si es necesario
    // Ejemplo: Para acceder a DynamoDB, S3, etc.
    // dynamoTable.grantReadData(listBooksLambda);

    // ========== OUTPUTS ÚTILES ==========
    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl,
      description: "URL de la API GraphQL",
    });

    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: api.apiKey || "No API Key",
      description: "Clave de la API GraphQL",
    });

    new cdk.CfnOutput(this, "GraphQLAPIId", {
      value: api.apiId,
      description: "ID de la API GraphQL",
    });

    new cdk.CfnOutput(this, "GraphQLAPIArn", {
      value: api.arn,
      description: "ARN de la API GraphQL",
    });

    // The code that defines your stack goes here
  }
}
