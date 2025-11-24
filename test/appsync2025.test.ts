import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as Appsync2025 from "../lib/appsync2025-stack";

test("AppSync Stack Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Appsync2025.Appsync2025Stack(app, "MyTestStack");
    // THEN
    const template = Template.fromStack(stack);

    // Verify AppSync API created
    template.hasResourceProperties("AWS::AppSync::GraphQLApi", {
        Name: "cdk-appsync-api",
        AuthenticationType: "API_KEY",
    });

    // Verify DynamoDB Table created
    template.hasResourceProperties("AWS::DynamoDB::Table", {
        BillingMode: "PAY_PER_REQUEST",
        KeySchema: [
            {
                AttributeName: "id",
                KeyType: "HASH",
            },
        ],
    });

    // Verify Lambda Function created
    template.hasResourceProperties("AWS::Lambda::Function", {
        Runtime: "nodejs20.x",
        Environment: {
            Variables: {
                NODE_ENV: "production",
                BOOKS_TABLE: {
                    Ref: Match.stringLikeRegexp("BooksTable.*"),
                },
            },
        },
    });

    // Verify Data Source created
    template.hasResourceProperties("AWS::AppSync::DataSource", {
        Type: "AWS_LAMBDA",
        Name: "ListBooksLambdaDataSource",
    });

    // Verify Resolver created
    template.hasResourceProperties("AWS::AppSync::Resolver", {
        TypeName: "Query",
        FieldName: "ListBooks",
    });
});
