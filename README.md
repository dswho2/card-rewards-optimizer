# Card Rewards Optimizer
Credit Card Recommendation Web App – Project & Data Flow Outline

## Tech Stack
| Tool / Tech                  | Purpose                                                                 |
|------------------------------|-------------------------------------------------------------------------|
| **Next.js + TypeScript**     | Fullstack React framework with routing, SSR, and frontend UI           |
| **Tailwind CSS**             | Utility-first styling and responsive layout                            |
| **shadcn/ui**                | Accessible, styled UI components built on Tailwind CSS                 |
| **React Query (TanStack)**   | API data fetching and caching                                          |
| **Zod + React Hook Form**    | Form handling and schema validation                                    |
| **Flask / FastAPI**          | Lightweight backend API to process user input and recommendations      |
| **PostgreSQL**               | Persistent storage for user profiles and card data                     |
| **Supabase / Auth0**         | User authentication and session management                             |
| **OpenAI API**               | Semantic understanding of user input (e.g. purchase intent → category) |
| **Recharts / Visx**          | Visual coverage grid heatmap rendering                                 |
| **Playwright / Puppeteer** (Optional) | Scraping reward data from credit card aggregator sites        |
| **Docker** (Optional)        | Containerized backend + deployment support                             |
| **Vercel**                   | Frontend hosting (optimized for Next.js)                               |
| **Render / Railway**         | Backend + database hosting                                             |
## High-Level App Flow

1. **User signs up / logs in**
2. **User selects the credit cards they own**
3. **User inputs a description of a purchase**  
   e.g. "I’m booking a hotel in New York"
4. **System maps the input to a reward category**  
   e.g. "travel"
5. **System finds the user's card(s) with the best reward for that category**
6. **Returns recommendation with reasoning and caveats (if any)**
7. Show visual breakdown of their card coverage by category
8. Suggest new cards that fill category gaps

---

## Backend Data Flow

### 1. User Input
- Text: `"buy groceries at Trader Joe's"`

### 2. Category Mapping
- Preprocessed using:
  - Keyword rules (MVP)
  - or Semantic Embedding similarity
  - or LLM prompt classification
- Result: `"grocery"`

### 3. User’s Card List
- Pulled from user profile
- e.g. `["amex_blue_cash", "citi_custom_cash", "chase_freedom_flex"]`

### 4. Reward Lookup
- For each card:
  - Find matching reward rules for `"grocery"`
  - Evaluate:
    - reward rate (numeric)
    - units (`percent`, `points`)
    - cap? (`$500/month`, etc)
    - special conditions (e.g. portal only)

### 5. Scoring Logic
- Rank cards by:
  - Effective rate
  - Simplicity (e.g. no portal requirement)
  - Remaining cap (if tracked)
- Result: list of best cards, sorted

### 6. Response
- JSON response to frontend:
```json
{
  "category": "grocery",
  "recommendations": [
    {
      "cardName": "Amex Blue Cash Preferred",
      "rate": 6,
      "unit": "percent",
      "notes": "Valid at U.S. supermarkets, up to $6,000/year"
    },
    {
      "cardName": "Citi Custom Cash",
      "rate": 5,
      "unit": "percent",
      "notes": "Only your top monthly category (up to $500/month)"
    }
  ]
}
```

## Frontend Flow

### 1. Login Screen
- Auth system (Supabase/Auth0/etc)

### 2. Card Selection UI
- List of supported cards
- Toggle/select cards user owns

### 3. Purchase Input Form
- Freeform text input
- On submit → calls backend /recommend endpoint

### 4. Recommendation Display
- Shows:
    - Top recommended card
    - Reward rate
    - Conditions or caps
    - Secondary options
- Optional toggle for full breakdown

### 5. Visual Coverage
- Grid style interactive heat map
    - What categories are covered?
    - What rate is covered?
    - What categories are missing?
        - users can hover and click into to view the card info

#### Design
The heatmap is structured as a **grid**:

- **Rows**: Spending categories (e.g. Dining, Travel, Grocery, Gas, etc.)
- **Columns**: User-selected credit cards
- **Cells**: Reward rates (e.g. 1x, 3x, 5%) for each card-category pair
  - Color intensity scales with reward rate
  - Cells are interactive:
    - **Hover** → Tooltip with detailed reward info and restrictions
    - **Click** → Modal with full explanation or add new card

#### Visual Example

| Category ↓ \ Card → | Amex Gold | Freedom Flex | Citi Custom Cash |
|---------------------|-----------|---------------|------------------|
| Dining              | 🟥 4x      | 🟨 3x         | ⬜ 1x             |
| Grocery             | 🟧 4x      | ⬜ 1x         | 🟥 5x (cap: $500/mo) |
| Travel              | 🟨 3x      | 🟥 5x (Q3 only) | ⬜ 1x           |
| Gas                 | ⬜ 1x      | 🟥 5x (Q2 only) | 🟥 5x           |

- 🟥 = High reward (5x+)
- 🟧 = Medium (3–4x)
- 🟨 = Low (2–3x)
- ⬜ = Default / fallback (1x or less)

#### Implementation Notes
- Built using a responsive, interactive grid with dynamic color scaling
- Powered by user's selected credit card data and internal reward category mappings
- Optionally integrates with the recommendation engine to highlight best card per category

#### Extras
- Ability to click a category and see recommended new cards to fill coverage gaps
- Simulated reward earnings based on user's spend profile
- Export/share visual to compare card setups

### 6. Suggested Cards
- Based on missing categories + estimated spend

## Data Model Summary

### CreditCard
```
{
  id: "amex_blue_cash_preferred",
  name: "Amex Blue Cash Preferred",
  issuer: "Amex",
  annualFee: 95,
  rewards: [
    {
      categories: ["grocery"],
      rate: 6,
      unit: "percent",
      maxRewardedAmount: 6000,
      maxRewardedInterval: "year"
    },
    {
      categories: ["general"],
      rate: 1,
      unit: "percent",
      baseReward: true
    }
  ]
}
```

### UserProfile
```
{
  id: "user_123",
  email: "test@example.com",
  selectedCards: ["amex_blue_cash_preferred", "chase_freedom_flex"]
}
```
