# Propiedades de AWS AppSync con CDK

## Resumen de todas las propiedades configuradas

Tu API de AppSync ahora incluye todas las propiedades principales disponibles en AWS CDK. Aquí tienes una explicación detallada:

## 🔧 Configuración Básica

### `name`
- **Propósito**: Nombre de la API GraphQL
- **Valor**: `'cdk-appsync-api'`
- **Descripción**: Identificador legible para tu API

### `schema`
- **Propósito**: Define el esquema GraphQL
- **Valor**: `SchemaFile.fromAsset('graphql/schema.graphql')`
- **Descripción**: Carga el esquema desde un archivo local

## 🔐 Configuración de Autorización

### `authorizationConfig.defaultAuthorization`
- **Tipo**: API_KEY
- **Descripción**: Método de autorización principal
- **Configuración**:
  - **expires**: 365 días
  - **description**: Descripción de la clave API
  - **name**: Nombre de la clave API

### `authorizationConfig.additionalAuthorizationModes`
Métodos adicionales de autorización disponibles:

#### 1. **IAM**
```typescript
{
  authorizationType: AuthorizationType.IAM
}
```
- Usa roles y políticas IAM de AWS

#### 2. **Cognito User Pool** (comentado)
```typescript
{
  authorizationType: AuthorizationType.USER_POOL,
  userPoolConfig: {
    userPool: userPool,
    appIdClientRegex: 'myAppId',
    defaultAction: UserPoolDefaultAction.ALLOW
  }
}
```
- Autenticación con usuarios de Cognito

#### 3. **OIDC** (comentado)
```typescript
{
  authorizationType: AuthorizationType.OIDC,
  openIdConnectConfig: {
    oidcProvider: 'https://your-oidc-provider.com',
    clientId: 'your-client-id',
    issuer: 'https://your-oidc-provider.com',
    authTtl: cdk.Duration.hours(1),
    iatTtl: cdk.Duration.hours(1)
  }
}
```
- Autenticación con proveedores OIDC externos

#### 4. **Lambda Authorizer** (comentado)
```typescript
{
  authorizationType: AuthorizationType.LAMBDA,
  lambdaAuthorizerConfig: {
    handler: authorizerFunction,
    resultsCacheTtl: cdk.Duration.minutes(5),
    identityValidationExpression: '^Bearer [-0-9A-Za-z\\.]+$'
  }
}
```
- Autorización personalizada con funciones Lambda

## 📊 Configuración de Logging

### `logConfig`
- **fieldLogLevel**: `FieldLogLevel.ALL`
  - **ALL**: Registra todos los eventos
  - **ERROR**: Solo errores
  - **NONE**: Sin logs
- **excludeVerboseContent**: `false`
  - `true`: Excluye contenido detallado
  - `false`: Incluye todo el contenido

## 🔍 Configuración de Tracing

### `xrayEnabled`
- **Valor**: `true`
- **Descripción**: Habilita AWS X-Ray para tracing distribuido
- **Beneficios**: 
  - Monitoreo de rendimiento
  - Identificación de cuellos de botella
  - Seguimiento de requests

## 🌐 Configuración de Visibilidad

### `visibility`
- **GLOBAL**: API pública (accesible desde internet)
- **PRIVATE**: API privada (solo desde VPC)
- **Valor actual**: `Visibility.GLOBAL`

## 🔎 Configuración de Introspección

### `introspectionConfig`
- **Valor**: `IntrospectionConfig.ENABLED`
- **Descripción**: Permite consultar el schema GraphQL
- **Útil para**: Desarrollo, herramientas como GraphiQL

## 🌍 Configuración de Dominio Personalizado (Opcional)

```typescript
domainName: {
  certificate: certificate, // Certificado ACM
  domainName: 'api.tudominio.com'
}
```
- Permite usar tu propio dominio en lugar del dominio generado por AWS

## 📤 Outputs Configurados

El stack exporta información útil:

1. **GraphQLAPIURL**: URL de tu API GraphQL
2. **GraphQLAPIKey**: Clave de la API para autenticación
3. **GraphQLAPIId**: ID único de la API
4. **GraphQLAPIArn**: ARN completo de la API

## 💡 Datos Sources Comunes (Ejemplos comentados)

### DynamoDB
```typescript
const booksDataSource = api.addDynamoDbDataSource('BooksDataSource', booksTable);
```

### Lambda
```typescript
const lambdaDataSource = api.addLambdaDataSource('LambdaDataSource', booksFunction);
```

### HTTP
```typescript
const httpDataSource = api.addHttpDataSource('HttpDataSource', 'https://api.example.com');
```

## 🚀 Próximos Pasos

1. **Despliega el stack**: `cdk deploy`
2. **Prueba la API**: Usa la URL del output
3. **Agrega Data Sources**: Conecta con DynamoDB, Lambda, etc.
4. **Crea Resolvers**: Implementa la lógica de negocio
5. **Configura autenticación**: Descomenta los métodos que necesites

## 📚 Recursos Útiles

- [AWS AppSync Documentation](https://docs.aws.amazon.com/appsync/)
- [CDK AppSync API Reference](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_appsync-readme.html)
- [GraphQL Schema Language](https://graphql.org/learn/schema/)

¡Tu API de AppSync está ahora configurada con todas las propiedades principales disponibles! 🎉