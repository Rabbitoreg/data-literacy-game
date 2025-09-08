# Data Decisions: Pilot Pursuit

A multiplayer data literacy game for learning professionals. Teams analyze ambiguous statements about sales pilot data, purchase clarifying information, and make True/False/Unknown decisions within time and budget constraints.

## Features

- **60-minute multiplayer experience** - Zoom-first design with breakout room support
- **Real-time collaboration** - WebSocket-powered synchronization for up to 500 participants
- **Budget-based gameplay** - $1,000 starting budget to purchase evidence strategically
- **Observable HQ integration** - Live data visualizations and chart embedding
- **Dual interfaces** - Team decision interface and facilitator admin dashboard
- **Accessibility-first** - ARIA labels, keyboard navigation, high contrast support
- **Scoring system** - Points for accuracy (+100 T/F, +70 Unknown, -80 incorrect)

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
cd c:\work\dl25\ai-test\dataliteracy
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your database connection:
```
DATABASE_URL="postgresql://username:password@localhost:5432/dataliteracy?schema=public"
```

3. **Initialize database:**
```bash
npx prisma generate
npx prisma db push
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open your browser:**
- Main app: http://localhost:3000
- Create session as facilitator
- Join as team with session ID

## Game Flow

### For Facilitators

1. **Create Session** - Set title, max teams, choose sample or CSV data
2. **Admin Dashboard** - Monitor teams, control rounds, broadcast messages
3. **Start Rounds** - Launch 18-minute breakout sessions
4. **Plenary View** - Big-screen leaderboard and analytics for debriefs

### For Teams

1. **Team Setup** - Enter team name and member names (comma-separated)
2. **Decision Making** - Analyze statements, purchase evidence, make choices
3. **Rotation System** - Decider role rotates automatically per statement
4. **Budget Management** - Strategic spending on data artifacts and visualizations

## Architecture

### Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Socket.IO, Prisma ORM
- **Database:** PostgreSQL
- **Charts:** Recharts, Observable HQ integration
- **UI:** Radix UI components, shadcn/ui

### Key Components

```
src/
├── app/                    # Next.js app router
│   ├── page.tsx           # Landing page
│   ├── play/              # Team interface
│   ├── admin/             # Facilitator dashboard
│   └── plenary/           # Big-screen display
├── components/
│   ├── game/              # Game-specific components
│   ├── admin/             # Admin interface components
│   ├── charts/            # Visualization components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── socket.ts          # WebSocket server
│   ├── scoring.ts         # Game mechanics
│   ├── data-processor.ts  # CSV parsing
│   └── prisma.ts          # Database client
└── types/
    └── game.ts            # TypeScript definitions
```

### Database Schema

- **sessions** - Game sessions with configuration
- **teams** - Team data, budget, score, member rotation
- **statements** - True/False/Unknown questions with metadata
- **items** - Store items (evidence) with costs and delivery types
- **purchases** - Team purchases with delivery tracking
- **decisions** - Team choices with rationale and scoring
- **rounds** - Individual statement attempts per team

## Observable HQ Integration

The game supports embedding Observable notebooks in two ways:

### 1. Iframe Embedding
```javascript
// Store item configuration
{
  "deliveryType": "observable_cell",
  "observableConfig": {
    "notebookId": "d/fb670ca5f330a7e9",
    "cells": ["chart_winrate"],
    "mode": "iframe",
    "height": 540
  }
}
```

### 2. Runtime Embedding
```javascript
// Dynamic loading with Observable Runtime
import { Runtime, Inspector } from "@observablehq/runtime";
const notebook = await import("https://api.observablehq.com/d/NOTEBOOK_ID.js?v=3");
```

## Sample Data

The game includes sample statements and store items:

### Statements
- "Sales enablement training increased average deal size by 8% in Q3" (False - seasonality confound)
- "Pilot regions had significantly higher close rates than control" (True - p<0.05)
- "Time-to-first-contact improved due to the training" (Unknown - data quality issues)

### Store Items
- **Interview: Learning Team** ($250, 3min) - Process insights
- **Data Dictionary** ($120, 1min) - Field definitions
- **Segment Drilldown** ($180, 2min) - Regional analysis
- **Observable Dashboard** ($160, 2min) - Live visualization

## CSV Data Integration

Process your own sales data by placing CSV files in the project root:

```csv
id,text,topic,difficulty,ambiguity,truth_label,reason_key,recommended_items
S-001,"Training increased deal size by 8%",Impact,2,3,false,"Seasonality confound","I303|I509"
```

## Accessibility Features

- **ARIA labels** - Screen reader support for all interactive elements
- **Keyboard navigation** - Full keyboard access (Tab, Enter, Ctrl+Enter shortcuts)
- **High contrast** - CSS custom properties for theme adaptation
- **Live regions** - Announcements for dynamic content changes
- **Focus management** - Logical tab order and focus indicators

## Scoring System

### Base Scoring
- Correct True/False: +100 points
- Correct Unknown: +70 points  
- Incorrect answer: -80 points
- No answer by recall: -20 points

### Efficiency Bonus
Applied when ≥80% statements attempted OR ≥12 completed:
- +1 point per unused $10 budget
- +1 point per unused 30 seconds

## WebSocket Events

### Client → Server
- `join_session` - Join as team or admin
- `team:setup` - Configure team name and members
- `team:purchase` - Buy store item
- `team:decision` - Submit True/False/Unknown choice
- `admin:start_round` - Begin timed round
- `admin:broadcast` - Send message to all teams

### Server → Client
- `state:update` - Game state changes
- `team:state` - Team-specific updates
- `timer:tick` - Countdown updates
- `purchase:delivered` - Item delivery notification
- `macro_round:start/recall` - Round control

## Development

### Running Tests
```bash
npm test
```

### Database Management
```bash
# Reset database
npx prisma db push --force-reset

# View data
npx prisma studio
```

### Building for Production
```bash
npm run build
npm start
```

## Deployment

The application can be deployed to any Node.js hosting platform:

1. **Environment Setup** - Configure DATABASE_URL and other env vars
2. **Database Migration** - Run `npx prisma generate && npx prisma db push`
3. **Build Application** - Run `npm run build`
4. **Start Server** - Run `npm start`

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:
- Check the GitHub Issues page
- Review the PRD document for detailed requirements
- Test with the included sample data first

---

**Built for learning professionals who want to practice data literacy through engaging, collaborative gameplay.**
