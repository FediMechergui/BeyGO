const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BeyGo API',
      version: '1.0.0',
      description: `
# BeyGo - Tunisian Beylical History AR Experience

BeyGo is a Pokemon Go-style mobile application for exploring Tunisian Beylical history through augmented reality. 
Users can visit museums, collect puzzle pieces via AR, learn about historical Beys, and earn rewards.

## Features
- 🏛️ **Museums** - Discover museums and their AR hotspots
- 👑 **Beys** - Learn about Tunisian Beys and their dynasties
- 🧩 **Puzzles** - Collect AR puzzle pieces to unlock portraits
- 🏆 **Rewards** - Earn discounts and badges for completion
- 📍 **Location-Based** - GPS and QR code verification

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`
      `,
      contact: {
        name: 'BeyGo Support',
        email: 'support@beygo.tn'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'http://192.168.1.x:5000/api',
        description: 'Local network (replace with your IP)'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Museums', description: 'Museum discovery and information' },
      { name: 'Beys', description: 'Historical Bey information' },
      { name: 'Dynasties', description: 'Dynasty information' },
      { name: 'Visits', description: 'Museum visit tracking' },
      { name: 'Challenges', description: 'Puzzle challenges and AR interactions' },
      { name: 'Rewards', description: 'Reward system and redemption' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            username: { type: 'string', example: 'explorer123' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            category: { type: 'string', enum: ['visitor', 'student'], example: 'visitor' },
            profileImage: { type: 'string', example: '/uploads/profiles/user123.jpg' },
            totalPoints: { type: 'integer', example: 1500 },
            level: { type: 'integer', example: 5 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Museum: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Bardo National Museum' },
            description: { type: 'string', example: 'The largest museum in Tunisia...' },
            location: {
              type: 'object',
              properties: {
                address: { type: 'string', example: 'Le Bardo, Tunis' },
                coordinates: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number', example: 36.8095 },
                    longitude: { type: 'number', example: 10.1345 }
                  }
                },
                radius: { type: 'number', example: 100 }
              }
            },
            openingHours: {
              type: 'object',
              properties: {
                weekdays: { type: 'string', example: '09:00-17:00' },
                weekends: { type: 'string', example: '09:00-18:00' }
              }
            },
            entryFee: {
              type: 'object',
              properties: {
                regular: { type: 'number', example: 13 },
                student: { type: 'number', example: 4 }
              }
            },
            focus: { type: 'array', items: { type: 'string' }, example: ['beylical', 'ottoman'] },
            images: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean', example: true },
            totalVisits: { type: 'integer', example: 15000 }
          }
        },
        Bey: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Hussein I Bey' },
            title: { type: 'string', example: 'Founder of Husainid Dynasty' },
            biography: { type: 'string' },
            reignStart: { type: 'integer', example: 1705 },
            reignEnd: { type: 'integer', example: 1735 },
            reignEndType: { type: 'string', enum: ['death', 'deposed', 'abdication', 'other'] },
            dynasty: { $ref: '#/components/schemas/Dynasty' },
            primaryMuseum: { $ref: '#/components/schemas/Museum' },
            portraitImage: { type: 'string' },
            puzzle: {
              type: 'object',
              properties: {
                totalPieces: { type: 'integer', example: 9 },
                difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                gridSize: {
                  type: 'object',
                  properties: {
                    rows: { type: 'integer', example: 3 },
                    cols: { type: 'integer', example: 3 }
                  }
                }
              }
            },
            pointsValue: { type: 'integer', example: 100 },
            funFacts: { type: 'array', items: { type: 'string' } }
          }
        },
        Dynasty: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'husainid' },
            displayName: { type: 'string', example: 'Husainid Dynasty' },
            description: { type: 'string' },
            startYear: { type: 'integer', example: 1705 },
            endYear: { type: 'integer', example: 1957 },
            color: { type: 'string', example: '#C9A227' },
            founder: { type: 'string', example: 'Hussein I Bey' }
          }
        },
        Visit: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            museum: { $ref: '#/components/schemas/Museum' },
            status: { type: 'string', enum: ['active', 'completed', 'abandoned'] },
            visitDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            locationVerified: { type: 'boolean' },
            verificationMethod: { type: 'string', enum: ['gps', 'qr_code', 'manual'] },
            pointsEarned: { type: 'integer' },
            rating: { type: 'integer', minimum: 1, maximum: 5 }
          }
        },
        PuzzleChallenge: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            bey: { $ref: '#/components/schemas/Bey' },
            visit: { type: 'string' },
            status: { type: 'string', enum: ['active', 'paused', 'completed', 'abandoned'] },
            collectedPieces: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pieceIndex: { type: 'integer' },
                  collectedAt: { type: 'string', format: 'date-time' },
                  location: {
                    type: 'object',
                    properties: {
                      latitude: { type: 'number' },
                      longitude: { type: 'number' }
                    }
                  }
                }
              }
            },
            totalPieces: { type: 'integer' },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
            totalPoints: { type: 'integer' }
          }
        },
        Reward: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: '10% Museum Discount' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['discount', 'free_entry', 'gift', 'badge', 'certificate'] },
            discountPercentage: { type: 'number', example: 10 },
            bey: { type: 'string' },
            museum: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        UserReward: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            reward: { $ref: '#/components/schemas/Reward' },
            status: { type: 'string', enum: ['available', 'used', 'expired'] },
            redemptionCode: { type: 'string', example: 'BEY-ABC123' },
            earnedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
            usedAt: { type: 'string', format: 'date-time' }
          }
        },
        ARHotspot: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Throne Room Entrance' },
            description: { type: 'string' },
            puzzlePieceIndex: { type: 'integer', example: 0 },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: { type: 'array', items: { type: 'number' }, example: [10.1345, 36.8095] }
              }
            },
            radius: { type: 'number', example: 5 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            current: { type: 'integer', example: 1 },
            pages: { type: 'integer', example: 5 },
            total: { type: 'integer', example: 50 }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, message: 'Not authorized, no token' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, message: 'Resource not found' }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, message: 'Validation failed', errors: [] }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
