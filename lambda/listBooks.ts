/**
 * Lambda Function: ListBooks Handler
 *
 * Esta función maneja la query GraphQL 'ListBooks' y devuelve
 * una lista de libros desde DynamoDB o datos mock para desarrollo.
 *
 * @author AppSync 2025 Project
 * @version 2.0.0
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import  { AppSyncResolverEvent, Context } from "aws-lambda";

// Configuración del cliente DynamoDB
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Tipo de datos para un libro
 */
interface Book {
  id: string;
  title: string;
  completed?: boolean;
  rating?: number;
  review?: string[];
}

/**
 * Datos mock para desarrollo y testing
 * Incluye una biblioteca diversa con libros clásicos y modernos
 */
const MOCK_BOOKS: Book[] = [
  {
    id: "1",
    title: "1984",
    completed: true,
    rating: 5,
    review: [
      "Una obra maestra distópica que sigue siendo relevante",
      "Orwell predijo muchas cosas con precisión aterradora",
    ],
  },
  {
    id: "2",
    title: "To Kill a Mockingbird",
    completed: true,
    rating: 5,
    review: [
      "A gripping tale of racial injustice.",
      "Una historia poderosa sobre justicia y moralidad",
    ],
  },
  {
    id: "3",
    title: "Harry Potter and the Sorcerer's Stone",
    completed: true,
    rating: 5,
    review: [
      "A magical start to a beloved series.",
      "El inicio perfecto de una saga inolvidable",
    ],
  },
  {
    id: "4",
    title: "The Great Gatsby",
    completed: false,
    rating: 4,
    review: [
      "Crítica brillante del sueño americano",
      "Prosa hermosa y simbolismo profundo",
    ],
  },
  {
    id: "5",
    title: "Pride and Prejudice",
    completed: true,
    rating: 4,
    review: [
      "Romance clásico magistralmente escrito",
      "Los personajes son inolvidables",
    ],
  },
  {
    id: "6",
    title: "The Catcher in the Rye",
    completed: false,
    rating: 3,
    review: [
      "Narración única y controversial",
      "Un clásico que divide opiniones",
    ],
  },
  {
    id: "7",
    title: "Dune",
    completed: true,
    rating: 5,
    review: [
      "Ciencia ficción épica",
      "Worldbuilding increíble y política compleja",
    ],
  },
  {
    id: "8",
    title: "The Lord of the Rings",
    completed: false,
    rating: 5,
    review: ["La obra definitiva de la fantasía moderna"],
  },
];

/**
 * Handler principal de la función Lambda
 *
 * @param event - Evento de AppSync con información de la query
 * @param context - Contexto de ejecución de Lambda
 * @returns Promise<Book[]> - Lista de libros
 */
export const handler = async (
  event: AppSyncResolverEvent<any> | any = {},
  context?: Context
): Promise<Book[]> => {
  const requestId = context?.awsRequestId || "local-test";

  console.log("📚 ListBooks Lambda iniciada", {
    requestId,
    fieldName: event.info?.fieldName || "ListBooks",
    parentTypeName: event.info?.parentTypeName || "Query",
    timestamp: new Date().toISOString(),
  });

  try {
    // Determinar si usar DynamoDB o datos mock
    const useMockData =
      process.env.USE_MOCK_DATA === "true" || !process.env.BOOKS_TABLE;

    if (useMockData) {
      console.log("🔧 Usando datos mock para desarrollo");
      console.log(`📖 Devolviendo ${MOCK_BOOKS.length} libros mock`);
      return MOCK_BOOKS;
    }

    // Consultar DynamoDB
    console.log("🗄️ Consultando DynamoDB tabla:", process.env.BOOKS_TABLE);

    const scanCommand = new ScanCommand({
      TableName: process.env.BOOKS_TABLE,
      // Limitar resultados para evitar timeouts
      Limit: 50,
      // Proyección para optimizar la consulta
      ProjectionExpression: "id, title, completed, rating, review",
    });

    const result = await docClient.send(scanCommand);

    console.log(
      `✅ Encontrados ${result.Items?.length || 0} libros en DynamoDB`
    );

    // Si no hay datos en DynamoDB, devolver datos mock
    if (!result.Items || result.Items.length === 0) {
      console.log(
        "📝 No hay datos en DynamoDB, devolviendo datos mock como fallback"
      );
      return MOCK_BOOKS;
    }

    // Transformar y validar los datos de DynamoDB
    const books: Book[] = result
      .Items!.filter(validateBook)
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        completed: Boolean(item.completed),
        rating:
          typeof item.rating === "number"
            ? Math.max(1, Math.min(5, item.rating))
            : undefined,
        review: Array.isArray(item.review)
          ? item.review.filter((r: any) => typeof r === "string")
          : undefined,
      }));

    console.log(`📚 Devolviendo ${books.length} libros procesados de DynamoDB`);
    return books;
  } catch (error) {
    console.error("❌ Error en ListBooks Lambda:", {
      error: error instanceof Error ? error.message : "Error desconocido",
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
      timestamp: new Date().toISOString(),
    });

    // En caso de error, devolver datos mock para mantener la funcionalidad
    console.log("🔄 Fallback: devolviendo datos mock debido al error");
    return MOCK_BOOKS;
  }
};

/**
 * Función auxiliar para validar un libro
 * Asegura que los datos tengan la estructura mínima requerida
 */
function validateBook(book: any): book is Book {
  return (
    book &&
    typeof book.id === "string" &&
    typeof book.title === "string" &&
    book.id.trim().length > 0 &&
    book.title.trim().length > 0
  );
}
