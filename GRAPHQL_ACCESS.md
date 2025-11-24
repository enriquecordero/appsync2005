# GraphQL API Configuration

## URLs y Credenciales
- **GraphQL Endpoint**: https://s5apb3s7jzh43ewkgqfch7ijly.appsync-api.us-east-1.amazonaws.com/graphql
- **API Key**: da2-23eiy5v2yjeploeewwamcbgrva
- **API ID**: sy62idsvbfbtbfjy5y3rt2n5ze
- **Region**: us-east-1

## Queries Disponibles

### Introspección del Schema
```graphql
query {
  __schema {
    types {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
}
```

### Query Principal
```graphql
query {
  ListBooks {
    id
    title
    completed
    rating
    review
  }
}
```

## Headers Requeridos
```json
{
  "Content-Type": "application/json",
  "x-api-key": "da2-23eiy5v2yjeploeewwamcbgrva"
}
```

## Ejemplo curl
```bash
curl -X POST \
  https://s5apb3s7jzh43ewkgqfch7ijly.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-23eiy5v2yjeploeewwamcbgrva" \
  -d '{"query": "query { ListBooks { id title completed rating review } }"}'
```

## Estado Actual
✅ API desplegada correctamente  
✅ Schema cargado  
⚠️ Sin resolvers configurados (queries devuelven null)  

## Próximos Pasos
1. Agregar Data Sources (DynamoDB, Lambda, etc.)
2. Configurar Resolvers para las queries
3. Agregar mutations para crear/actualizar datos