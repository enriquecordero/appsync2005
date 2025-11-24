# AppSync 2025

This project is a Serverless GraphQL API built using **AWS CDK**, **AWS AppSync**, **Amazon DynamoDB**, and **AWS Lambda**.

## 🏗 Architecture

The infrastructure is defined as code using AWS CDK (TypeScript) and consists of the following components:

- **API**: AWS AppSync (GraphQL) with API Key authorization.
- **Database**: Amazon DynamoDB (Books table) with On-Demand billing.
- **Compute**: AWS Lambda (Node.js 20.x) for resolving GraphQL queries.
- **Logging**: CloudWatch Logs and X-Ray tracing enabled.

## 🚀 Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with your credentials
- [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html) (`npm install -g aws-cdk`)

## 🛠 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/enriquecordero/appsync2005.git
   cd appsync2025
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 📦 Deployment

To deploy the stack to your AWS account:

```bash
cdk deploy
```

After deployment, the CDK output will provide:
- **GraphQLAPIURL**: The endpoint URL.
- **GraphQLAPIKey**: The API Key for authentication.

## 📝 Usage

You can query the API using the AWS Console (AppSync) or any GraphQL client (like Postman or Insomnia).

### Schema

```graphql
type Book {
  id: ID!
  title: String!
  completed: Boolean
  rating: Int
  review: [String]
}

type Query {
  ListBooks: [Book]
}
```

### Example Query

**ListBooks**

```graphql
query {
  ListBooks {
    id
    title
    completed
    rating
  }
}
```

## 📂 Project Structure

- `lib/appsync2025-stack.ts`: Main CDK stack definition.
- `graphql/schema.graphql`: GraphQL schema definition.
- `lambda/listBooks.ts`: Lambda function code for the `ListBooks` resolver.
- `bin/appsync2025.ts`: Entry point for the CDK application.

## 🧪 Testing

Run unit tests:

```bash
npm test
```
