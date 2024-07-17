const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Mobile App API",
      version: "1.0.0",
      description: "API Documentation for Mobile App",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Notification: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            userId: {
              type: "string",
            },
            message: {
              type: "string",
            },
            date: {
              type: "string",
              format: "date-time",
            },
            read: {
              type: "boolean",
            },
          },
        },
        // Add other schemas like Chat, User, etc.
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Adjust this path to match where your route files are located
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;
