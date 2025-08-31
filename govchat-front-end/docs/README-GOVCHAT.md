# GovChat - AI Assistant with RAG, Citations & Audit

A comprehensive frontend chatbot application for government data analysis with Retrieval Augmented Generation (RAG), source citations, and trust scoring.

## Features

### 🤖 **AI Chat Interface**
- Interactive chat with message history
- Real-time typing indicators
- Beautiful animated UI with glassmorphism effects
- Support for markdown formatting in responses

### 📊 **Trust Meter**
- Dynamic trust scoring (0-100) for each response
- Visual indicators with color-coded reliability
- Heuristic-based scoring considering:
  - Embedding similarity scores
  - Number of distinct sources
  - Document recency flags

### 📚 **Sources Panel**
- Expandable source verification
- Document relevance percentages
- Recency indicators
- Source preview snippets
- Summary statistics

### ⚙️ **Settings Configuration**
- AI model selection (OpenAI/local)
- Retrieval parameters (top-k, chunk size, overlap)
- Real-time settings updates
- Index rebuilding functionality

### 📁 **File Management**
- Drag & drop file uploads
- Support for multiple formats:
  - PDFs, CSVs, TXT, Markdown
  - JSON, XML, HTML, YAML
  - Processing status indicators
- Automatic indexing pipeline

## Architecture

### Component Structure
```
├── components/
│   ├── ui/
│   │   ├── gov-chat.tsx          # Main chat application
│   │   ├── chat-history.tsx      # Message history with bubbles
│   │   ├── trust-meter.tsx       # Animated trust scoring
│   │   ├── sources-panel.tsx     # Source verification
│   │   ├── settings-panel.tsx    # Configuration panel
│   │   ├── file-upload.tsx       # File management
│   │   └── animated-ai-chat.tsx  # Base chat components
│   └── demo.tsx                  # App wrapper
├── contexts/
│   └── chat-context.tsx          # Global state management
├── lib/
│   ├── api.ts                    # API service layer
│   ├── types.ts                  # TypeScript definitions
│   └── utils.ts                  # Utility functions
```

### State Management
- React Context for global chat state
- Reducer pattern for complex state updates
- Type-safe message and audit data flow

### API Integration
- Modular API service with fallback mock responses
- Support for external backend integration
- Configurable endpoints and authentication

## Usage

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### API Configuration
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
OPENAI_API_KEY=your_openai_api_key_here
```

### Backend Integration
The frontend expects these API endpoints:

#### POST /api/chat
Send a question and receive an AI response with audit data.

**Request:**
```json
{
  "question": "What is the student enrollment data?",
  "settings": {
    "useOpenAI": true,
    "topK": 4,
    "chunkSize": 900,
    "chunkOverlap": 120,
    "modelName": "gpt-4o-mini",
    "embedModel": "text-embedding-3-small"
  }
}
```

**Response:**
```json
{
  "answer": "Based on the available data...",
  "audit": {
    "question": "What is the student enrollment data?",
    "trust_score": 85,
    "retrieved": [
      {
        "source": "enrollment_2023.pdf",
        "similarity": 0.89,
        "recency_flag": true,
        "preview": "Student enrollment statistics..."
      }
    ],
    "timestamp": 1703123456789
  }
}
```

#### POST /api/upload
Upload files for document indexing.

#### POST /api/rebuild-index
Rebuild the search index with current settings.

#### GET /api/index-status
Get current index status and statistics.

## Customization

### Styling
- Uses Tailwind CSS with custom design system
- Dark theme optimized with glassmorphism effects
- Responsive design for mobile and desktop
- Custom scrollbars and animations

### Trust Scoring
Customize the trust calculation in `lib/api.ts`:
```typescript
const computeTrustScore = (similarities, distinctSources, recencyFlags) => {
  // Custom scoring logic here
  const sim = similarities.reduce((a, b) => a + b) / similarities.length;
  const src = Math.min(distinctSources, 3) / 3;
  const rec = recencyFlags.filter(f => f).length / recencyFlags.length;
  return Math.round((0.6 * sim + 0.25 * src + 0.15 * rec) * 100);
};
```

### Adding New File Types
Extend file upload support in `components/ui/file-upload.tsx`:
```typescript
accept=".pdf,.csv,.txt,.md,.json,.xml,.html,.yaml,.yml,.log,.rst,.your-format"
```

## Performance

### Optimizations
- Lazy loading of components
- Virtualized long message lists
- Debounced API calls
- Efficient re-renders with React.memo
- Optimistic UI updates

### Animations
- Framer Motion for smooth transitions
- GPU-accelerated transforms
- Reduced motion support
- Progressive enhancement

## Deployment

### Environment Variables
```env
# Production API
NEXT_PUBLIC_API_URL=https://your-api.com

# Optional: OpenAI integration
OPENAI_API_KEY=sk-...
```

### Build Commands
```bash
# Production build
npm run build

# Start production server
npm start
```

## Integration with Streamlit Backend

To connect with your existing Streamlit backend:

1. **Convert Streamlit API**: Create FastAPI endpoints that mirror your Streamlit functionality
2. **Data Migration**: Use the same document processing pipeline
3. **Index Compatibility**: Ensure FAISS index format matches
4. **Settings Sync**: Map frontend settings to backend parameters

### Example Backend Integration
```python
# backend/main.py
from fastapi import FastAPI, UploadFile
from your_streamlit_logic import process_question, rebuild_index

app = FastAPI()

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    answer, audit = process_question(request.question, request.settings)
    return {"answer": answer, "audit": audit}

@app.post("/api/upload")
async def upload_files(files: List[UploadFile]):
    # Process and index uploaded files
    return {"files": processed_files}
```

## Contributing

1. Follow the existing component structure
2. Use TypeScript for type safety
3. Add proper error handling
4. Include loading states and animations
5. Test with mock data when API is unavailable

## License

MIT License - feel free to customize for your GovHack project!
