const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Your API",
      version: "1.0.0",
      description: "API documentation",
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:5000", // Dynamic URL
      },
    ],
    components: {
      schemas: {
        Certification: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Certification ID",
            },
            userId: {
              type: "string",
              description: "User ID",
            },
            title: {
              type: "string",
              description: "Certification title",
            },
            year: {
              type: "string",
              description: "Year of certification",
            },
            document: {
              type: "string",
              description: "Document link",
            },
            achievementDate: {
              type: "string",
              format: "date-time",
              description: "Date of achievement",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "User ID",
            },
            firstName: {
              type: "string",
              description: "First name",
            },
            lastName: {
              type: "string",
              description: "Last name",
            },
            universityName: {
              type: "string",
              description: "University name",
            },
            mutualFriends: {
              type: "array",
              items: {
                type: "string",
              },
              description: "List of mutual friends",
            },
            info: {
              type: "string",
              description: "User info",
            },
            address: {
              type: "string",
              description: "User address",
            },
            username: {
              type: "string",
              description: "Username",
            },
            status: {
              type: "string",
              description: "Status",
            },
          },
        },
        Chat: {
          type: "object",
          properties: {
            sender: {
              type: "string",
              description: "Sender ID",
            },
            recipient: {
              type: "string",
              description: "Recipient ID",
            },
            text: {
              type: "string",
              description: "Chat message",
            },
            date: {
              type: "string",
              format: "date-time",
              description: "Date of the message",
            },
          },
        },
        ChatRoom: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "ChatRoom ID",
            },
            name: {
              type: "string",
              description: "ChatRoom name",
            },
            members: {
              type: "array",
              items: {
                type: "string",
              },
              description: "List of members in the chat room",
            },
            createdBy: {
              type: "string",
              description: "ID of the user who created the chat room",
            },
            code: {
              type: "string",
              description: "Chat room code",
            },
          },
        },
        FriendRequest: {
          type: "object",
          properties: {
            sender: {
              type: "string",
              description: "Sender ID",
            },
            recipient: {
              type: "string",
              description: "Recipient ID",
            },
            status: {
              type: "string",
              description: "Status of the friend request",
            },
          },
        },
        Notification: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "User ID",
            },
            message: {
              type: "string",
              description: "Notification message",
            },
            read: {
              type: "boolean",
              description: "Read status",
            },
            date: {
              type: "string",
              format: "date-time",
              description: "Date of the notification",
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;
