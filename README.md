# 🎨 Image Transformation Service

A full-stack application that allows users to upload images, automatically remove backgrounds, flip them horizontally, and manage their transformed images online.

## 🌟 Features

### Core Functionality
- **Image Upload**: Simple, intuitive interface for uploading single image files
- **Background Removal**: Automatic background removal using third-party AI services
- **Horizontal Flip**: Automatic horizontal flipping of processed images
- **Image Hosting**: Processed images hosted online with unique, shareable URLs
- **Image Management**: Delete functionality to remove uploaded and processed images

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Modern React-based UI with TypeScript
- Intuitive drag-and-drop upload interface
- Real-time processing status updates
- Image preview and management dashboard

**Backend:**
- Node.js/Express with TypeScript
- RESTful API endpoints
- Integration with third-party background removal service
- Image processing pipeline (background removal → horizontal flip)
- Secure file storage and retrieval

**Hosting & Storage:**
- Cloud-based image hosting
- Unique URL generation for processed images
- Persistent storage for image management

## 📋 Project Structure

```
uplane/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service calls
│   │   ├── hooks/           # Custom React hooks
│   │   └── App.tsx          # Main application component
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
│
├── backend/                 # Node.js/Express TypeScript application
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── controllers/     # Business logic
│   │   ├── services/        # External service integrations
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   └── index.ts         # Server entry point
│   ├── uploads/             # Temporary upload directory
│   └── package.json         # Backend dependencies
│
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- GitHub account for repository access
- API key for background removal service (free tier)

### Installation & Setup

#### Backend Setup
```bash
cd backend
npm install
npm run build
npm start
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The application will be available at `http://localhost:3000` (frontend) and the backend API at `http://localhost:5000`.

## 📖 API Endpoints

### Upload Image
- **POST** `/api/upload`
- Upload a single image file for processing
- Returns: Unique image ID and processing status

### Get Processed Image
- **GET** `/api/images/:imageId`
- Retrieve details about a processed image including URL
- Returns: Image metadata and hosted URL

### Delete Image
- **DELETE** `/api/images/:imageId`
- Remove an image and its processed version
- Returns: Confirmation of deletion

### List User Images
- **GET** `/api/images`
- Retrieve all images for the current user
- Returns: Array of image metadata

## 🔧 Configuration

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend (.env)**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=your_database_url
BACKGROUND_REMOVAL_API_KEY=your_api_key
BACKGROUND_REMOVAL_SERVICE=service_name
IMAGE_STORAGE_BUCKET=your_bucket_name
```

**Frontend (.env)**
```
REACT_APP_API_BASE_URL=https://your-backend-url
REACT_APP_ENVIRONMENT=production
```

## 🎯 User Flow

1. **Upload**: User selects and uploads an image via the web interface
2. **Process**: Backend receives image and processes it:
   - Removes background using AI service
   - Flips the image horizontally
3. **Host**: Processed image is uploaded to cloud storage
4. **Share**: User receives unique URL to access their image
5. **Manage**: User can view all their images and delete any as needed

## 🔌 Third-Party Integrations

### Background Removal Service
The application integrates with a free/trial-based background removal service such as:
- **Remove.bg** - High-quality background removal with free tier
- **Cloudinary** - Image transformation API with background removal
- **Pixlr** - Cloud-based image editing API

**Note**: The project uses free credits/trial periods to avoid costs during development and testing.

## 📦 Deployment

### Frontend Deployment
- Recommended: Vercel, Netlify, or GitHub Pages
- Build process: `npm run build`
- Environment variables configured before deployment

### Backend Deployment
- Recommended: Render, Heroku, Railway, or AWS
- Docker support for containerized deployment
- Database migrations handled automatically
- Environment variables secured through platform settings

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

## 📝 Code Style & Standards

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Code linting and formatting standards
- **Prettier**: Automatic code formatting
- **Git Hooks**: Pre-commit checks via Husky

## 🔐 Security Considerations

- File upload validation (size, type, format)
- Secure API authentication and authorization
- CORS configuration for frontend-backend communication
- Input sanitization and validation
- Secure storage of API keys and credentials
- HTTPS enforcement in production

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Drag & Drop**: Intuitive file upload interface
- **Real-time Feedback**: Loading states and progress indicators
- **Image Preview**: View original and processed images side-by-side
- **Error Handling**: Clear error messages for troubleshooting
- **Accessibility**: WCAG compliance for all users

## 🐛 Troubleshooting

### Common Issues

**Upload Fails**
- Check file size (ensure under limit)
- Verify file format is supported (JPG, PNG, WebP)
- Confirm backend is running and accessible

**Background Removal Not Working**
- Verify API key is valid and active
- Check API rate limits haven't been exceeded
- Review service documentation for supported image types

**Images Not Loading**
- Confirm storage bucket is accessible
- Check image URL in browser console
- Verify CORS settings on backend

## 📚 Documentation

For detailed documentation on specific features, see:
- **Backend API**: `backend/API_DOCS.md`
- **Frontend Components**: `frontend/COMPONENT_DOCS.md`
- **Deployment Guide**: `DEPLOYMENT.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Have Fun!

This challenge is designed to be enjoyable and engaging. Feel free to:
- Add extra features beyond the core requirements
- Experiment with different UI designs
- Optimize performance and user experience
- Contribute creative enhancements

Remember: The goal is to have fun while building something useful! 🚀

## 📞 Support & Questions

For issues, questions, or suggestions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include reproduction steps and error messages
4. Attach relevant screenshots or logs

---

**Ready to get started?** Clone the repository, follow the setup guide, and begin building! 🎨✨
